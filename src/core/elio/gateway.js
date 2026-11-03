import {getAIRouting,updateAIRouting} from './ai-routing.js';
import {startGoogleAuth,completeGoogleAuth,googleStateCookie} from './google-auth.js';
import {readVocabularyDeck,saveSharedWord} from './personal-vocabulary.js';
import {focusTimer,studyStatistics,STUDY_KEY} from './study.js';
import {tutorReply,newTutorThread,TUTOR_KEY} from './tutor.js';
import {importCollection,extractDocument} from './importer.js';
import {examFormats,startExam,answerExam,readExams,examCatalogData} from './examination.js';
import {getTranscript,submitDictation,LISTENING_KEY} from './listening.js';
import { coreError, query } from './database.js';
import { digest, passwordHash, passwordMatches, randomToken } from './passwords.js';
import { readVocabulary, reviewVocabulary, REVIEW_KEY } from './vocabulary.js';
import { listGrammar, readGrammarLesson, importGrammar, submitGrammar, GRAMMAR_ATTEMPT_KEY } from './grammar.js';
import {listAIConfigs,addAIConfig,modelsForConfig,updateAIConfig,discoverForAdmin,generateAI,generateGermanSpeech,testAIConfig} from './ai.js';
import {gradeWriting,translateWriting,WRITING_KEY} from './writing.js';
import {speakingReply,gradeSpeaking,transcribeGerman,SPEAKING_KEY} from './speaking.js';

// Elio's per-account records and optimistic revisions, mapped to the existing ee_* schema.
// No bootstrap account, schema initialization, password rewrite, or bulk migration runs here.
export const CORE_KEYS = new Set(['wc', 'drafts', 'vocab', 'history', 'settings', 'events', 'lessons',
  'grammarAttempts', 'materials', 'conversations', 'srs', 'examAttempts', 'activeExam', 'writingFeedback',
  'vocabSession', 'grammarSession', 'chatDrafts', 'examMediaIndex', 'reviewHistory', 'listening',
  'listeningLibrary', 'listeningV2', 'listeningLibraryV2', 'studyPlan', 'studyPlanProgress',
  'sprach_profile', 'sprach_vocabulary', 'sprach_study_logs', 'sprach_skill_sessions',
  'sprach_exam_results', 'sprach_notes', 'sprach_study_plan', REVIEW_KEY, GRAMMAR_ATTEMPT_KEY, WRITING_KEY, SPEAKING_KEY, LISTENING_KEY, STUDY_KEY, TUTOR_KEY]);
const COOKIE = '__Host-sprach_core';
const SESSION_MS = 7 * 86400000;
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...headers },
});
const publicUser = row => ({ id: row.id, email: row.email, name: row.name,
  role: ['super_admin', 'admin'].includes(row.role) ? 'admin' : 'user' });
const cookieValue = request => (request.headers.get('Cookie') || '').match(/(?:^|;\s*)__Host-sprach_core=([a-f0-9]{64})(?:;|$)/)?.[1];
const cookieHeader = (token, age = 604800) => `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
async function body(request, max = 10000) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    throw coreError(415, 'CONTENT_TYPE', 'Yêu cầu cần JSON.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw coreError(400, 'INVALID_JSON', 'Thiếu dữ liệu JSON.');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); throw coreError(413, 'TOO_LARGE', 'Dữ liệu quá lớn.'); }
    chunks.push(value);
  }
  let data;
  try {
    const bytes = new Uint8Array(size); let at = 0;
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.byteLength; }
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch { throw coreError(400, 'INVALID_JSON', 'JSON không hợp lệ.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw coreError(400, 'INVALID_JSON', 'Cần một đối tượng JSON.');
  return data;
}
async function throttle(env, key, max, windowMs) {
  const now = Date.now();
  const result = await query(env, `INSERT INTO sprach_core_limits (name,count,until_at) VALUES (?,1,?)
    ON CONFLICT(name) DO UPDATE SET count=CASE WHEN until_at<=? THEN 1 ELSE count+1 END,
    until_at=CASE WHEN until_at<=? THEN excluded.until_at ELSE until_at END RETURNING count`,
  [key, now + windowMs, now, now]);
  if (Number(result.rows[0]?.count) > max) throw coreError(429, 'RATE_LIMIT', 'Thử quá nhiều lần; vui lòng chờ.');
}
async function authenticate(request, env) {
  const token = cookieValue(request);
  if (!token) throw coreError(401, 'AUTH_REQUIRED', 'Bạn cần đăng nhập.');
  const row = (await query(env, `SELECT u.id,u.email,u.name,u.role,u.blocked FROM sprach_core_sessions s
    JOIN ee_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?`, [await digest(token), Date.now()])).rows[0];
  if (!row) throw coreError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
  if (row.blocked) throw coreError(403, 'ACCOUNT_BLOCKED', 'Tài khoản đang bị khóa.');
  const expected = request.headers.get('X-Elio-User');
  if (expected && expected !== row.id) throw coreError(409, 'ACCOUNT_CHANGED', 'Tài khoản đã thay đổi; dữ liệu chưa được ghi.');
  return row;
}
async function issueSession(env, user) {
  const token = randomToken();
  await query(env, 'INSERT INTO sprach_core_sessions(token_hash,user_id,expires,created_at) VALUES(?,?,?,?)',
    [await digest(token), user.id, Date.now() + SESSION_MS, Date.now()]);
  return json({ user: publicUser(user) }, 200, { 'Set-Cookie': cookieHeader(token) });
}
async function auth(request, env, path) {
  if (request.method !== 'POST') throw coreError(405, 'METHOD', 'Phương thức không được hỗ trợ.');
  const data = await body(request, 2000);
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (!/^\S+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      typeof data.password !== 'string' || !data.password || data.password.length > 128) {
    throw coreError(400, 'AUTH_INPUT', 'Email hoặc mật khẩu không hợp lệ.');
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  await throttle(env, 'auth-ip:' + await digest(ip), 60, 15 * 60000);
  await throttle(env, 'auth-user:' + await digest(ip + ':' + email), 10, 15 * 60000);
  const existing = (await query(env, 'SELECT * FROM ee_users WHERE lower(email)=?', [email])).rows[0];
  if (path.endsWith('/login')) {
    if (!existing || !await passwordMatches(data.password, existing.password)) {
      // Unknown legacy encodings and google$ credentials fail closed; existing rows remain intact.
      throw coreError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác.');
    }
    if (existing.blocked) throw coreError(403, 'ACCOUNT_BLOCKED', 'Tài khoản đang bị khóa.');
    return issueSession(env, existing);
  }
  if (data.password.length < 8) throw coreError(400, 'AUTH_INPUT', 'Mật khẩu mới cần ít nhất 8 ký tự.');
  if (existing) throw coreError(409, 'ACCOUNT_EXISTS', 'Email đã có tài khoản; dữ liệu cũ được giữ nguyên.');
  const user = { id: crypto.randomUUID(), email, name: typeof data.name === 'string' ? data.name.trim().slice(0, 100) : email.split('@')[0], role: 'user' };
  await query(env, 'INSERT INTO ee_users(id,email,name,password,role,created_at) VALUES(?,?,?,?,?,?)',
    [user.id, email, user.name, await passwordHash(data.password), user.role, new Date().toISOString()]);
  return issueSession(env, user);
}
async function state(request, env, user, url) {
  if (request.method === 'GET') {
    const requested = url.searchParams.get('keys');
    const keys = requested === null ? [...CORE_KEYS] : [...new Set(requested.split(','))];
    if (!keys.length || keys.some(key => !CORE_KEYS.has(key))) throw coreError(400, 'STATE_KEY', 'Loại dữ liệu không hợp lệ.');
    const rows = (await query(env, `SELECT key,value,revision FROM ee_state WHERE owner=? AND key IN (${keys.map(() => '?').join(',')})`, [user.id, ...keys])).rows;
    return json({ userId: user.id, records: Object.fromEntries(rows.map(row => [row.key, { value: JSON.parse(row.value), version: row.revision }])) });
  }
  if (request.method !== 'PUT') throw coreError(405, 'METHOD', 'Phương thức không được hỗ trợ.');
  const data = await body(request, 1500000);
  if (Object.keys(data).some(key => !['name', 'value', 'version'].includes(key)) ||
      !CORE_KEYS.has(data.name) || [REVIEW_KEY, GRAMMAR_ATTEMPT_KEY, WRITING_KEY, SPEAKING_KEY, LISTENING_KEY, STUDY_KEY, TUTOR_KEY].includes(data.name) || !Object.hasOwn(data, 'value') || !Number.isSafeInteger(data.version) || data.version < 0) {
    throw coreError(400, 'STATE_INPUT', 'Dữ liệu hoặc phiên bản không hợp lệ.');
  }
  const value = JSON.stringify(data.value);
  // Compare-and-swap: stale devices never overwrite newer progress.
  const result = data.version === 0
    ? await query(env, 'INSERT INTO ee_state(owner,key,value,revision) VALUES(?,?,?,1) ON CONFLICT(owner,key) DO NOTHING RETURNING revision', [user.id, data.name, value])
    : await query(env, 'UPDATE ee_state SET value=?,revision=revision+1 WHERE owner=? AND key=? AND revision=? RETURNING revision', [value, user.id, data.name, data.version]);
  if (!result.rows.length) {
    const latest = (await query(env, 'SELECT value,revision FROM ee_state WHERE owner=? AND key=?', [user.id, data.name])).rows[0];
    return json({ code: 'VERSION_CONFLICT', error: 'Có tiến độ mới hơn; chưa ghi đè.', latest: latest ? { value: JSON.parse(latest.value), version: latest.revision } : null }, 409);
  }
  return json({ version: result.rows[0].revision, userId: user.id });
}
export async function handleElioCore(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (path === '/api/core/config' && request.method === 'GET') return json({ enabled: env.ELIO_CORE_ENABLED === 'true', uiAuthEnabled:env.ELIO_CORE_UI_AUTH_ENABLED==='true',uiVocabularyEnabled:env.ELIO_CORE_UI_VOCABULARY_ENABLED==='true',uiTutorEnabled:env.ELIO_CORE_UI_TUTOR_ENABLED==='true',uiWritingEnabled:env.ELIO_CORE_UI_WRITING_ENABLED==='true',uiAIAdminEnabled:env.ELIO_CORE_UI_AI_ADMIN_ENABLED==='true',uiSpeakingEnabled:env.ELIO_CORE_UI_SPEAKING_ENABLED==='true',uiListeningEnabled:env.ELIO_CORE_UI_LISTENING_ENABLED==='true', version: 1 });
  if (env.ELIO_CORE_ENABLED !== 'true') return json({ code: 'CORE_DISABLED', error: 'Core migration chưa được kích hoạt.' }, 503);
  try {
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') !== url.origin) throw coreError(403, 'ORIGIN', 'Origin không hợp lệ.');
    if (path === '/api/core/auth/google/start' && request.method === 'POST') {
      await throttle(env,'core-google:'+await digest(request.headers.get('CF-Connecting-IP')||'unknown'),20,60000);const input=await body(request,1000);const user=input.link===true?await authenticate(request,env):null;
      if(user&&request.headers.get('X-Elio-User')!==user.id)throw coreError(409,'ACCOUNT_CHANGED','Tài khoản đã thay đổi.');
      const result=await startGoogleAuth(request,env,input,user);return json({url:result.url},200,{'Set-Cookie':result.cookie});
    }
    if (path === '/api/core/auth/google/callback' && request.method === 'GET') {
      let destination,sessionCookie=null;
      try{const user=await completeGoogleAuth(request,env),session=await issueSession(env,user);sessionCookie=session.headers.get('Set-Cookie');destination=publicUser(user).role==='admin'?'/#/admin':'/#/';}
      catch(error){const allowed=['GOOGLE_NOT_LINKED','GOOGLE_ALREADY_LINKED','GOOGLE_STATE','ACCOUNT_BLOCKED','GOOGLE_NOT_CONFIGURED','GOOGLE_IDENTITY'];const code=allowed.includes(error.code)?error.code:'GOOGLE_IDENTITY';destination='/#/login?coreAuthError='+code;}
      const headers=new Headers({'Location':new URL(destination,request.url).href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});if(sessionCookie)headers.append('Set-Cookie',sessionCookie);headers.append('Set-Cookie',googleStateCookie('',0));return new Response(null,{status:303,headers});
    }
    if (['/api/core/auth/login', '/api/core/auth/register'].includes(path)) return await auth(request, env, path);
    const user = await authenticate(request, env);
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('X-Elio-User') !== user.id) {
      throw coreError(409, 'ACCOUNT_CHANGED', 'Cần xác nhận đúng tài khoản trước khi ghi dữ liệu.');
    }
    if (path === '/api/core/auth/me' && request.method === 'GET') return json({ user: publicUser(user) });
    if (path === '/api/core/auth/logout' && request.method === 'POST') {
      await query(env, 'DELETE FROM sprach_core_sessions WHERE token_hash=? AND user_id=?', [await digest(cookieValue(request)), user.id]);
      return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader('', 0) });
    }
    if (path === '/api/core/listening/transcript' && request.method === 'POST') {
      await throttle(env,'core-caption:'+user.id,10,60000);const result=await getTranscript(env,await body(request,3000));return json(result,result.available?200:503);
    }
    if (path === '/api/core/listening/submit' && request.method === 'POST') {
      const result=await submitDictation(env,user,await body(request,15000));return json(result,result.conflict?409:200);
    }
    if (path === '/api/core/exam/formats' && request.method === 'GET') return json(examFormats());
    if (path === '/api/core/exam/attempts' && request.method === 'GET') return json(await readExams(env,user));
    if (['/api/core/exam/start','/api/core/exam/answers','/api/core/exam/submit'].includes(path) && request.method === 'POST') {
      const input=await body(request,100000);const result=path.endsWith('/start')?await startExam(env,user,input):await answerExam(env,user,input,path.endsWith('/submit'));return json(result,result.conflict?409:200);
    }
    if (path === '/api/core/import/collection' && request.method === 'POST') return json(await importCollection(env,user,await body(request,1600000)));
    if (path === '/api/core/import/extract' && request.method === 'POST') {
      await throttle(env,'core-ocr:'+user.id,5,60000);const result=await extractDocument(env,user,await body(request,15000000));return json(result,result.partial?202:200);
    }
    if (path === '/api/core/study/statistics' && request.method === 'GET') return json(await studyStatistics(env,user));
    if (path === '/api/core/study/timer' && request.method === 'POST') {const result=await focusTimer(env,user,await body(request,3000));return json(result,result.conflict?409:200);}
    if (path === '/api/core/tutor/new' && request.method === 'POST') {await throttle(env,'core-tutor-new:'+user.id,20,60000);const result=await newTutorThread(env,user,await body(request,1000));return json(result,result.conflict?409:200);}
    if (path === '/api/core/tutor/reply' && request.method === 'POST') {
      await throttle(env,'core-ai:'+user.id,20,60000);const result=await tutorReply(env,user,await body(request,700000));return json(result,result.conflict?409:result.partial?202:200);
    }
    if (path === '/api/core/vocabulary/deck' && request.method === 'GET') return json(await readVocabularyDeck(env,user,url.searchParams.get('id')));
    if (path === '/api/core/vocabulary/save' && request.method === 'POST') {const result=await saveSharedWord(env,user,await body(request,3000));return json(result,result.conflict?409:200);}
    if (path === '/api/core/state') return await state(request, env, user, url);
    if (['/api/core/speaking/reply','/api/core/speaking/grade'].includes(path) && request.method === 'POST') {
      await throttle(env,'core-ai:'+user.id,20,60000);const data=await body(request,700000);
      const result=path.endsWith('/reply')?await speakingReply(env,user,data):await gradeSpeaking(env,user,data);
      if(result.conflict)return json({code:'VERSION_CONFLICT',error:'Có phiên nói mới hơn; chưa ghi đè.',version:result.version},409);
      return json(result,result.partial?202:200);
    }
    if (path === '/api/core/speech/transcribe' && request.method === 'POST') {
      await throttle(env,'core-stt:'+user.id,10,60000);return json(await transcribeGerman(env,user,await body(request,15000000)));
    }
    if (path === '/api/core/speech/tts' && request.method === 'POST') {
      await throttle(env,'core-tts:'+user.id,20,60000);return json(await generateGermanSpeech(env,user,await body(request,10000)));
    }
    if (['/api/core/writing/grade','/api/core/writing/translate'].includes(path) && request.method === 'POST') {
      await throttle(env,'core-ai:'+user.id,20,60000);
      const input=await body(request,700000),result=path.endsWith('/grade')?await gradeWriting(env,user,input):await translateWriting(env,user,input);
      if(result.conflict)return json({code:'VERSION_CONFLICT',error:'Có lịch sử mới hơn; chưa ghi đè bài chữa.',version:result.version},409);
      return json(result,result.partial?202:200);
    }
    if (path === '/api/core/admin/ai/routing' && request.method === 'GET') return json(await getAIRouting(env,user));
    if (path === '/api/core/admin/ai/routing' && request.method === 'PATCH') return json(await updateAIRouting(env,user,await body(request,20000)));
    if (path === '/api/core/admin/ai/test' && request.method === 'POST') {await throttle(env,'core-ai-test:'+user.id,10,60000);return json(await testAIConfig(env,user,await body(request,5000)));}
    if (path === '/api/core/admin/ai/configs' && request.method === 'GET') return json(await listAIConfigs(env,user));
    if (path === '/api/core/admin/ai/configs' && request.method === 'POST') return json(await addAIConfig(env,user,await body(request,4000)));
    if (path === '/api/core/admin/ai/configs' && request.method === 'PATCH') return json(await updateAIConfig(env,user,await body(request,1000)));
    if (path === '/api/core/admin/ai/discover' && request.method === 'POST') return json(await discoverForAdmin(env,user,await body(request,4000)));
    if (path === '/api/core/admin/ai/models' && request.method === 'POST') {
      const data=await body(request,1000);return json(await modelsForConfig(env,user,data.id));
    }
    if (path === '/api/core/ai' && request.method === 'POST') {
      await throttle(env,'core-ai:'+user.id,20,60000);
      const result=await generateAI(env,user,await body(request,16000000));
      return json(result,result.truncated?202:200);
    }
    if (path === '/api/core/grammar' && request.method === 'GET') return json(await listGrammar(env, user, url));
    if (path === '/api/core/grammar/lesson' && request.method === 'GET') {
      return json(await readGrammarLesson(env, user, url.searchParams.get('collection'), url.searchParams.get('id')));
    }
    if (path === '/api/core/grammar/import' && request.method === 'POST') {
      return json(await importGrammar(env, user, await body(request, 1500000)));
    }
    if (path === '/api/core/grammar/submit' && request.method === 'POST') {
      const result = await submitGrammar(env, user, await body(request, 16000));
      if (result.conflict) return json({ code: 'VERSION_CONFLICT', error: 'Có lịch sử mới hơn; chưa ghi lại lượt chấm cũ.', version: result.version }, 409);
      return json(result);
    }
    if (path === '/api/core/vocabulary' && request.method === 'GET') {
      return json(await readVocabulary(env, url));
    }
    if (path === '/api/core/vocabulary/review' && request.method === 'POST') {
      const result = await reviewVocabulary(env, user, await body(request, 2000));
      if (result.conflict) return json({ code: 'VERSION_CONFLICT', error: 'Có tiến độ mới hơn; lần ôn chưa được ghi lại.', version: result.version }, 409);
      return json(result);
    }
    if (path === '/api/core/records' && request.method === 'GET') {
      const kind = url.searchParams.get('kind');
      if (!['grammar', 'vocab', 'writing', 'speaking', 'listening', 'exam'].includes(kind)) throw coreError(400, 'RECORD_KIND', 'Loại tài liệu không hợp lệ.');
      const limit=Number(url.searchParams.get('limit')??100),offset=Number(url.searchParams.get('offset')??0);
      if(!Number.isSafeInteger(limit)||limit<1||limit>200||!Number.isSafeInteger(offset)||offset<0)throw coreError(400,'PAGINATION','Phân trang không hợp lệ.');
      const rows=(await query(env, 'SELECT id,kind,title,level,public,data FROM ee_records WHERE kind=? AND (owner=? OR public=1) ORDER BY id LIMIT ? OFFSET ?', [kind, user.id,limit,offset])).rows;
      return json({items:rows.map(row=>kind==='exam'?{...row,data:examCatalogData(row.data)}:row),limit,offset});
    }
    if (path === '/api/core/admin/users' && request.method === 'GET') {
      if (publicUser(user).role !== 'admin') throw coreError(403, 'ADMIN_REQUIRED', 'Chỉ Admin được thực hiện.');
      return json({ items: (await query(env, 'SELECT id,email,name,role,blocked FROM ee_users ORDER BY id LIMIT 500')).rows });
    }
    throw coreError(404, 'NOT_FOUND', 'API chưa được chuyển sang core mới.');
  } catch (error) {
    return json({ code: error.status ? error.code : 'CORE_ERROR', error: error.status ? error.message : 'Core chưa sẵn sàng; dữ liệu hiện tại được giữ nguyên.' }, error.status || 503);
  }
}
