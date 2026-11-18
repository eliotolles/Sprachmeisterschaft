// Viết tắt từ loại, hiện ngay bên cạnh từ trong popup tra từ
// (vd: kompliziert adj., der Tisch n., lernen v.).
// Không bịa: từ loại lạ thì hiện nguyên, trống thì suy ra từ mạo từ, còn không thì để trống.
const WORD_TYPE_ABBR = new Map([
  ['adjective', 'adj.'], ['adjektiv', 'adj.'],
  ['noun', 'n.'], ['substantiv', 'n.'], ['nomen', 'n.'],
  ['verb', 'v.'],
  ['adverb', 'adv.'],
  ['preposition', 'prep.'], ['präposition', 'prep.'],
  ['conjunction', 'konj.'], ['konjunktion', 'konj.'],
  ['article', 'art.'], ['artikel', 'art.'],
]);

export function wordTypeAbbr(word, article) {
  const raw = String(word?.word_type || word?.type || '').normalize('NFC').trim().toLocaleLowerCase('de');
  if (WORD_TYPE_ABBR.has(raw)) return WORD_TYPE_ABBR.get(raw);
  if (raw) return raw;
  const articleLower = String(article || '').normalize('NFC').trim().toLocaleLowerCase('de');
  if (['der', 'die', 'das'].includes(articleLower)) return 'n.';
  return '';
}
