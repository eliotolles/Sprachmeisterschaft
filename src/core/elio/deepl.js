// DeepL API (gói Developer miễn phí) cho dịch phụ đề Đức–Việt.
// Thiết kế đã chốt với anh Elio 19/11/2026:
// - DeepL dịch TRƯỚC (nhanh, dịch theo ngữ cảnh, chạy phía server nên
//   máy người dùng không nặng thêm).
// - Hết 1.000.000 ký tự (MỘT LẦN duy nhất, KHÔNG cộng lại mỗi tháng) thì
//   tự chuyển sang AI và Ở LẠI AI — không tự mở lại DeepL tháng sau.
//   Ngày 19/12 trên trang DeepL chỉ là hết kỳ hiện tại, không phải ngày nạp lại.
// - Khóa API KHÔNG BAO GIỜ ra trình duyệt: lưu mã hóa AES-GCM (secret-box,
//   như khóa AI) trong ee_config, chỉ Admin nhập/xem trạng thái.
// - Dịch phụ đề mới dùng DeepL; tra từ điển/ngữ pháp vẫn dùng hệ AI cũ,
//   không dùng model dịch để tự tạo nghĩa từ điển.
import { coreError, query } from './database.js';
import { encryptSecret, decryptSecret } from './secret-box.js';

const KEY_ROW = 'sprach:deepl:key';
const EXHAUSTED_ROW = 'sprach:deepl:exhausted';
const FREE_HOST = 'https://api-free.deepl.com';
const PRO_HOST = 'https://api.deepl.com';

function admin(user) {
  if (!['admin', 'super_admin'].includes(user.role)) throw coreError(403, 'ADMIN_REQUIRED', 'Chỉ Admin được quản lý khóa DeepL.');
}

function hostForKey(key) {
  // Khóa miễn phí kết thúc bằng :fx và dùng api-free.deepl.com.
  return /:fx$/.test(key) ? FREE_HOST : PRO_HOST;
}

async function readRow(env, key) {
  const row = (await query(env, 'SELECT value FROM ee_config WHERE key=?', [key])).rows[0];
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

async function writeRow(env, key, value) {
  await query(env, 'INSERT INTO ee_config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [key, JSON.stringify(value)]);
}

async function readKeyRecord(env) {
  const record = await readRow(env, KEY_ROW);
  if (!record || typeof record.secret !== 'string' || !record.secret) return null;
  return record;
}

async function markExhausted(env, info = {}) {
  await writeRow(env, EXHAUSTED_ROW, { exhausted: true, exhaustedAt: new Date().toISOString(), ...info });
}

async function clearExhausted(env) {
  await query(env, 'DELETE FROM ee_config WHERE key=?', [EXHAUSTED_ROW]);
}

async function callDeepL(host, key, path, { method = 'GET', body, timeoutMs = 30000 } = {}) {
  let response;
  try {
    response = await fetch(host + path, {
      method,
      headers: { Authorization: 'DeepL-Auth-Key ' + key, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw coreError(502, 'DEEPL_UNAVAILABLE', 'Không kết nối được DeepL; sẽ dịch bằng AI.');
  }
  return response;
}

function parseUsage(data) {
  const characterCount = Number(data?.character_count);
  const characterLimit = Number(data?.character_limit);
  if (!Number.isSafeInteger(characterCount) || !Number.isSafeInteger(characterLimit) || characterLimit <= 0) return null;
  return { characterCount, characterLimit };
}

// Kiểm tra hạn mức thực tế qua /v2/usage. Trả về {characterCount,
// characterLimit} hoặc null khi không đọc được. Không ném lỗi ra ngoài
// trừ khi khóa sai (403) — phía gọi quyết định xử lý.
async function fetchUsage(host, key) {
  const response = await callDeepL(host, key, '/v2/usage', { timeoutMs: 15000 });
  if (response.status === 403) throw coreError(400, 'DEEPL_KEY_INVALID', 'Khóa DeepL không đúng hoặc đã bị thu hồi.');
  if (!response.ok) return null;
  let data;
  try { data = await response.json(); } catch { return null; }
  return parseUsage(data);
}

/**
 * Dịch một nhóm câu tiếng Đức sang tiếng Việt bằng DeepL.
 * Trả về {translations: [...]} đúng thứ tự/số lượng đã gửi, hoặc
 * {exhausted: true} khi đã hết hạn mức (phía gọi chuyển sang AI và
 * không gọi DeepL nữa trong lần này). Ném lỗi khi chưa có khóa
 * (DEEPL_NOT_CONFIGURED), khóa sai (DEEPL_KEY_INVALID) hoặc DeepL
 * lỗi tạm thời (DEEPL_UNAVAILABLE) — phía gọi đều chuyển sang AI.
 * Không bao giờ để khóa hay nội dung lỗi của DeepL lọt ra ngoài.
 */
export async function translateWithDeepL(env, user, input = {}) {
  const texts = Array.isArray(input.texts) ? input.texts : [];
  if (!texts.length || texts.every(t => !(typeof t === 'string' && t.trim()))) return { translations: texts.map(() => '') };
  const exhausted = await readRow(env, EXHAUSTED_ROW);
  if (exhausted?.exhausted) return { exhausted: true };
  const record = await readKeyRecord(env);
  if (!record) throw coreError(503, 'DEEPL_NOT_CONFIGURED', 'Chưa có khóa DeepL; sẽ dịch bằng AI.');
  let key;
  try { key = await decryptSecret(env, record.secret); } catch {
    throw coreError(503, 'DEEPL_SECRET_INVALID', 'Không đọc được khóa DeepL; sẽ dịch bằng AI.');
  }
  const host = record.host === PRO_HOST ? PRO_HOST : FREE_HOST;
  const context = typeof input.context === 'string' ? input.context.trim().slice(0, 1000) : '';
  const response = await callDeepL(host, key, '/v2/translate', {
    method: 'POST',
    timeoutMs: 60000,
    body: {
      text: texts,
      source_lang: 'DE',
      target_lang: 'VI',
      ...(context ? { context } : {}),
      split_sentences: '1',
      preserve_formatting: '1',
    },
  });
  if (response.status === 456) {
    // 456 = hết hạn mức. Ghi cờ vĩnh viễn: ở lại AI, không tự mở lại.
    await markExhausted(env, { reason: 'quota_456' }).catch(() => {});
    return { exhausted: true };
  }
  if (response.status === 403) throw coreError(503, 'DEEPL_KEY_INVALID', 'Khóa DeepL không đúng; sẽ dịch bằng AI.');
  if (!response.ok) throw coreError(502, 'DEEPL_UNAVAILABLE', 'DeepL tạm lỗi; sẽ dịch bằng AI.');
  let data;
  try { data = await response.json(); } catch {
    throw coreError(502, 'DEEPL_UNAVAILABLE', 'DeepL trả về không đọc được; sẽ dịch bằng AI.');
  }
  const translations = Array.isArray(data?.translations) ? data.translations : null;
  if (!translations || translations.length !== texts.length || translations.some(t => typeof t?.text !== 'string')) {
    throw coreError(502, 'DEEPL_UNAVAILABLE', 'DeepL trả về sai số lượng câu; sẽ dịch bằng AI.');
  }
  return { translations: translations.map(t => t.text) };
}

/**
 * Trạng thái DeepL cho trang Admin. Chỉ Admin được xem.
 * Không bao giờ trả khóa ra ngoài.
 */
export async function getDeepLStatus(env, user) {
  admin(user);
  const record = await readKeyRecord(env);
  const exhausted = await readRow(env, EXHAUSTED_ROW);
  if (!record) return { configured: false, exhausted: false, characterCount: null, characterLimit: null };
  let key;
  try { key = await decryptSecret(env, record.secret); } catch {
    return { configured: false, exhausted: false, characterCount: null, characterLimit: null, keyInvalid: true };
  }
  const host = record.host === PRO_HOST ? PRO_HOST : FREE_HOST;
  let usage = null;
  try { usage = await fetchUsage(host, key); } catch (error) {
    if (error.code === 'DEEPL_KEY_INVALID') return { configured: true, exhausted: !!exhausted?.exhausted, characterCount: null, characterLimit: null, keyInvalid: true };
  }
  if (usage && usage.characterCount >= usage.characterLimit) {
    await markExhausted(env, { reason: 'usage_limit' }).catch(() => {});
    return { configured: true, exhausted: true, characterCount: usage.characterCount, characterLimit: usage.characterLimit };
  }
  return { configured: true, exhausted: !!exhausted?.exhausted, characterCount: usage?.characterCount ?? null, characterLimit: usage?.characterLimit ?? null };
}

/**
 * Lưu khóa DeepL mới (chỉ Admin). Xác thực khóa bằng /v2/usage trước
 * khi lưu; khóa sai thì không lưu gì cả. Khóa mới = hạn mức mới nên
 * xóa cờ hết hạn mức cũ. Không bao giờ trả khóa ra ngoài.
 */
export async function saveDeepLKey(env, user, input = {}) {
  admin(user);
  const key = typeof input.key === 'string' ? input.key.trim() : '';
  if (!key || /\s/.test(key) || key.length < 30 || key.length > 200) {
    throw coreError(400, 'DEEPL_KEY_INVALID', 'Khóa DeepL không đúng định dạng. Lấy khóa tại deepl.com/your-account/keys.');
  }
  const host = hostForKey(key);
  const usage = await fetchUsage(host, key);
  const secret = await encryptSecret(env, key);
  await writeRow(env, KEY_ROW, { secret, host, updatedAt: new Date().toISOString() });
  if (usage && usage.characterCount >= usage.characterLimit) {
    // Khóa đúng nhưng đã hết hạn mức: vẫn lưu để trang Admin hiển thị
    // đúng trạng thái, và ghi cờ exhausted để dịch bằng AI.
    await markExhausted(env, { reason: 'usage_limit' });
    return { configured: true, exhausted: true, characterCount: usage.characterCount, characterLimit: usage.characterLimit };
  }
  await clearExhausted(env);
  return { configured: true, exhausted: false, characterCount: usage?.characterCount ?? null, characterLimit: usage?.characterLimit ?? null };
}
