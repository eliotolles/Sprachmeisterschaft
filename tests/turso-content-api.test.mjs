import test from 'node:test';
import assert from 'node:assert/strict';
import { listStagedElioVocabulary } from '../src/lib/turso-content-api.js';

const env = {
  TURSO_DATABASE_URL: 'libsql://sample-db.turso.io',
  TURSO_AUTH_TOKEN: 'test-token-not-real',
};

test('rejects missing credentials and invalid pagination before fetch', async () => {
  await assert.rejects(listStagedElioVocabulary({}, {}), /secrets/);
  for (const limit of [0, -1, 201, 1.2, '10']) {
    await assert.rejects(listStagedElioVocabulary(env, { limit }), RangeError);
  }
  await assert.rejects(listStagedElioVocabulary(env, { offset: -1 }), RangeError);
});

test('uses read-only parameterized SQL and maps rows', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    assert.equal(url.toString(), 'https://sample-db.turso.io/v2/pipeline');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-token-not-real');
    const body = JSON.parse(options.body);
    assert.equal(body.requests[0].type, 'execute');
    assert.match(body.requests[0].stmt.sql, /^SELECT /);
    assert.doesNotMatch(body.requests[0].stmt.sql, /INSERT|UPDATE|DELETE/i);
    assert.deepEqual(body.requests[0].stmt.args, [
      { type: 'integer', value: '5' },
      { type: 'integer', value: '10' },
    ]);
    return {
      ok: true,
      json: async () => ({
        results: [{
          type: 'ok',
          response: {
            result: {
              cols: [{ name: 'source_id' }, { name: 'german' }],
              rows: [[{ type: 'text', value: 'id1' }, { type: 'text', value: 'Haus' }]],
            },
          },
        }],
      }),
    };
  };
  assert.deepEqual(await listStagedElioVocabulary(env, { limit: 5, offset: 10 }),
    [{ source_id: 'id1', german: 'Haus' }]);
});

test('fails closed on upstream HTTP and query errors', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => ({ ok: false, status: 401 });
  await assert.rejects(listStagedElioVocabulary(env), /HTTP 401/);
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ results: [{ type: 'error' }] }),
  });
  await assert.rejects(listStagedElioVocabulary(env), /query failed/);
});
