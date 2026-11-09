const normalize = value => String(value || '').normalize('NFC').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function sourceSpecialtyWords(cards, specialty) {
  if (!Array.isArray(cards) || !specialty) return [];
  const title = normalize(specialty.vi);
  const deTitle = normalize(specialty.de);
  const id = normalize(specialty.id);
  const seen = new Set();

  return cards.filter(card => {
    if (!card.is_shared || !card.german || seen.has(card.id)) return false;
    const topic = normalize(card.topic || card.source_deck_id);
    if (!topic) return false;

    // So khớp topic
    const isMatch = (title && (topic === title || topic.startsWith(title + ' ') || topic.includes(title))) ||
                    (deTitle && (topic === deTitle || topic.startsWith(deTitle + ' ') || topic.includes(deTitle))) ||
                    (specialty.id === 'pflege' && (topic.includes('dieu duong') || topic.includes('pflege'))) ||
                    (specialty.id === 'gastronomie' && (topic.includes('nha hang') || topic.includes('khach san') || topic.includes('dau bep') || topic.includes('koch') || topic.includes('gastro') || topic.includes('speise'))) ||
                    (specialty.id === 'friseur' && (topic.includes('nail') || topic.includes('toc') || topic.includes('nagel') || topic.includes('tham my') || topic.includes('kosmetik'))) ||
                    (id && (topic === id || topic.includes(id)));

    if (!isMatch) return false;
    seen.add(card.id);
    return true;
  });
}
