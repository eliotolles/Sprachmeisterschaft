const normalize=value=>String(value||'').normalize('NFC').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu,' ').trim();

export function sourceSpecialtyWords(cards,specialty){
 const title=normalize(specialty.vi),seen=new Set();
 return cards.filter(card=>{
  if(!card.is_shared||!card.german||seen.has(card.id))return false;
  const topic=normalize(card.topic);
  if(topic!==title&&!topic.startsWith(title+' '))return false;
  seen.add(card.id);return true;
 });
}
