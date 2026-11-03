// Reuse authenticated vocabulary, retaining source IDs and account isolation.
export function buildLevelDecks(cards=[]) {
 const groups=new Map(),seen=new Set();
 for(const card of cards){
  if(!card||!card.is_shared||!card.id||!card.german||seen.has(card.id))continue;
  seen.add(card.id);
  const rawLevel=String(card.level||'').trim().toUpperCase();
  const level=rawLevel||'Chưa phân cấp',levels=[...new Set(rawLevel.match(/\b[A-C][12]\b/g)||[])];
  const source=card.source_deck_id||card.coreDeckId||card.topic||'elio-shared';
  const key=JSON.stringify([level,source]);
  if(!groups.has(key))groups.set(key,{id:'elio-level-'+encodeURIComponent(key),level,levels,title:card.topic||source,deTitle:card.topic||'Elio Einfach',description:'Bộ từ Elio Einfach · dữ liệu chung từ server',words:[],cardsCount:0,isCore:true});
  const deck=groups.get(key);deck.words.push({...card});deck.cardsCount++;
 }
 return [...groups.values()].sort((a,b)=>a.level.localeCompare(b.level)||a.title.localeCompare(b.title));
}
