/** Pure content adapter: shared Elio cards never inherit personal progress or ownership. */
export function mapSharedElioCard(row) {
  if (!row || typeof row !== 'object') throw new TypeError('Invalid vocabulary row');
  const id = String(row.source_id ?? '').trim();
  const german = String(row.german ?? '').trim();
  if (!id || !german) throw new Error('Missing vocabulary source_id or german');
  let extra = {};
  if (typeof row.extra_json === 'string' && row.extra_json.trim()) {
    extra = JSON.parse(row.extra_json);
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) throw new TypeError('Invalid extra_json');
  }
  return {
    id: `elio_shared_${id}`,
    source_id: id,
    source: 'elio_shared',
    is_shared: true,
    german,
    article: String(row.article ?? ''),
    word_type: String(row.word_type ?? ''),
    vietnamese: String(row.vietnamese ?? ''),
    example_de: String(row.example_de ?? ''),
    example_vi: String(row.example_vi ?? ''),
    topic: String(row.topic ?? ''),
    level: String(row.level ?? ''),
    source_deck_id: String(row.source_deck_id ?? ''),
    english: extra.english ?? '',
    meaning_de: extra.meaning_de ?? '',
    meanings: Array.isArray(extra.meanings) ? extra.meanings : Array.isArray(extra.senses) ? extra.senses : [],
    synonyms: extra.synonyms ?? [],
    phrases: extra.phrases ?? [],
    ...Object.fromEntries(['ipa','phonetic','plural','du','prateritum','partizip_ii','auxiliary','comparative','superlative','preposition','grammatical_case','note'].filter(key => typeof extra[key] === 'string').map(key => [key, extra[key]])),
    separable: extra.separable === true,
    reflexive: extra.reflexive === true,
    antonyms: Array.isArray(extra.antonyms) ? extra.antonyms : [],
    // No user_id, status, due_date, repetitions or review history here.
  };
}

/** Return combined cards without mutating either input or replacing personal cards. */
export function mergePersonalAndSharedVocabulary(personalCards, sharedRows) {
  if (!Array.isArray(personalCards) || !Array.isArray(sharedRows)) throw new TypeError('Expected arrays');
  const result = [...personalCards];
  const ids = new Set(personalCards.map(card => String(card.id)));
  for (const row of sharedRows) {
    const card = mapSharedElioCard(row);
    if (ids.has(card.id)) continue;
    ids.add(card.id);
    result.push(card);
  }
  return result;
}
