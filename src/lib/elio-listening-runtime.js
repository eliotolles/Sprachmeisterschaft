import {toast} from 'sonner';
import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createListeningBinding,listeningRouteIds} from '../core/elio/listening-binding.js';
export const listeningCoreActive=()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiListeningEnabled===true;
export const newListeningBinding=()=>createListeningBinding({client:elioClient,isActive:listeningCoreActive});
let binding=null;
export const elioListening=()=>binding;
export function installListeningRuntime(db){if(binding)return binding;const core=newListeningBinding(),legacy={...db.listening};let owner=null,collections=[],episodes=[];
 const clear=()=>{owner=elioClient.getUser()?.id;collections=[];episodes=[];core.reset();};const scope=()=>{if(owner!==elioClient.getUser()?.id)clear();};
 const notify=()=>{window.dispatchEvent(new CustomEvent('sprach_listening_change'));window.dispatchEvent(new CustomEvent('sprach_db_change'));};
 async function hydrate(){clear();notify();if(!listeningCoreActive()||!owner)return;const current=owner,{videos}=await core.load();if(current!==elioClient.getUser()?.id)throw Error('Tài khoản đã thay đổi.');const cs=new Map(),es=new Map();for(const video of videos){const {collectionId,episodeId}=listeningRouteIds(video);if(es.has(episodeId))throw Error('ID nguồn video bị trùng; chưa gộp hoặc ghi đè.');if(!cs.has(collectionId))cs.set(collectionId,{id:collectionId,title:video.collectionTitle,level:video.level,scope:video.scope,created_by:video.owner,thumbnail:'https://img.youtube.com/vi/'+video.youtubeId+'/hqdefault.jpg'});es.set(episodeId,{id:episodeId,collection_id:collectionId,title:video.title,level:video.level,youtubeId:video.youtubeId,subtitles:video.subtitles});}collections=[...cs.values()];episodes=[...es.values()];notify();}
 const api={getCollections:(options={})=>{scope();return listeningCoreActive()?collections.filter(c=>(!options.level||options.level==='ALL'||c.level===options.level)&&(!options.scope||c.scope===options.scope)):legacy.getCollections(options);},getCollectionById:id=>{scope();return listeningCoreActive()?collections.find(c=>c.id===id):legacy.getCollectionById(id);},getEpisodes:id=>{scope();return listeningCoreActive()?episodes.filter(e=>e.collection_id===id):legacy.getEpisodes(id);},getEpisodeById:id=>{scope();return listeningCoreActive()?episodes.find(e=>e.id===id):legacy.getEpisodeById(id);}};
 for(const name of Object.keys(legacy))if(!(name in api))api[name]=(...args)=>{if(!listeningCoreActive())return legacy[name](...args);throw Error('Thao tác thư viện nghe chưa nối server; chưa ghi hoặc xóa dữ liệu cục bộ.');};
 window.addEventListener('sprach_core_imported',()=>{if(listeningCoreActive())hydrate().catch(error=>toast.error(error.message));});
 db.listening=api;binding={hydrate,submit:core.submit,isActive:listeningCoreActive};window.addEventListener('sprach_auth_change',()=>{if(listeningCoreActive())hydrate().catch(error=>{if(error.code!=='ACCOUNT_CHANGED'){notify();toast.error(error.message);}});else{clear();notify();}});return binding;
}
