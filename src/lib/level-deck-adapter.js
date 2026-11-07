// Reuse authenticated vocabulary, retaining source IDs and account isolation.
export function buildLevelDecks(cards=[],{includePrivate=false}={}) {
 const groups=new Map(),seen=new Set();
 for(const card of cards){
  if(!card||!card.is_shared&&!includePrivate||!card.id||!card.german||seen.has(card.id))continue;
  seen.add(card.id);
  const rawLevel=String(card.level||'').trim().toUpperCase();
  const level=rawLevel||'Chưa phân cấp',levels=[...new Set(rawLevel.match(/\b[A-C][12]\b/g)||[])];
  const source=card.source_deck_id||card.coreDeckId||card.topic||'elio-shared';
  const key=JSON.stringify(source==='elio-shared'?[source,level]:source);
  if(!groups.has(key))groups.set(key,{id:'elio-level-'+encodeURIComponent(key),level,levels,title:card.topic||source,deTitle:card.topic||'Elio Einfach',description:'Bộ từ Elio Einfach · dữ liệu chung từ server',words:[],cardsCount:0,isCore:true});
  const deck=groups.get(key);deck.levels=[...new Set([...deck.levels,...levels])].sort();deck.words.push({...card});deck.cardsCount++;
 }
 for(const deck of groups.values())if(deck.levels.length)deck.level=deck.levels.join(' / ');
 return [...groups.values()].sort((a,b)=>a.level.localeCompare(b.level)||a.title.localeCompare(b.title));
}
