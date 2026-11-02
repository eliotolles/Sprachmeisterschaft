/**
 * Read-only Turso content adapter for staged Elio vocabulary.
 * Deliberately NOT wired into production routes or UI until migration is verified.
 * Cloudflare secrets: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.
 * No user tables, credentials, progress, or write statements are accessed.
 */
export async function listStagedElioVocabulary(env, { limit = 100, offset = 0 } = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200 ||
      !Number.isSafeInteger(offset) || offset < 0) {
    throw new RangeError('Invalid pagination');
  }
  const rawUrl = env?.TURSO_DATABASE_URL;
  const token = env?.TURSO_AUTH_TOKEN;
  if (!rawUrl || !token) throw new Error('Turso secrets are not configured');
  const url = new URL(rawUrl.replace(/^libsql:\/\//, 'https://').replace(/^wss:\/\//, 'https://'));
  if (url.protocol !== 'https:') throw new Error('Turso URL must use HTTPS');
  const response = await fetch(new URL('/v2/pipeline', url.origin), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        type: 'execute',
        stmt: {
          sql: 'SELECT source_id, german, article, word_type, vietnamese, example_de, example_vi, topic, level, source_deck_id, extra_json FROM elio_shared_vocabulary ORDER BY source_id LIMIT ? OFFSET ?',
          args: [
            { type: 'integer', value: String(limit) },
            { type: 'integer', value: String(offset) },
          ],
        },
      }, { type: 'close' }],
    }),
  });
  if (!response.ok) throw new Error(`Turso request failed: HTTP ${response.status}`);
  const payload = await response.json();
  const result = payload?.results?.[0];
  if (result?.type === 'error') throw new Error('Turso query failed');
  if (result?.type !== 'ok') throw new Error('Unexpected Turso response');
  const columns = result.response?.result?.cols?.map(c => c.name) ?? [];
  const rows = result.response?.result?.rows ?? [];
  return rows.map(row => Object.fromEntries(row.map((cell, i) => [
    columns[i], cell?.value ?? null,
  ])));
}
