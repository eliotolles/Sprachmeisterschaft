import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

function request(path) {
  return new Request('https://preview.example.test' + path);
}
const assets = { fetch: async () => new Response('asset', { status: 200 }) };

test('Elio endpoint is disabled by default and never calls Turso', async () => {
  const response = await worker.fetch(request('/api/content/elio-vocabulary'), { ASSETS: assets });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).success, false);
});

test('bad pagination is rejected before any database request', async () => {
  const response = await worker.fetch(request('/api/content/elio-vocabulary?limit=9999'), {
    ASSETS: assets,
    ELIO_SHARED_VOCAB_ENABLED: 'true',
  });
  assert.equal(response.status, 400);
});

test('enabled endpoint fails closed without credentials', async () => {
  const response = await worker.fetch(request('/api/content/elio-vocabulary?limit=10'), {
    ASSETS: assets,
    ELIO_SHARED_VOCAB_ENABLED: 'true',
  });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(JSON.stringify(payload).includes('TOKEN'), false);
});
