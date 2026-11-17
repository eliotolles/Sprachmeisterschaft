const SPECIALTY_KEYWORDS = [
  'đầu bếp', 'koch', 'köchin', 'nail', 'nagel', 'điều dưỡng', 'pflege',
  'nhà hàng', 'khách sạn', 'gastronomie', 'hotellerie', 'bán hàng', 'verkauf',
  'nha khoa', 'zahn', 'xây dựng', 'bau', 'kho vận', 'logistik', 'điện', 'elektro',
  'ô tô', 'kfz', 'mechatronik', 'lễ tân', 'văn phòng', 'büro', 'y tế', 'medizin',
  'mầm non', 'erzieher', 'kita', 'làm tóc', 'thẩm mỹ', 'friseur', 'kosmetik',
  'mộc', 'tischler', 'sơn', 'maler', 'làm bánh', 'bäckerei', 'vệ sinh', 'reinigung',
  'bảo vệ', 'sicherheit', 'làm vườn', 'garten'
];

export function isSpecialtyTopic(topic) {
  if (!topic) return false;
  const t = String(topic).toLowerCase();
  return SPECIALTY_KEYWORDS.some(kw => t.includes(kw));
}

// Thứ tự CEFR thật: so chuỗi ("A1" < "A1 / A2" < "B1"...) chỉ đúng tình cờ
// và xếp "Chưa phân cấp" lẫn vào giữa các cấp C. Dùng hạng số rõ ràng.
export const LEVEL_RANK = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
export function cefrLevelsOf(rawLevel) {
  return [...new Set(String(rawLevel || '').toUpperCase().match(/\b[A-C][12]\b/g) || [])];
}
export function cefrRankOf(rawLevel) {
  const levels = Array.isArray(rawLevel) ? rawLevel : cefrLevelsOf(rawLevel);
  if (!levels.length) return 99; // chưa phân cấp: luôn xếp cuối
  return Math.min(...levels.map((l) => LEVEL_RANK[String(l).toUpperCase()] ?? 99));
}
export function compareGerman(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'de');
}

// Reuse authenticated vocabulary, retaining source IDs and account isolation.
export function buildLevelDecks(cards=[],{includePrivate=false,excludeSpecialties=false}={}) {
 const groups=new Map(),seen=new Set();
 for(const card of cards){
  if(!card||!card.is_shared&&!includePrivate||!card.id||!card.german||seen.has(card.id))continue;
  
  // Loại bỏ các thẻ từ vựng thuộc chuyên ngành nếu có yêu cầu
  const topic = card.topic || card.source_deck_id || '';
  if (excludeSpecialties && isSpecialtyTopic(topic)) continue;

  seen.add(card.id);
  const rawLevel=String(card.level||'').trim().toUpperCase();
  const level=rawLevel||'Chưa phân cấp',levels=cefrLevelsOf(rawLevel);
  const source=card.source_deck_id||card.coreDeckId||card.topic||'elio-shared';
  const key=JSON.stringify(source==='elio-shared'?[source,level]:source);
  if(!groups.has(key))groups.set(key,{id:'elio-level-'+encodeURIComponent(key),level,levels,title:card.topic||source,deTitle:card.topic||'Elio Einfach',description:'Bộ từ Elio Einfach · dữ liệu chung từ server',words:[],cardsCount:0,isCore:true});
  const deck=groups.get(key);deck.levels=[...new Set([...deck.levels,...levels])].sort();deck.words.push({...card});deck.cardsCount++;
 }
 for(const deck of groups.values()){
  if(deck.levels.length)deck.level=deck.levels.join(' / ');
  // Từ trong bộ xếp theo cấp độ rồi A–Z tiếng Đức (trước đây giữ nguyên
  // thứ tự nạp từ server nên nhìn lộn xộn, không theo thứ tự nào).
  deck.words.sort((a,b)=>cefrRankOf(a.level)-cefrRankOf(b.level)||compareGerman(a.german,b.german));
 }
 // Bộ xếp theo thứ tự CEFR (cấp thấp nhất trong bộ), chưa phân cấp xếp cuối,
 // cùng cấp thì xếp theo tên A–Z tiếng Đức.
 return [...groups.values()].sort((a,b)=>cefrRankOf(a.levels)-cefrRankOf(b.levels)||compareGerman(a.title,b.title));
}
