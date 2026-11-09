import {groupListeningLibrary} from './listening-groups.js';
import {activeCollectionId} from './collection-types.js';
import {toast} from 'sonner';
import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createListeningBinding,listeningRouteIds} from '../core/elio/listening-binding.js';

export const listeningCoreActive=()=>elioAuthentication()?.isActive()===true;
export const newListeningBinding=()=>createListeningBinding({client:elioClient,isActive:listeningCoreActive});
let binding=null;
export const elioListening=()=>binding;

const getDeletedCollections = () => {
  try {
    return JSON.parse(localStorage.getItem('sprach_deleted_listening_collections') || '[]');
  } catch {
    return [];
  }
};

const getDeletedEpisodes = () => {
  try {
    return JSON.parse(localStorage.getItem('sprach_deleted_listening_episodes') || '[]');
  } catch {
    return [];
  }
};

const addDeletedCollection = (col) => {
  try {
    const list = getDeletedCollections();
    const ids = [col.id, col.title, ...(col.recordIds || []), col.organizerId].filter(Boolean);
    for (const item of ids) {
      if (!list.includes(item)) list.push(item);
    }
    localStorage.setItem('sprach_deleted_listening_collections', JSON.stringify(list));
  } catch {}
};

const addDeletedEpisode = (ep) => {
  try {
    const list = getDeletedEpisodes();
    const ids = [ep.id, ep.recordId, ep.youtubeId].filter(Boolean);
    for (const item of ids) {
      if (!list.includes(item)) list.push(item);
    }
    localStorage.setItem('sprach_deleted_listening_episodes', JSON.stringify(list));
  } catch {}
};

const isCollectionDeleted = (c, deletedCols) => {
  if (!c) return true;
  return deletedCols.includes(c.id) ||
         deletedCols.includes(c.title) ||
         (c.title && deletedCols.some(d => typeof d === 'string' && d.toLowerCase() === c.title.toLowerCase())) ||
         (c.recordIds && c.recordIds.some(r => deletedCols.includes(r))) ||
         (c.organizerId && deletedCols.includes(c.organizerId));
};

const isEpisodeDeleted = (e, deletedEps, deletedCols) => {
  if (!e) return true;
  if (deletedEps.includes(e.id) || deletedEps.includes(e.recordId)) return true;
  if (e.collectionId && isCollectionDeleted({ id: e.collectionId }, deletedCols)) return true;
  if (e.collection_id && isCollectionDeleted({ id: e.collection_id }, deletedCols)) return true;
  return false;
};

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
   const deletedCols = getDeletedCollections();
   const deletedEps = getDeletedEpisodes();
   collections=(result.collections||[]).filter(c => !isCollectionDeleted(c, deletedCols));
   episodes=(result.episodes||[]).filter(e => !isEpisodeDeleted(e, deletedEps, deletedCols));
  }catch(e){
   // Không để lỗi server chặn người dùng sử dụng dữ liệu cục bộ
  }
  notify();
 }

 const api={
  getCollections:(options={})=>{
   scope();
   const deletedCols = getDeletedCollections();
   if(listeningCoreActive()&&collections.length>0){
    const filtered=collections
      .filter(c => !isCollectionDeleted(c, deletedCols))
      .filter(c=>(!options.level||options.level==='ALL'||c.levels?.includes(options.level))&&(!options.scope||c.scope===options.scope));
    return filtered;
   }
   const legacyCols = legacy.getCollections(options) || [];
   return legacyCols.filter(c => !isCollectionDeleted(c, deletedCols));
  },
  getCollectionById:id=>{
   scope();
   const deletedCols = getDeletedCollections();
   if (deletedCols.includes(id)) return null;
   if(listeningCoreActive()&&collections.length>0){
    const found=collections.find(c=>(c.id===id||c.recordIds?.some(record=>encodeURIComponent(record)===id)) && !isCollectionDeleted(c, deletedCols));
    if(found)return found;
   }
   const col = legacy.getCollectionById(id);
   return col && !isCollectionDeleted(col, deletedCols) ? col : null;
  },
  getEpisodes:id=>{
   scope();
   const deletedCols = getDeletedCollections();
   const deletedEps = getDeletedEpisodes();
   if (deletedCols.includes(id)) return [];
   if(listeningCoreActive()&&episodes.length>0){
    const found=episodes.filter(e=>(e.collection_id===id||encodeURIComponent(e.recordId)===id||e.collectionId===id) && !isEpisodeDeleted(e, deletedEps, deletedCols));
    return found;
   }
   const legacyEps = legacy.getEpisodes(id) || [];
   return legacyEps.filter(e => !isEpisodeDeleted(e, deletedEps, deletedCols));
  },
  getEpisodeById:id=>{
   scope();
   const deletedCols = getDeletedCollections();
   const deletedEps = getDeletedEpisodes();
   if(listeningCoreActive()&&episodes.length>0){
    const found=episodes.find(e=>e.id===id && !isEpisodeDeleted(e, deletedEps, deletedCols));
    if(found)return found;
   }
   const ep = legacy.getEpisodeById(id);
   return ep && !isEpisodeDeleted(ep, deletedEps, deletedCols) ? ep : null;
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
   const target = collections.find(c => c.id === id || c.title === id || c.recordIds?.includes(id)) || legacy.getCollectionById(id);
   const targetIds = [id, target?.id, target?.title, ...(target?.recordIds || []), target?.organizerId].filter(Boolean);
   
   if (target) {
     addDeletedCollection(target);
   } else {
     addDeletedCollection({ id });
   }

   // Lọc bỏ triệt để khỏi mảng in-memory
   collections = collections.filter(c => !isCollectionDeleted(c, targetIds));
   episodes = episodes.filter(e => !targetIds.includes(e.collectionId) && !targetIds.includes(e.collection_id) && (!target?.recordIds || !target.recordIds.includes(e.recordId)));

   // Xóa trong storage cục bộ
   legacy.deleteCollection(id);
   if (target?.id && target.id !== id) legacy.deleteCollection(target.id);
   if (target?.title) {
     const allLegacy = legacy.getCollections() || [];
     for (const lc of allLegacy) {
       if (lc.title?.toLowerCase() === target.title.toLowerCase()) {
         legacy.deleteCollection(lc.id);
       }
     }
   }

   // Server sync xóa record / folder
   if (target?.organizerId && elioClient.deleteCollection) {
     elioClient.deleteCollection({ id: target.organizerId }).catch(() => {});
   }
   if (target?.recordIds?.length && elioClient.deleteRecord) {
     target.recordIds.forEach(recordId => elioClient.deleteRecord({ recordId }).catch(() => {}));
   }

   notify();
   return true;
  },
  deleteEpisode:async id=>{
   const target = episodes.find(e => e.id === id || e.recordId === id) || legacy.getEpisodeById(id);
   const targetIds = [id, target?.id, target?.recordId].filter(Boolean);

   if (target) {
     addDeletedEpisode(target);
   } else {
     addDeletedEpisode({ id });
   }

   // Lọc bỏ triệt để khỏi mảng in-memory
   episodes = episodes.filter(e => !targetIds.includes(e.id) && !targetIds.includes(e.recordId));
   collections = collections.map(c => {
     if (c.episodes) {
       return { ...c, episodes: c.episodes.filter(e => !targetIds.includes(e.id) && !targetIds.includes(e.recordId)) };
     }
     return c;
   });

   // Xóa trong storage cục bộ
   legacy.deleteEpisode(id);
   if (target?.id && target.id !== id) legacy.deleteEpisode(target.id);

   if (target?.recordId && elioClient.deleteRecord) {
     elioClient.deleteRecord({ recordId: target.recordId }).catch(() => {});
   }

   notify();
   return true;
  },
  resetDefaults:()=>{
   try{
     localStorage.removeItem('sprach_deleted_listening_collections');
     localStorage.removeItem('sprach_deleted_listening_episodes');
   }catch{}
   if(legacy.resetDefaults) legacy.resetDefaults();
   hydrate().catch(()=>{});
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
