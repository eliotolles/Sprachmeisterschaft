import {ListeningV2Core} from './listening-content.js';
import {coreError} from './database.js';
export async function fetchPlaylist(env,input,fetcher=fetch){
 const id=ListeningV2Core.playlist(input?.url);if(!id)throw coreError(400,'PLAYLIST_URL','Cần link playlist YouTube HTTPS có tham số list.');
 if(!env.TRANSCRIPT_BACKEND_URL||!env.TRANSCRIPT_BACKEND_TOKEN)throw coreError(503,'PLAYLIST_NOT_CONFIGURED','Chưa cấu hình backend Python để đọc playlist. Bạn vẫn có thể nhập từng video.');
 let base;try{base=new URL(env.TRANSCRIPT_BACKEND_URL);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/')throw Error();}catch{throw coreError(503,'PLAYLIST_NOT_CONFIGURED','Địa chỉ backend playlist chưa hợp lệ.');}
 let response;try{response=await fetcher(new URL('/v1/playlist',base),{method:'POST',redirect:'manual',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.TRANSCRIPT_BACKEND_TOKEN},body:JSON.stringify({playlistId:id})});}catch{throw coreError(504,'PLAYLIST_TIMEOUT','Không kết nối được backend playlist hoặc hết thời gian chờ. Chưa lưu video.');}
 if([401,403].includes(response.status))throw coreError(503,'PLAYLIST_BACKEND_AUTH','Backend playlist từ chối quyền truy cập.');
 if(response.status===429)throw coreError(429,'PLAYLIST_RATE_LIMIT','Nguồn playlist đang giới hạn yêu cầu.');
 if(response.status===404)throw coreError(503,'PLAYLIST_BACKEND_VERSION','Backend chưa có endpoint đọc playlist; cần triển khai bản Python mới.');
 if(!response.ok)throw coreError(502,'PLAYLIST_BACKEND_ERROR','Backend playlist chưa sẵn sàng.');
 let data;try{const raw=await response.text();if(raw.length>1500000)throw Error();data=JSON.parse(raw);}catch{throw coreError(502,'PLAYLIST_DATA','Backend trả danh sách không hợp lệ.');}
 if(data.available!==true){const code=['PLAYLIST_LIMIT','PLAYLIST_INCOMPLETE','PLAYLIST_UNAVAILABLE','PLAYLIST_TIMEOUT','PLAYLIST_BUSY'].includes(data.code)?data.code:'PLAYLIST_SOURCE_ERROR';throw coreError(502,code,'Chưa đọc đầy đủ playlist từ nguồn. Không lưu danh sách thiếu.');}
 const ids=new Set();if(data.playlistId!==id||data.complete!==true||!Array.isArray(data.items)||!data.items.length||data.items.length>2000||!Number.isSafeInteger(data.unavailable)||data.unavailable<0||data.total!==data.items.length+data.unavailable||data.items.some(v=>!v||!/^[\w-]{11}$/.test(v.id)||typeof v.title!=='string'||!v.title.trim()||v.title.length>500||ids.has(v.id)||!ids.add(v.id)))throw coreError(502,'PLAYLIST_DATA','Backend trả sai playlist, video trùng hoặc danh sách thiếu.');
 return {playlistId:id,title:String(data.title||'Playlist YouTube').slice(0,500),complete:true,total:data.total,unavailable:data.unavailable,items:data.items.map(v=>({id:v.id,title:v.title}))};
}
