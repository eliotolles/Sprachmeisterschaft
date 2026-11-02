import { coreError, query } from './database.js';
import { scheduleReview, RATINGS } from './srs.js';

export const REVIEW_KEY = 'sprach_vocabulary_reviews';
const COLUMNS = 'source_id,german,article,word_type,vietnamese,example_de,example_vi,topic,level,source_deck_id,extra_json';
const fail = () => coreError(400, 'VOCABULARY_INPUT', 'Thông tin ôn từ không hợp lệ.');
export async function readVocabulary(env, url) {
  const limit = Number(url.searchParams.get('limit') ?? 100), offset = Number(url.searchParams.get('offset') ?? 0);
  const search = (url.searchParams.get('q') || '').trim().toLocaleLowerCase('de');
  const deck = url.searchParams.get('deck'), level = url.searchParams.get('level');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || search.length > 120 ||
      (level && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) || (deck && deck.length > 128)) throw fail();
  const where = [], args = [];
  if (search) {
    // SQLite lower() alone does not case-fold German umlauts. Normalize these
    // explicitly, and escape LIKE syntax so '%' and '_' remain literal input.
    const folded = column => `lower(replace(replace(replace(replace(${column},'Ä','ä'),'Ö','ö'),'Ü','ü'),'ẞ','ß'))`;
    const pattern = '%' + search.replace(/[\\%_]/g, char => '\\' + char) + '%';
    where.push('(' + ['german', 'vietnamese', "coalesce(json_extract(extra_json,'$.english'),'')"].map(c => folded(c) + " LIKE ? ESCAPE '\\'").join(' OR ') + ')');
    args.push(pattern, pattern, pattern);
  }
  if (deck) { where.push('source_deck_id=?'); args.push(deck); }
  if (level) { where.push('level=?'); args.push(level); }
  const rows = (await query(env, `SELECT ${COLUMNS} FROM elio_shared_vocabulary${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY source_id LIMIT ? OFFSET ?`, [...args, limit, offset])).rows;
  return { cards: rows };
}
export async function reviewVocabulary(env, user, data, now = Date.now()) {
  if (!data || Object.keys(data).some(key => !['sourceId', 'rating', 'version', 'direction'].includes(key)) ||
      typeof data.sourceId !== 'string' || !data.sourceId || data.sourceId.length > 128 ||
      !RATINGS.includes(data.rating) || !Number.isSafeInteger(data.version) || data.version < 0 ||
      (data.direction !== undefined && !['de', 'vi'].includes(data.direction))) throw fail();
  const word = (await query(env, 'SELECT source_id FROM elio_shared_vocabulary WHERE source_id=?', [data.sourceId])).rows[0];
  if (!word) throw coreError(404, 'WORD_NOT_FOUND', 'Không tìm thấy từ nguồn; chưa ghi tiến độ.');
  const stored = (await query(env, 'SELECT value,revision FROM ee_state WHERE owner=? AND key=?', [user.id, REVIEW_KEY])).rows[0];
  const version = stored?.revision ?? 0;
  if (version !== data.version) return { conflict: true, version };
  let document;
  try { document = stored ? JSON.parse(stored.value) : { cards: {}, history: [] }; }
  catch { throw coreError(409, 'REVIEW_DATA_INVALID', 'Tiến độ cũ chưa đọc được; dữ liệu được giữ nguyên.'); }
  if (!document || !document.cards || typeof document.cards !== 'object' || Array.isArray(document.cards) || !Array.isArray(document.history)) {
    throw coreError(409, 'REVIEW_DATA_INVALID', 'Tiến độ cũ chưa đọc được; dữ liệu được giữ nguyên.');
  }
  const direction = data.direction || 'de', key = encodeURIComponent(data.sourceId + '|' + direction);
  let review;
  try { review = scheduleReview(Object.hasOwn(document.cards, key) ? document.cards[key] : undefined, data.rating, now); }
  catch { throw coreError(409, 'REVIEW_DATA_INVALID', 'Lịch ôn cũ không hợp lệ; dữ liệu được giữ nguyên.'); }
  document.cards[key] = review;
  document.history.push({ sourceId: data.sourceId, direction, rating: data.rating, time: now, nextReview: review.dueAt });
  const value = JSON.stringify(document);
  // Do not silently discard history to make a write fit the storage limit.
  if (new TextEncoder().encode(value).byteLength > 1500000) throw coreError(413, 'REVIEW_HISTORY_LIMIT', 'Lịch sử cần lưu trữ bổ sung; chưa xóa hoặc ghi đè lịch sử cũ.');
  const result = version === 0
    ? await query(env, 'INSERT INTO ee_state(owner,key,value,revision) VALUES(?,?,?,1) ON CONFLICT(owner,key) DO NOTHING RETURNING revision', [user.id, REVIEW_KEY, value])
    : await query(env, 'UPDATE ee_state SET value=?,revision=revision+1 WHERE owner=? AND key=? AND revision=? RETURNING revision', [value, user.id, REVIEW_KEY, version]);
  if (!result.rows.length) return { conflict: true };
  return { version: result.rows[0].revision, userId: user.id, sourceId: data.sourceId, direction, review };
}
