import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readVocabulary, reviewVocabulary, REVIEW_KEY } from '../src/core/elio/vocabulary.js';
const now = Date.UTC(2026, 10, 2, 12);
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE ee_state(owner TEXT,key TEXT,value TEXT,revision INTEGER,PRIMARY KEY(owner,key));
    CREATE TABLE elio_shared_vocabulary(source_id TEXT PRIMARY KEY,german TEXT,article TEXT,word_type TEXT,vietnamese TEXT,example_de TEXT,example_vi TEXT,topic TEXT,level TEXT,source_deck_id TEXT,extra_json TEXT);`);
  const insert = db.prepare('INSERT INTO elio_shared_vocabulary VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  insert.run('one','ÜBUNG','die','noun','bài tập','','','Book','B1','deck',JSON.stringify({english:'exercise'}));
  insert.run('two','Preis 10%','','noun','giá','','','Book','A1','deck','{}');
  insert.run('three','Haus','das','noun','nhà','','','Home','A1','other','{}');
  const env = { TEST_CORE_DB: async (sql, args = []) => ({ rows: db.prepare(sql).all(...args), changes: 0 }) };
  return { db, env };
}
test('search supports German umlauts, English, Vietnamese and literal LIKE characters', async () => {
  const { db, env } = fixture(); try {
    for (const [search, id] of [['übung','one'],['exercise','one'],['nhà','three'],['10%','two']]) {
      const result = await readVocabulary(env, new URL('https://local.invalid/?q=' + encodeURIComponent(search)));
      assert.deepEqual(result.cards.map(row => row.source_id), [id]);
    }
    assert.equal((await readVocabulary(env, new URL('https://local.invalid/?q=%27%20OR%201%3D1--'))).cards.length, 0);
    assert.equal((await readVocabulary(env, new URL('https://local.invalid/?q=_'))).cards.length, 0);
    assert.deepEqual((await readVocabulary(env, new URL('https://local.invalid/?deck=deck&level=B1'))).cards.map(x => x.source_id), ['one']);
  } finally { db.close(); }
});
test('server schedules shared IDs per account and preserves existing source and legacy progress', async () => {
  const { db, env } = fixture(); try {
    const before = db.prepare('SELECT * FROM elio_shared_vocabulary').all();
    db.prepare('INSERT INTO ee_state VALUES(?,?,?,?)').run('alice','srs','{"untouched":true}',7);
    const a = await reviewVocabulary(env, { id: 'alice' }, { sourceId: 'one', rating: 'easy', version: 0 }, now);
    const b = await reviewVocabulary(env, { id: 'bob' }, { sourceId: 'one', rating: 'again', version: 0 }, now);
    assert.equal(a.review.intervalDays, 4); assert.equal(b.review.intervalDays, 0); assert.equal(b.review.lapses, 1);
    assert.equal(a.version, 1); assert.equal(b.version, 1);
    assert.deepEqual(db.prepare('SELECT * FROM elio_shared_vocabulary').all(), before);
    assert.equal(db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('alice','srs').value,'{"untouched":true}');
  } finally { db.close(); }
});
test('stale retries cannot double-count a review or overwrite history', async () => {
  const { db, env } = fixture(); try {
    await reviewVocabulary(env, { id: 'alice' }, { sourceId: 'one', rating: 'good', version: 0 }, now);
    const duplicate = await reviewVocabulary(env, { id: 'alice' }, { sourceId: 'one', rating: 'good', version: 0 }, now + 1000);
    assert.equal(duplicate.conflict, true);
    const next = await reviewVocabulary(env, { id: 'alice' }, { sourceId: 'one', rating: 'good', version: 1 }, now + 10000);
    assert.equal(next.review.repetitions, 2); assert.equal(next.review.intervalDays, 3);
    const doc = JSON.parse(db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('alice',REVIEW_KEY).value);
    assert.equal(doc.history.length, 2); assert.equal(doc.history[0].time, now);
  } finally { db.close(); }
});
test('reverse-direction reviews have independent progress', async () => {
  const { db, env } = fixture(); try {
    await reviewVocabulary(env, { id: 'alice' }, { sourceId: 'one', rating: 'good', version: 0 }, now);
    const reverse = await reviewVocabulary(env, { id: 'alice' }, { sourceId: 'one', rating: 'again', version: 1, direction:'vi' }, now);
    assert.equal(reverse.review.repetitions, 0);
    const doc = JSON.parse(db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('alice',REVIEW_KEY).value);
    assert.equal(Object.keys(doc.cards).length, 2);
  } finally { db.close(); }
});
test('invalid requests, unknown IDs and corrupt prior reviews fail without writes', async () => {
  const { db, env } = fixture(); try {
    for (const data of [{sourceId:'missing',rating:'good',version:0},{sourceId:'one',rating:'good',version:-1},{sourceId:'one',rating:'bad',version:0},{sourceId:'one',rating:'good',version:0,owner:'bob'}]) {
      await assert.rejects(reviewVocabulary(env, {id:'alice'}, data, now));
    }
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state').get().n, 0);
    db.prepare('INSERT INTO ee_state VALUES(?,?,?,?)').run('alice',REVIEW_KEY,'broken',1);
    await assert.rejects(reviewVocabulary(env,{id:'alice'},{sourceId:'one',rating:'good',version:1},now));
    assert.equal(db.prepare('SELECT value FROM ee_state').get().value, 'broken');
  } finally { db.close(); }
});
