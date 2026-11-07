import {groupListeningLibrary} from './listening-groups.js';
import {activeCollectionId} from './collection-types.js';
import {toast} from 'sonner';
import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createListeningBinding,listeningRouteIds} from '../core/elio/listening-binding.js';
export const listeningCoreActive=()=>elioAuthentication()?.isActive()===true;
export const newListeningBinding=()=>createListeningBinding({client:elioClient,isActive:listeningCoreActive});
let binding=null;
export const elioListening=()=>binding;
export function installListeningRuntime(db){if(binding)return binding;const core=newListeningBinding(),legacy={...db.listening};let owner=null,collections=[],episodes=[];
 const clear=()=>{owner=elioClient.getUser()?.id;collections=[];episodes=[];core.reset();};const scope=()=>{if(owner!==elioClient.getUser()?.id)clear();};
 const notify=()=>{window.dispatchEvent(new CustomEvent('sprach_listening_change'));window.dispatchEvent(new CustomEvent('sprach_db_change'));};
 async function hydrate(){clear();notify();if(!listeningCoreActive()||!owner)return;const current=owner;const [{videos},folders]=await Promise.all([core.load(),elioClient.collections()]);if(current!==elioClient.getUser()?.id)throw Error('Tài khoản đã thay đổi.');const result=groupListeningLibrary(videos,folders.items);collections=result.collections;episodes=result.episodes;notify();}

 const api={getCollections:(options={})=>{scope();return listeningCoreActive()?collections.filter(c=>(!options.level||options.level==='ALL'||c.levels?.includes(options.level))&&(!options.scope||c.scope===options.scope)):legacy.getCollections(options);},getCollectionById:id=>{scope();return listeningCoreActive()?collections.find(c=>c.id===id)||collections.find(c=>c.recordIds?.some(record=>encodeURIComponent(record)===id)):legacy.getCollectionById(id);},getEpisodes:id=>{scope();return listeningCoreActive()?episodes.filter(e=>e.collection_id===id||encodeURIComponent(e.recordId)===id):legacy.getEpisodes(id);},getEpisodeById:id=>{scope();return listeningCoreActive()?episodes.find(e=>e.id===id):legacy.getEpisodeById(id);}};
 async function remove(recordId,itemId){
  const captured=elioClient.getUser()?.id;
  const result=await elioClient.deleteRecord({recordId,...(itemId!==undefined?{itemId}:{})});
  if(captured!==elioClient.getUser()?.id||result.userId!==captured||result.recordId!==recordId)throw Error('Tài khoản hoặc nội dung đã thay đổi.');
  await hydrate();return true;
 }
 api.deleteCollection=async id=>{
  if(!listeningCoreActive())return legacy.deleteCollection(id);
  scope();const collection=collections.find(item=>item.id===id);
  if(!collection)throw Error('Không tìm thấy bộ video đang chọn.');
  throw Error('Bộ nghe gồm nhiều tài liệu. Dùng Sửa / Xóa nội dung import để chọn chính xác tài liệu cần xóa.');
 };
 api.deleteEpisode=async id=>{
  if(!listeningCoreActive())return legacy.deleteEpisode(id);
  scope();const episode=episodes.find(item=>item.id===id);
  if(!episode)throw Error('Không tìm thấy video đang chọn.');
  return remove(episode.recordId,episode.itemId);
 };
 for(const name of Object.keys(legacy))if(!(name in api))api[name]=(...args)=>{if(!listeningCoreActive())return legacy[name](...args);throw Error('Thao tác thư viện nghe chưa nối server; chưa ghi hoặc xóa dữ liệu cục bộ.');};
 window.addEventListener('sprach_core_imported',()=>{if(listeningCoreActive())hydrate().catch(error=>toast.error(error.message));});
 db.listening=api;binding={hydrate,submit:core.submit,isActive:listeningCoreActive};window.addEventListener('sprach_auth_change',()=>{if(listeningCoreActive())hydrate().catch(error=>{if(error.code!=='ACCOUNT_CHANGED'){notify();toast.error(error.message);}});else{clear();notify();}});return binding;
}
