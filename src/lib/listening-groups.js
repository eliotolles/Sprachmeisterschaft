const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function listeningFamily(video){
 const title=normalize(video.collectionTitle||video.title);
 if(/nico(?:s)? ?weg/.test(title))return {key:'nicos-weg',title:'Nicos Weg'};
 if(/easy ?german/.test(title))return {key:'easy-german',title:'Easy German'};
 if(/podcast|postcard|postcast/.test(title))return {key:'podcast',title:'Podcast'};
 if(/grammatik|grammar|grama\b|ngu phap/.test(title))return {key:'grammatik',title:'Grammatik'};
 return {key:'record:'+video.recordId,title:video.collectionTitle||'Bộ nghe'};
}
export function groupListeningLibrary(videos,folders=[]){
 const groups=new Map(),episodes=[],seen=new Set();const folderMap=new Map(folders.filter(f=>f.skill==='listening'||f.skill==='all').map(f=>[f.id,f]));
 for(const folder of folderMap.values())groups.set('folder:'+folder.id,{id:'folder-'+folder.id,organizerId:folder.id,title:folder.name,level:'',levels:[],scope:folder.visibility,created_by:folder.owner,canEdit:folder.canEdit,recordIds:[],revision:folder.revision,thumbnail:''});
 for(const video of videos){
  const family=listeningFamily(video),folder=folderMap.get(video.organizerId);
  const key=folder?'folder:'+folder.id:JSON.stringify([video.scope,video.scope==='private'?video.owner:'shared',family.key]);
  if(!groups.has(key))groups.set(key,{id:'group-'+encodeURIComponent(key),title:family.title,level:'',levels:[],scope:video.scope,created_by:video.owner,recordIds:[],thumbnail:'',virtual:true});
  const group=groups.get(key);if(!group.recordIds.includes(video.recordId))group.recordIds.push(video.recordId);
  if(video.level&&!group.levels.includes(video.level))group.levels.push(video.level);
  if(!group.thumbnail&&video.youtubeId)group.thumbnail='https://img.youtube.com/vi/'+video.youtubeId+'/hqdefault.jpg';
  // Episode identity stays tied to its original record/item, independently of its visual group.
  const record=encodeURIComponent(video.recordId),id=record+':'+(video.itemId===undefined?'video':typeof video.itemId+':'+encodeURIComponent(String(video.itemId)));
  if(seen.has(id))throw Error('ID video nguồn bị trùng.');seen.add(id);
  episodes.push({id,collection_id:group.id,title:video.title,level:video.level,youtubeId:video.youtubeId,recordId:video.recordId,itemId:video.itemId,owner:video.owner,subtitles:video.subtitles});
 }
 for(const group of groups.values()){group.levels.sort();group.level=group.levels.join(' / ');}
 return {collections:[...groups.values()].sort((a,b)=>a.title.localeCompare(b.title,'de')),episodes};
}
