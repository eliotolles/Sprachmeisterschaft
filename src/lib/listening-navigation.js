import {listeningFamily} from './listening-groups.js';
export function listeningNavigationGroups(collections,episodesFor){
 const groups=new Map();
 for(const collection of collections){
  const family=listeningFamily({collectionTitle:collection.title,recordId:collection.id});
  const key=collection.organizerId?collection.id:family.key.startsWith('record:')?collection.id:JSON.stringify([collection.scope||'public',collection.scope==='private'?collection.created_by:'shared',family.key]);
  if(!groups.has(key))groups.set(key,{id:key,title:collection.organizerId?collection.title:family.title,collections:[],episodes:[]});
  const group=groups.get(key);group.collections.push(collection);
  group.episodes.push(...episodesFor(collection.id).map(episode=>({...episode,collectionId:collection.id,level:episode.level||collection.level||'Chưa phân cấp'})));
 }
 return [...groups.values()].sort((a,b)=>a.title.localeCompare(b.title,'de'));
}
export function listeningModeMatches(group,mode){
 const podcast=/podcast|postcard|postcast/i.test(group.title);
 return mode==='podcast'?podcast:mode==='youtube'?!podcast:true;
}

export function listeningLevels(episodes){return [...new Set(episodes.map(e=>e.level||'Chưa phân cấp'))].sort();}
export function filterListeningEpisodes(episodes,level='ALL',query=''){const text=query.trim().toLocaleLowerCase('de');return episodes.filter(e=>(!level||level==='ALL'||e.level===level)&&(!text||String(e.title||'').toLocaleLowerCase('de').includes(text)));}
