const BASE = 'https://de.wiktionary.org';
export function normalizeVerb(value) {
  const word = String(value || '').normalize('NFC').trim().toLocaleLowerCase('de').replace(/^sich\s+/, '');
  if (!/^[a-zäöüß-]{2,80}$/u.test(word)) throw new Error('Nhập một động từ tiếng Đức, ví dụ: gehen, einkaufen, sich erinnern.');
  return word;
}
function clean(value) {
  return value.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1').replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/g, '').replace(/<[^>]+>/g, '').replace(/'{2,}/g, '').trim();
}
export function parseVerbOverview(text, word) {
  const entries = [];
  for (const match of text.matchAll(/\{\{Deutsch Verb Übersicht\b/gu)) {
    let depth = 1, end = match.index + match[0].length;
    for (; end < text.length && depth; end++) {
      if (text.slice(end, end + 2) === '{{') { depth++; end++; }
      else if (text.slice(end, end + 2) === '}}') { depth--; end++; }
    }
    const template = text.slice(match.index, end);
    const values = name => [...template.matchAll(/(?:^|\n)\|([^=\n]+)=([^\n]*)/g)]
      .filter(([, key]) => key.trim() === name || key.trim().startsWith(name + '*'))
      .map(([, , value]) => clean(value)).filter(value => value && !/[{}<>]/.test(value));
    const participles = values('Partizip II');
    if (participles.length) entries.push({ infinitive: word, participles: [...new Set(participles)], past: [...new Set(values('Präteritum_ich'))], auxiliaries: [...new Set(values('Hilfsverb'))] });
  }
  return entries.filter((item, i) => entries.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === i);
}
export async function handleParticipleLookup(request, fetcher = fetch) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' };
  const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method !== 'GET') return respond({ error: 'Method not allowed' }, 405);
  let word;
  try { word = normalizeVerb(new URL(request.url).searchParams.get('word')); }
  catch (error) { return respond({ error: error.message }, 400); }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
  try {
    const url = new URL('/w/api.php', BASE);
    url.search = new URLSearchParams({ action: 'parse', page: word, prop: 'wikitext', format: 'json', redirects: '1' });
    const response = await fetcher(url, { signal: controller.signal, headers: { 'User-Agent': 'Sprachmeisterschaft/1.0 (German verb learning; https://github.com/eliotolles/Sprachmeisterschaft)' } });
    if (!response.ok) return respond({ error: 'Nguồn từ điển đang bận. Hãy thử lại sau.' }, 503);
    const data = await response.json();
    const entries = parseVerbOverview(data.parse?.wikitext?.['*'] || '', word);
    const title = data.parse?.title || word;
    return respond({ word, entries, source: BASE + '/wiki/' + encodeURIComponent(title), license: 'CC BY-SA 4.0', message: entries.length ? null : 'Chưa tìm thấy bảng động từ. Hãy nhập dạng nguyên mẫu (Infinitiv), kiểm tra chính tả hoặc mở nguồn để đối chiếu.' });
  } catch (error) { return respond({ error: error.name === 'AbortError' ? 'Từ điển phản hồi quá lâu. Hãy thử lại.' : 'Không kết nối được nguồn từ điển. Hãy thử lại.' }, 503); }
  finally { clearTimeout(timer); }
}
