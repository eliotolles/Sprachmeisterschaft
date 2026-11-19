import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { translateWithDeepL, getDeepLStatus, saveDeepLKey } from '../src/core/elio/deepl.js';

const owner = { id: 'owner', role: 'super_admin' };
const student = { id: 'student', role: 'user' };
const GOOD_KEY = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee:fx';

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
  const env = {
    AI_ENCRYPTION_KEY: 'only-a-long-test-fixture-not-a-live-secret',
    TEST_CORE_DB: async (sql, args = []) => {
      const s = db.prepare(sql);
      if (/^SELECT/i.test(sql) || /RETURNING/.test(sql)) return { rows: s.all(...args), changes: 0 };
      return { rows: [], changes: Number(s.run(...args).changes) };
    },
  };
  return { db, env };
}

function deeplFetch({ usage = { character_count: 1200, character_limit: 1000000 }, translateTexts = null, translateStatus = 200 } = {}) {
  let calls = 0;
  const seen = [];
  const fetchMock = async (url, options = {}) => {
    calls++;
    seen.push(String(url));
    if (String(url).endsWith('/v2/usage')) return Response.json(usage);
    if (String(url).endsWith('/v2/translate')) {
      if (translateStatus !== 200) return new Response('quota gone', { status: translateStatus });
      const body = JSON.parse(options.body);
      assert.equal(options.headers.Authorization, 'DeepL-Auth-Key ' + GOOD_KEY);
      assert.equal(body.source_lang, 'DE');
      assert.equal(body.target_lang, 'VI');
      const out = translateTexts ?? body.text.map(t => 'VI: ' + t);
      return Response.json({ translations: out.map(text => ({ detected_source_language: 'DE', text })) });
    }
    throw new Error('unexpected url ' + url);
  };
  return { fetchMock, get calls() { return calls; }, seen };
}

test('chỉ Admin được lưu/xem trạng thái khóa DeepL', async () => {
  const { db, env } = fixture();
  try {
    await assert.rejects(saveDeepLKey(env, student, { key: GOOD_KEY }), e => e.status === 403);
    await assert.rejects(getDeepLStatus(env, student), e => e.status === 403);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM ee_config').get().c, 0);
  } finally { db.close(); }
});

test('khóa sai không được lưu; khóa đúng được mã hóa và không lộ ra ngoài', async () => {
  const { db, env } = fixture();
  const original = globalThis.fetch;
  try {
    // usage trả 403 = khóa sai.
    globalThis.fetch = async () => new Response('forbidden', { status: 403 });
    await assert.rejects(saveDeepLKey(env, owner, { key: GOOD_KEY }), e => e.code === 'DEEPL_KEY_INVALID');
    assert.equal(db.prepare('SELECT COUNT(*) c FROM ee_config').get().c, 0);

    const { fetchMock } = deeplFetch();
    globalThis.fetch = fetchMock;
    const saved = await saveDeepLKey(env, owner, { key: GOOD_KEY });
    assert.equal(saved.configured, true);
    assert.equal(saved.characterCount, 1200);
    assert.equal(saved.characterLimit, 1000000);
    const stored = db.prepare('SELECT value FROM ee_config').get().value;
    assert(!stored.includes(GOOD_KEY), 'khóa gốc không được nằm trong DB');
    assert(!JSON.stringify(saved).includes(GOOD_KEY));
    const status = await getDeepLStatus(env, owner);
    assert.equal(status.configured, true);
    assert.equal(status.exhausted, false);
    assert(!JSON.stringify(status).includes(GOOD_KEY));
  } finally { db.close(); globalThis.fetch = original; }
});

test('dịch bằng DeepL trả đúng số câu; khóa không lọt vào kết quả', async () => {
  const { db, env } = fixture();
  const original = globalThis.fetch;
  const { fetchMock } = deeplFetch();
  try {
    globalThis.fetch = fetchMock;
    await saveDeepLKey(env, owner, { key: GOOD_KEY });
    const r = await translateWithDeepL(env, student, { texts: ['Ich bin fertig.', 'Das kriegen wir hin.'], context: 'Wir machen Hausaufgaben.' });
    assert.deepEqual(r.translations, ['VI: Ich bin fertig.', 'VI: Das kriegen wir hin.']);
    assert.equal(r.exhausted, undefined);
  } finally { db.close(); globalThis.fetch = original; }
});

test('chưa có khóa thì báo DEEPL_NOT_CONFIGURED để phía gọi chuyển sang AI', async () => {
  const { db, env } = fixture();
  try {
    await assert.rejects(translateWithDeepL(env, student, { texts: ['Hallo.'] }), e => e.code === 'DEEPL_NOT_CONFIGURED');
  } finally { db.close(); }
});

test('DeepL trả 456 thì ghi cờ hết hạn mức vĩnh viễn và lần sau không gọi DeepL nữa', async () => {
  const { db, env } = fixture();
  const original = globalThis.fetch;
  const usageMock = deeplFetch();
  try {
    globalThis.fetch = usageMock.fetchMock;
    await saveDeepLKey(env, owner, { key: GOOD_KEY });
    assert.equal(usageMock.calls, 1);
    // Lần dịch đầu: DeepL trả 456.
    globalThis.fetch = deeplFetch({ translateStatus: 456 }).fetchMock;
    const first = await translateWithDeepL(env, student, { texts: ['Hallo.'] });
    assert.equal(first.exhausted, true);
    const flag = db.prepare("SELECT value FROM ee_config WHERE key='sprach:deepl:exhausted'").get();
    assert(flag, 'cờ exhausted phải được ghi');
    assert(JSON.parse(flag.value).exhausted === true);
    // Lần sau: không gọi fetch nữa, trả exhausted ngay.
    let called = 0;
    globalThis.fetch = async () => { called++; return Response.json({}); };
    const second = await translateWithDeepL(env, student, { texts: ['Hallo.'] });
    assert.equal(second.exhausted, true);
    assert.equal(called, 0);
    // Trạng thái Admin cũng báo exhausted.
    const status = await getDeepLStatus(env, owner);
    assert.equal(status.exhausted, true);
  } finally { db.close(); globalThis.fetch = original; }
});

test('usage đã chạm giới hạn thì trạng thái báo exhausted ngay cả khi chưa dịch', async () => {
  const { db, env } = fixture();
  const original = globalThis.fetch;
  try {
    const { fetchMock } = deeplFetch({ usage: { character_count: 1000000, character_limit: 1000000 } });
    globalThis.fetch = fetchMock;
    await saveDeepLKey(env, owner, { key: GOOD_KEY });
    const status = await getDeepLStatus(env, owner);
    assert.equal(status.exhausted, true);
    assert.equal(status.characterCount, 1000000);
  } finally { db.close(); globalThis.fetch = original; }
});

test('khóa mới xóa cờ hết hạn mức cũ', async () => {
  const { db, env } = fixture();
  const original = globalThis.fetch;
  try {
    const { fetchMock } = deeplFetch();
    globalThis.fetch = fetchMock;
    await saveDeepLKey(env, owner, { key: GOOD_KEY });
    globalThis.fetch = deeplFetch({ translateStatus: 456 }).fetchMock;
    assert.equal((await translateWithDeepL(env, student, { texts: ['Hallo.'] })).exhausted, true);
    globalThis.fetch = fetchMock;
    const saved = await saveDeepLKey(env, owner, { key: GOOD_KEY });
    assert.equal(saved.exhausted, false);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM ee_config WHERE key='sprach:deepl:exhausted'").get().c, 0);
  } finally { db.close(); globalThis.fetch = original; }
});
