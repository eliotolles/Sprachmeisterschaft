import {coreError,query} from './database.js';
import {digest} from './passwords.js';
import {COLLECTION_SKILLS,collectionAccepts} from '../../lib/collection-types.js';

const PREFIX='sprach:collection:';
const isAdmin=user=>['admin','super_admin'].includes(user.role);
const invalid=()=>coreError(400,'COLLECTION_INPUT','Thông tin bộ học không hợp lệ.');
export async function readCollection(env,user,id,{write=false}={}){
 if(typeof id!=='string'||!id||id.length>128)throw invalid();
 const row=(await query(env,'SELECT value FROM ee_config WHERE key=?',[PREFIX+id])).rows[0];
 if(!row)throw coreError(404,'COLLECTION_NOT_FOUND','Không tìm thấy bộ học.');
 let value;try{value=JSON.parse(row.value);}catch{throw coreError(409,'COLLECTION_INVALID','Dữ liệu bộ học chưa đọc được.');}
 if(value.archived||value.owner!==user.id&&(value.visibility!=='public'||write&&!isAdmin(user)))throw coreError(403,'COLLECTION_ACCESS','Không có quyền sử dụng bộ học này.');
 return {...value,revision:await digest(row.value),raw:row.value};
}
export async function listCollections(env,user){
 const rows=(await query(env,"SELECT value FROM ee_config WHERE key GLOB 'sprach:collection:*' AND (json_extract(value,'$.owner')=? OR json_extract(value,'$.visibility')='public') ORDER BY key LIMIT 1001",[user.id])).rows;
 if(rows.length>1000)throw coreError(413,'COLLECTION_LIMIT','Danh sách bộ vượt giới hạn tải.');
 const items=[];
 for(const row of rows){
  let value;try{value=JSON.parse(row.value);}catch{throw coreError(409,'COLLECTION_INVALID','Một bộ học chưa đọc được.');}
  if(!value.archived)items.push({...value,canEdit:value.owner===user.id||value.visibility==='public'&&isAdmin(user),revision:await digest(row.value)});
 }
 return {items:items.sort((a,b)=>a.name.localeCompare(b.name,'vi'))};
}
export async function createCollection(env,user,input){
 if(!input||Object.keys(input).some(key=>!['name','skill','visibility','requestId'].includes(key))||
 typeof input.name!=='string'||!input.name.trim()||input.name.length>150||!Object.hasOwn(COLLECTION_SKILLS,input.skill)||
 !['private','public'].includes(input.visibility)||typeof input.requestId!=='string'||!input.requestId||input.requestId.length>128)throw invalid();
 if(input.visibility==='public'&&!isAdmin(user))throw coreError(403,'ADMIN_REQUIRED','Chỉ Admin được tạo bộ chung.');
 const id=await digest(user.id+'|'+input.requestId),key=PREFIX+id;
 const value={id,owner:user.id,name:input.name.trim(),skill:input.skill,visibility:input.visibility,createdAt:new Date().toISOString()};
 await query(env,'INSERT INTO ee_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING',[key,JSON.stringify(value)]);
 const saved=await readCollection(env,user,id,{write:true});
 if(saved.name!==value.name||saved.skill!==value.skill||saved.visibility!==value.visibility)throw coreError(409,'COLLECTION_CONFLICT','Yêu cầu tạo bộ đã được dùng cho nội dung khác.');
 const {raw,...result}=saved;
 return {collection:{...result,canEdit:true}};
}
export async function validateCollectionTarget(env,user,id,kind,visibility){
 if(!id)return null;
 const target=await readCollection(env,user,id,{write:true});
 if(!collectionAccepts(target.skill,kind))throw coreError(400,'COLLECTION_KIND','Loại tài liệu không phù hợp với bộ đã chọn.');
 if(target.visibility!==visibility)throw coreError(400,'COLLECTION_VISIBILITY','Phạm vi tài liệu phải khớp phạm vi của bộ.');
 return target;
}
export async function moveCollectionRecord(env,user,input){
 if(!input||Object.keys(input).some(key=>!['recordId','collectionId'].includes(key))||input.collectionId!==null&&typeof input.collectionId!=='string'||typeof input.recordId!=='string'||!input.recordId||input.recordId.length>256||!Object.hasOwn(input,'collectionId'))throw invalid();
 const row=(await query(env,'SELECT id,owner,kind,public,data FROM ee_records WHERE id=?',[input.recordId])).rows[0];
 if(!row)throw coreError(404,'RECORD_NOT_FOUND','Không tìm thấy tài liệu.');
 if(row.owner!==user.id&&!(row.public&&isAdmin(user)))throw coreError(403,'COLLECTION_ACCESS','Không có quyền sắp xếp tài liệu này.');
 await validateCollectionTarget(env,user,input.collectionId,row.kind,row.public?'public':'private');
 let data;try{data=JSON.parse(row.data);}catch{throw coreError(409,'CONTENT_INVALID','Tài liệu chưa đọc được.');}
 if(input.collectionId)data.organizerId=input.collectionId;else delete data.organizerId;
 const value=JSON.stringify(data);
 const result=await query(env,'UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND data=? RETURNING id',[value,new Date().toISOString(),row.id,row.data]);
 if(!result.rows.length)throw coreError(409,'CONTENT_CHANGED','Tài liệu đã thay đổi; hãy tải lại.');
 return {userId:user.id,recordId:row.id,collectionId:input.collectionId||null};
}

export async function renameCollection(env,user,input){
 if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.length>150)throw invalid();
 const current=await readCollection(env,user,input.id,{write:true});if(input.revision!==current.revision)throw coreError(409,'COLLECTION_CONFLICT','Tên bộ vừa thay đổi; tải lại trước khi sửa.');
 const {raw,revision,...data}=current;data.name=input.name.trim();const value=JSON.stringify(data);
 const result=await query(env,'UPDATE ee_config SET value=? WHERE key=? AND value=? RETURNING key',[value,PREFIX+input.id,raw]);if(!result.rows.length)throw coreError(409,'COLLECTION_CONFLICT','Bộ vừa thay đổi; chưa ghi đè.');
 return {collection:{...data,canEdit:true,revision:await digest(value)}};
}
