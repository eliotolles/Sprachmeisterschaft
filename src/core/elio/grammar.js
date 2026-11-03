import sourceBook from './data/grammar-book-a1-b2.json' with { type: 'json' };
import { coreError, query } from './database.js';
import { digest } from './passwords.js';
import { visibleExercises, validateGrammarCollection, gradeGrammarExercise, grammarMindmap } from './grammar-content.js';

export const GRAMMAR_ATTEMPT_KEY = 'sprach_grammar_attempts';
validateGrammarCollection(sourceBook);
const invalid = () => coreError(400, 'GRAMMAR_INPUT', 'Dữ liệu ngữ pháp không hợp lệ.');
async function collections(env, user) {
  const selected = new Map([[sourceBook.id, { collection: sourceBook, priority: 0, recordId: null, public: true }]]);
  const rows = (await query(env, "SELECT id,owner,public,data,updated_at FROM ee_records WHERE kind='grammar' AND (owner=? OR public=1) ORDER BY updated_at,id", [user.id])).rows;
  for (const row of rows) {
    let collection;
    try { collection = JSON.parse(row.data); } catch { continue; }
    // Empty or malformed legacy imports are preserved and not published as fake lessons.
    try { validateGrammarCollection(collection); } catch { continue; }
    const priority = row.owner === user.id ? 2 : 1;
    if (!selected.has(collection.id) || selected.get(collection.id).priority <= priority) {
      selected.set(collection.id, { collection, priority, recordId: row.id, public: !!row.public });
    }
  }
  return [...selected.values()];
}
async function findLesson(env, user, collectionId, lessonId) {
  if (typeof collectionId !== 'string' || typeof lessonId !== 'string' || collectionId.length > 128 || lessonId.length > 128) throw invalid();
  const entry = (await collections(env, user)).find(e => e.collection.id === collectionId);
  const lesson = entry?.collection.items.find(item => item.id === lessonId);
  if (!lesson) throw coreError(404, 'LESSON_NOT_FOUND', 'Không tìm thấy bài học được phép đọc.');
  return { lesson, entry };
}
export async function listGrammar(env, user, url) {
  const level = url.searchParams.get('level'), search = (url.searchParams.get('q') || '').trim().toLocaleLowerCase('de');
  const limit = Number(url.searchParams.get('limit') ?? 100), offset = Number(url.searchParams.get('offset') ?? 0);
  if ((level && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) || search.length > 120 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 200 || !Number.isSafeInteger(offset) || offset < 0) throw invalid();
  const lessons = (await collections(env, user)).flatMap(({ collection, recordId, public: shared }) => collection.items.map(lesson => ({
    collectionId: collection.id, collectionName: collection.name || collection.id,
    id: lesson.id, title: lesson.title, level: lesson.level, exerciseCount: visibleExercises(lesson).length,
    recordId, shared,
  }))).filter(lesson => (!level || lesson.level === level) && (!search || (lesson.title + ' ' + lesson.collectionName).toLocaleLowerCase('de').includes(search)));
  return { total: lessons.length, lessons: lessons.slice(offset, offset + limit) };
}
export async function readGrammarLesson(env, user, collectionId, lessonId) {
  const { lesson, entry } = await findLesson(env, user, collectionId, lessonId);
  const exercises = await Promise.all(visibleExercises(lesson).map(async exercise => ({
    id: exercise.id, type: exercise.type, question: exercise.question,
    ...(exercise.options ? { options: exercise.options } : {}), ...(exercise.tokens ? { tokens: exercise.tokens } : {}),
    // Full source fingerprint detects an answer-key edit even if the question is unchanged.
    revision: await digest(JSON.stringify(exercise)),
  })));
  return { collectionId, id: lesson.id, title: lesson.title, level: lesson.level, content: lesson.content,
    source: entry.collection.source || null, recordId: entry.recordId, exercises, mindmap: grammarMindmap(lesson) };
}
export async function importGrammar(env, user, data) {
  if (!data || Object.keys(data).some(key => !['collection', 'visibility'].includes(key)) ||
      (data.visibility !== undefined && !['private', 'public'].includes(data.visibility))) throw invalid();
  const admin = ['admin', 'super_admin'].includes(user.role), shared = data.visibility ? data.visibility === 'public' : admin;
  if (shared && !admin) throw coreError(403, 'ADMIN_REQUIRED', 'Chỉ Admin được nhập tài liệu chung.');
  let collection;
  try { collection = validateGrammarCollection(data.collection); } catch { throw invalid(); }
  if (new TextEncoder().encode(JSON.stringify(collection)).byteLength > 1400000) throw coreError(413, 'GRAMMAR_SIZE', 'Bộ ngữ pháp quá lớn.');
  const duplicate=(await query(env,"SELECT data FROM ee_records WHERE owner=? AND kind='grammar'",[user.id])).rows.some(row=>{try{return JSON.parse(row.data).id===collection.id;}catch{return false;}});
  if(duplicate)throw coreError(409,'IMPORT_EXISTS','ID bộ ngữ pháp đã có; chưa ghi đè hoặc nhân đôi.');
  const recordId = 'grammar-import-'+await digest(JSON.stringify([user.id,collection.id])), title = String(collection.name || collection.id).slice(0, 500);
  // Create-only: user-supplied source IDs never become an UPDATE target.
  const written=await query(env, 'INSERT INTO ee_records(id,owner,kind,title,level,public,data,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id',
    [recordId, user.id, 'grammar', title, collection.items[0].level, shared ? 1 : 0, JSON.stringify(collection), new Date().toISOString()]);
  if(!written.rows.length)throw coreError(409,'IMPORT_EXISTS','ID bộ ngữ pháp đã được nhập; chưa ghi đè.');
  return { recordId, collectionId: collection.id, lessonCount: collection.items.length, visibility: shared ? 'public' : 'private' };
}
export async function submitGrammar(env, user, data, now = Date.now()) {
  if (!data || Object.keys(data).some(key => !['collectionId', 'lessonId', 'exerciseId', 'revision', 'answer', 'version'].includes(key)) ||
      typeof data.exerciseId !== 'string' || data.exerciseId.length > 256 || typeof data.revision !== 'string' ||
      !Number.isSafeInteger(data.version) || data.version < 0 || typeof data.answer !== 'string' || !data.answer.trim() || data.answer.length > 10000) throw invalid();
  const { lesson } = await findLesson(env, user, data.collectionId, data.lessonId);
  const exercise = visibleExercises(lesson).find(ex => ex.id === data.exerciseId);
  if (!exercise) throw coreError(404, 'EXERCISE_NOT_FOUND', 'Không tìm thấy bài tập đã kiểm chứng.');
  if (await digest(JSON.stringify(exercise)) !== data.revision) throw coreError(409, 'EXERCISE_CHANGED', 'Bài tập đã thay đổi; chưa chấm theo đáp án cũ.');
  let feedback;
  try { feedback = gradeGrammarExercise(exercise, data.answer); }
  catch { throw coreError(422, 'ANSWER_KEY_REQUIRED', 'Bài này chưa có đáp án nguồn được kiểm chứng; chưa tự chấm bằng AI.'); }
  const row = (await query(env, 'SELECT value,revision FROM ee_state WHERE owner=? AND key=?', [user.id, GRAMMAR_ATTEMPT_KEY])).rows[0];
  const version = row?.revision ?? 0;
  if (version !== data.version) return { conflict: true, version };
  let document;
  try { document = row ? JSON.parse(row.value) : { attempts: [] }; }
  catch { throw coreError(409, 'ATTEMPT_DATA_INVALID', 'Lịch sử cũ không hợp lệ; chưa ghi đè.'); }
  if (!document || !Array.isArray(document.attempts)) throw coreError(409, 'ATTEMPT_DATA_INVALID', 'Lịch sử cũ không hợp lệ; chưa ghi đè.');
  document.attempts.push({ collectionId: data.collectionId, lessonId: lesson.id, exerciseId: exercise.id,
    revision: data.revision, answer: data.answer, ...feedback, time: now });
  const value = JSON.stringify(document);
  if (new TextEncoder().encode(value).byteLength > 1500000) throw coreError(413, 'ATTEMPT_HISTORY_LIMIT', 'Cần lưu trữ lịch sử bổ sung; chưa xóa dữ liệu cũ.');
  const result = version === 0
    ? await query(env, 'INSERT INTO ee_state(owner,key,value,revision) VALUES(?,?,?,1) ON CONFLICT(owner,key) DO NOTHING RETURNING revision', [user.id, GRAMMAR_ATTEMPT_KEY, value])
    : await query(env, 'UPDATE ee_state SET value=?,revision=revision+1 WHERE owner=? AND key=? AND revision=? RETURNING revision', [value, user.id, GRAMMAR_ATTEMPT_KEY, version]);
  if (!result.rows.length) return { conflict: true };
  return { userId: user.id, collectionId: data.collectionId, lessonId: lesson.id, exerciseId: exercise.id,
    version: result.rows[0].revision, feedback };
}
