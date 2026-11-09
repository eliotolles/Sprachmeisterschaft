import {groupListeningLibrary} from './listening-groups.js';
import {activeCollectionId} from './collection-types.js';
import {toast} from 'sonner';
import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createListeningBinding,listeningRouteIds} from '../core/elio/listening-binding.js';
export const listeningCoreActive=()=>elioAuthentication()?.isActive()===true;
export const newListeningBinding=()=>createListeningBinding({client:elioClient,isActive:listeningCoreActive});
let binding=null;
export const elioListening=()=>binding;
export function installListeningRuntime(db){
 if(binding)return binding;
 const core=newListeningBinding(),legacy={...db.listening};let owner=null,collections=[],episodes=[];
 const clear=()=>{owner=elioClient.getUser()?.id;collections=[];episodes=[];core.reset();};
 const scope=()=>{if(owner!==elioClient.getUser()?.id)clear();};
 const notify=()=>{window.dispatchEvent(new CustomEvent('sprach_listening_change'));window.dispatchEvent(new CustomEvent('sprach_db_change'));};
 async function hydrate(){
  clear();notify();
  if(!listeningCoreActive()||!owner)return;
  const current=owner;
  try{
   const [{videos},folders]=await Promise.all([core.load(),elioClient.collections()]);
   if(current!==elioClient.getUser()?.id)return;
   const result=groupListeningLibrary(videos,folders?.items||[]);
   collections=result.collections||[];episodes=result.episodes||[];
  }catch(e){
   // Không để lỗi server chặn người dùng sử dụng dữ liệu cục bộ
  }
  notify();
 }

 const api={
  getCollections:(options={})=>{
   scope();
   if(listeningCoreActive()&&collections.length>0){
    const filtered=collections.filter(c=>(!options.level||options.level==='ALL'||c.levels?.includes(options.level))&&(!options.scope||c.scope===options.scope));
    if(filtered.length>0)return filtered;
   }
   return legacy.getCollections(options);
  },
  getCollectionById:id=>{
   scope();
   if(listeningCoreActive()&&collections.length>0){
    const found=collections.find(c=>c.id===id)||collections.find(c=>c.recordIds?.some(record=>encodeURIComponent(record)===id));
    if(found)return found;
   }
   return legacy.getCollectionById(id);
  },
  getEpisodes:id=>{
   scope();
   if(listeningCoreActive()&&episodes.length>0){
    const found=episodes.filter(e=>e.collection_id===id||encodeURIComponent(e.recordId)===id||e.collectionId===id);
    if(found.length>0)return found;
   }
   return legacy.getEpisodes(id);
  },
  getEpisodeById:id=>{
   scope();
   if(listeningCoreActive()&&episodes.length>0){
    const found=episodes.find(e=>e.id===id);
    if(found)return found;
   }
   return legacy.getEpisodeById(id);
  },
  createCollection:(col)=>{
   return legacy.createCollection(col);
  },
  createEpisode:(ep)=>{
   return legacy.createEpisode(ep);
  },
  updateCollection:(id,updates)=>{
   return legacy.updateCollection(id,updates);
  },
  updateEpisode:(id,updates)=>{
   return legacy.updateEpisode(id,updates);
  },
  deleteCollection:async id=>{
   legacy.deleteCollection(id);
   notify();
   return true;
  },
  deleteEpisode:async id=>{
   legacy.deleteEpisode(id);
   notify();
   return true;
  }
 };

 for(const name of Object.keys(legacy)){
  if(!(name in api)){
   api[name]=(...args)=>{
    return legacy[name](...args);
   };
  }
 }

 window.addEventListener('sprach_core_imported',()=>{if(listeningCoreActive())hydrate().catch(()=>{});});
 db.listening=api;
 binding={hydrate,submit:core.submit,isActive:listeningCoreActive};
 window.addEventListener('sprach_auth_change',()=>{
  if(listeningCoreActive())hydrate().catch(()=>{});
  else{clear();notify();}
 });
 return binding;
}
