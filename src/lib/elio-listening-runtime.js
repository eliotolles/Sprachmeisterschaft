import {groupListeningLibrary} from './listening-groups.js';
import {cleanListeningCues} from './listening-cues.js';
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

const pruneDeletedLists = (serverCollections, serverEpisodes) => {
  // Dọn các mục ẩn đã cũ: video/bộ vẫn còn trên máy chủ thì không được ẩn
  // nữa — nếu không, xóa rồi import lại cùng video sẽ không bao giờ hiện lên.
  // Chỉ giữ lại các mục ẩn không còn trên server (video local đã xóa, bản
  // sao local của video server đã xóa).
  try {
    const liveColIds = new Set();
    for (const c of serverCollections || []) {
      if (c.id) liveColIds.add(c.id);
      (c.recordIds || []).forEach(r => liveColIds.add(r));
      if (c.organizerId) liveColIds.add(c.organizerId);
    }
    const liveEpIds = new Set();
    for (const e of serverEpisodes || []) {
      if (e.id) liveEpIds.add(e.id);
      if (e.recordId) liveEpIds.add(e.recordId);
      if (e.youtubeId) liveEpIds.add(e.youtubeId);
    }
    const cols = getDeletedCollections().filter(id => !liveColIds.has(id));
    const eps = getDeletedEpisodes().filter(id => !liveEpIds.has(id));
    localStorage.setItem('sprach_deleted_listening_collections', JSON.stringify(cols));
    localStorage.setItem('sprach_deleted_listening_episodes', JSON.stringify(eps));
  } catch {}
};

const addDeletedCollection = (col) => {
  try {
    const list = getDeletedCollections();
    // Chỉ khớp theo ID — khớp theo tiêu đề từng xóa nhầm các bộ khác trùng tên.
    const ids = [col.id, ...(col.recordIds || []), col.organizerId].filter(Boolean);
    for (const item of ids) {
      if (!list.includes(item)) list.push(item);
    }
    localStorage.setItem('sprach_deleted_listening_collections', JSON.stringify(list));
  } catch {}
};

const addDeletedEpisode = (ep) => {
  try {
    const list = getDeletedEpisodes();
    // Chỉ ghi youtubeId khi xóa tập trên server: để bản sao local cùng video
    // cũng ẩn theo. Xóa bản local thì không ghi youtubeId, kẻo video trên
    // server (cùng youtubeId) cũng bị ẩn theo.
    const ids = [ep.id, ep.recordId, ...(ep.recordId ? [ep.youtubeId] : [])].filter(Boolean);
    for (const item of ids) {
      if (!list.includes(item)) list.push(item);
    }
    localStorage.setItem('sprach_deleted_listening_episodes', JSON.stringify(list));
  } catch {}
};

const isCollectionDeleted = (c, deletedCols) => {
  if (!c) return true;
  return deletedCols.includes(c.id) ||
         (c.recordIds && c.recordIds.some(r => deletedCols.includes(r))) ||
         (c.organizerId && deletedCols.includes(c.organizerId));
};

const isEpisodeDeleted = (e, deletedEps, deletedCols) => {
  if (!e) return true;
  if (deletedEps.includes(e.id) || deletedEps.includes(e.recordId) || (e.youtubeId && deletedEps.includes(e.youtubeId))) return true;
  if (e.collectionId && isCollectionDeleted({ id: e.collectionId }, deletedCols)) return true;
  if (e.collection_id && isCollectionDeleted({ id: e.collection_id }, deletedCols)) return true;
  return false;
};

const saveServerSubtitles = async (target, cues) => {
  // Lưu phụ đề của video trên máy chủ vào chính record chứa nó (qua API sửa
  // record có sẵn). Không có đường này thì phụ đề chỉ nằm ở localStorage và
  // mất sau khi tải lại trang.
  const { record, revision } = await elioClient.editableRecord(target.recordId);
  let data;
  try { data = JSON.parse(record.data); } catch { throw new Error('Dữ liệu bài nghe trên máy chủ chưa đọc được.'); }
  const items = Array.isArray(data.items) ? data.items : null;
  if (!items || !items.length) throw new Error('Bài nghe trên máy chủ chưa hỗ trợ lưu phụ đề.');
  const item = target.itemId !== undefined ? items.find(i => i.id === target.itemId) : items[0];
  if (!item) throw new Error('Không tìm thấy tập video trên máy chủ.');
  const clean = cleanListeningCues(cues);
  if (!clean.length) throw new Error('Phụ đề không có câu nào hợp lệ để lưu.');
  const nextItems = items.map(i => i === item ? { ...i, cues: clean } : i);
  await elioClient.editRecord({ recordId: target.recordId, revision, title: record.title, items: nextItems });
  return true;
};

export function installListeningRuntime(db){
 if(binding)return binding;
 const core=newListeningBinding(),legacy={...db.listening};let owner=null,collections=[],episodes=[];
 const clear=()=>{owner=elioClient.getUser()?.id;collections=[];episodes=[];core.reset();};
 const scope=()=>{if(owner!==elioClient.getUser()?.id){clear();hydrate().catch(()=>{});}};
 const notify=()=>{window.dispatchEvent(new CustomEvent('sprach_listening_change'));window.dispatchEvent(new CustomEvent('sprach_db_change'));};
 
 async function hydrate(){
  owner=elioClient.getUser()?.id;
  if(!listeningCoreActive()||!owner)return;
  const current=owner;
  try{
   const [{videos},folders]=await Promise.all([core.load(),elioClient.collections()]);
   if(current!==elioClient.getUser()?.id)return;
   const result=groupListeningLibrary(videos,folders?.items||[]);
   pruneDeletedLists(result.collections || [], result.episodes || []);
   const deletedCols = getDeletedCollections();
   const deletedEps = getDeletedEpisodes();
   collections=(result.collections||[]).filter(c => !isCollectionDeleted(c, deletedCols));
   episodes=(result.episodes||[]).filter(e => !isEpisodeDeleted(e, deletedEps, deletedCols));
  }catch(e){
   // Giữ dữ liệu server cũ đang hiển thị, chỉ báo lỗi — không xóa trắng thư viện.
   toast.error('Không tải được video trên máy chủ, đang hiển thị video trong máy này.');
  }
  notify();
 }

 const api={
  getCollections:(options={})=>{
   scope();
   const deletedCols = getDeletedCollections();
   const legacyCols = (legacy.getCollections(options) || []).filter(c => !isCollectionDeleted(c, deletedCols));
   if(listeningCoreActive()&&collections.length>0){
    const filtered=collections
      .filter(c => !isCollectionDeleted(c, deletedCols))
      .filter(c=>(!options.level||options.level==='ALL'||c.levels?.includes(options.level))&&(!options.scope||c.scope===options.scope));
    const merged = [...filtered];
    for (const lc of legacyCols) {
      const exists = merged.some(c => c.id === lc.id || (c.organizerId && lc.organizerId && c.organizerId === lc.organizerId));
      if (!exists) {
        merged.push(lc);
      }
    }
    return merged;
   }
   return legacyCols;
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
   let found = [];
   if(listeningCoreActive()&&episodes.length>0){
    found=episodes.filter(e=>(e.collection_id===id||encodeURIComponent(e.recordId)===id||e.collectionId===id) && !isEpisodeDeleted(e, deletedEps, deletedCols));
   }
   const legacyEps = (legacy.getEpisodes(id) || []).filter(e => !isEpisodeDeleted(e, deletedEps, deletedCols));
   if (found.length === 0) return legacyEps;
   const merged = [...found];
   for (const le of legacyEps) {
     if (!merged.some(e => e.id === le.id || (e.youtubeId && le.youtubeId && e.youtubeId === le.youtubeId))) {
       merged.push(le);
     }
   }
   return merged;
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
  updateEpisode:async (id,updates)=>{
   const target = episodes.find(e => e.id === id) || legacy.getEpisodeById(id);
   // Video trên máy chủ: phụ đề phải lưu vào record trên server, không phải
   // localStorage — nếu không, tải lại trang là phụ đề biến mất.
   if (target?.recordId && updates?.subtitles && elioClient.editableRecord && elioClient.editRecord) {
     await saveServerSubtitles(target, updates.subtitles);
     const idx = episodes.findIndex(e => e.id === id);
     if (idx >= 0) episodes[idx] = { ...episodes[idx], subtitles: updates.subtitles };
     notify();
     return true;
   }
   return legacy.updateEpisode(id,updates);
  },
  deleteCollection:async id=>{
   const target = collections.find(c => c.id === id || c.recordIds?.includes(id)) || legacy.getCollectionById(id);

   // Xóa trên server TRƯỚC: nếu server từ chối thì không động gì ở máy này,
   // bộ vẫn hiện như cũ thay vì báo xóa thành công rồi tự hiện lại.
   let serverError = null;
   if (target?.organizerId && elioClient.deleteCollection) {
     try { await elioClient.deleteCollection({ id: target.organizerId }); } catch (e) { serverError = e; }
   }
   if (target?.recordIds?.length && elioClient.deleteRecord) {
     for (const recordId of target.recordIds) {
       try { await elioClient.deleteRecord({ recordId }); } catch (e) { serverError = e; }
     }
   }
   if (serverError) throw new Error('Chưa xóa được bộ trên máy chủ: ' + (serverError?.message || 'lỗi không rõ') + '.');

   const targetIds = [id, target?.id, ...(target?.recordIds || []), target?.organizerId].filter(Boolean);

   if (target) {
     addDeletedCollection(target);
   } else {
     addDeletedCollection({ id });
   }

   // Lọc bỏ triệt để khỏi mảng in-memory
   collections = collections.filter(c => !isCollectionDeleted(c, targetIds));
   episodes = episodes.filter(e => !targetIds.includes(e.collectionId) && !targetIds.includes(e.collection_id) && (!target?.recordIds || !target.recordIds.includes(e.recordId)));

   // Xóa trong storage cục bộ — chỉ đúng id được chọn, không xóa theo tên.
   legacy.deleteCollection(id);
   if (target?.id && target.id !== id) legacy.deleteCollection(target.id);

   notify();
   return true;
  },
  deleteEpisode:async id=>{
   const target = episodes.find(e => e.id === id || e.recordId === id) || legacy.getEpisodeById(id);
   if (!target) {
     addDeletedEpisode({ id });
     notify();
     return true;
   }

   // Xóa trên server TRƯỚC: nếu server từ chối thì không động gì ở máy này.
   if (target.recordId && elioClient.deleteRecord) {
     // Playlist import = 1 record chứa nhiều tập: chỉ xóa đúng tập đó;
     // chỉ xóa cả record khi đó là tập duy nhất còn lại.
     const siblings = episodes.filter(e => e.recordId === target.recordId);
     try {
       if (target.itemId !== undefined && siblings.length > 1) {
         await elioClient.deleteRecord({ recordId: target.recordId, itemId: target.itemId });
       } else {
         await elioClient.deleteRecord({ recordId: target.recordId });
       }
     } catch (serverErr) {
       throw new Error('Chưa xóa được video trên máy chủ: ' + (serverErr?.message || 'lỗi không rõ') + '.');
     }
   }

   addDeletedEpisode(target);

   // Chỉ gỡ đúng tập bị xóa khỏi mảng in-memory: xóa 1 tập trong playlist
   // không được làm các tập còn lại của cùng record biến mất theo.
   const isTargetEp = (e) => e.id === target.id || (target.itemId === undefined && target.recordId && e.recordId === target.recordId);
   episodes = episodes.filter(e => !isTargetEp(e));
   collections = collections.map(c => {
     if (c.episodes) {
       return { ...c, episodes: c.episodes.filter(e => !isTargetEp(e)) };
     }
     return c;
   });

   // Xóa trong storage cục bộ
   legacy.deleteEpisode(id);
   if (target.id && target.id !== id) legacy.deleteEpisode(target.id);

   // Xóa luôn bản sao local cùng video (nếu có) để khỏi còn bản mồ côi ẩn
   // trong kho — nếu không, import lại video này sẽ hiện trùng 2 lần.
   if (target.youtubeId) {
     try {
       for (const lc of legacy.getCollections() || []) {
         for (const le of legacy.getEpisodes(lc.id) || []) {
           if (le.youtubeId === target.youtubeId) legacy.deleteEpisode(le.id);
         }
       }
     } catch {}
   }

   notify();
   return true;
  },
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
 if(listeningCoreActive())hydrate().catch(()=>{});
 return binding;
}
