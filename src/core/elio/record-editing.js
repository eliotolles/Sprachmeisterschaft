import {coreError,query} from './database.js';
import {digest} from './passwords.js';
import {validateImport} from './importer-validation.js';
import {validateGrammarCollection} from './grammar-content.js';
import {reviewedExams} from './reviewed-import.js';
const canEdit=(user,row)=>row.owner===user.id||!!row.public&&['admin','super_admin'].includes(user.role);
async function editable(env,user,id){
 if(typeof id!=='string'||!id||id.length>256)throw coreError(400,'RECORD_INPUT','Chọn đúng tài liệu.');
 const row=(await query(env,'SELECT id,owner,kind,title,level,public,data FROM ee_records WHERE id=?',[id])).rows[0];
 if(!row)throw coreError(404,'RECORD_NOT_FOUND','Tài liệu không còn tồn tại.');
 if(!canEdit(user,row))throw coreError(403,'RECORD_OWNER','Chỉ chủ nội dung hoặc Admin quản lý nội dung chung được sửa.');
 return row;
}
export async function readEditableRecord(env,user,id){const row=await editable(env,user,id);return {userId:user.id,record:row,revision:await digest(row.data)};}
export async function editRecord(env,user,input){
 const row=await editable(env,user,input?.recordId);
 if(input.revision!==await digest(row.data))throw coreError(409,'CONTENT_CHANGED','Nội dung đã thay đổi. Tải lại trước khi sửa.');
 if(typeof input.title!=='string'||!input.title.trim()||input.title.length>500||!Array.isArray(input.items)||!input.items.length)throw coreError(400,'RECORD_INPUT','Cần tên tài liệu và nội dung hợp lệ.');
 const old=JSON.parse(row.data),previous=old.words||old.items;
 if(!Array.isArray(previous))throw coreError(409,'CONTENT_INVALID','Định dạng nguồn chưa hỗ trợ chỉnh sửa an toàn.');
 const ids=items=>items.map(item=>item?.id).sort();
 if(JSON.stringify(ids(previous))!==JSON.stringify(ids(input.items)))throw coreError(400,'RECORD_IDS','Giữ nguyên ID và số mục để bảo toàn liên kết, đáp án và tiến độ. Xóa tài liệu bằng nút Xóa.');
 const nestedIds=value=>{const found=[];const walk=(node,path)=>{if(Array.isArray(node))node.forEach((item,index)=>walk(item,path+'/'+(item?.id??index)));else if(node&&typeof node==='object'){if(Object.hasOwn(node,'id'))found.push(path+'='+node.id);for(const [key,child] of Object.entries(node))if(child&&typeof child==='object')walk(child,path+'/'+key);}};walk(value,'');return found.sort();};
 if(JSON.stringify(nestedIds(previous))!==JSON.stringify(nestedIds(input.items)))throw coreError(400,'RECORD_IDS','Giữ nguyên ID câu hỏi, bài tập và mục nguồn để không mất liên kết tiến độ.');
 const data={...old,name:input.title.trim(),items:input.items};
 if(row.kind==='vocab')data.words=input.items;
 try{if(row.kind==='grammar')validateGrammarCollection(data);else if(row.kind==='exam'&&!old.rawDocument&&old.sourceBundle!=='telc18-prepared-v1')reviewedExams(JSON.stringify(data));else validateImport(row.kind,data);}catch{throw coreError(400,'RECORD_CONTENT','Nội dung chưa đúng cấu trúc hoặc thiếu trường bắt buộc. Chưa lưu thay đổi.');}
 if(old.sourceBundle==='telc18-prepared-v1'&&data.items.some(item=>!Array.isArray(item.questions)||item.questions.some(q=>typeof q.id!=='string'||typeof q.prompt!=='string'||!Array.isArray(q.options)||q.options.some(option=>typeof option!=='string'))))throw coreError(400,'RECORD_CONTENT','Câu hỏi của đề đã chuẩn hóa chưa hợp lệ.');
 const value=JSON.stringify(data);
 if(new TextEncoder().encode(value).byteLength>1500000)throw coreError(413,'RECORD_LIMIT','Nội dung vượt giới hạn an toàn.');
 const result=await query(env,'UPDATE ee_records SET title=?,data=?,updated_at=? WHERE id=? AND data=? RETURNING id',[data.name,value,new Date().toISOString(),row.id,row.data]);
 if(!result.rows.length)throw coreError(409,'CONTENT_CHANGED','Nội dung vừa thay đổi ở thiết bị khác. Chưa ghi đè.');
 return {userId:user.id,recordId:row.id,revision:await digest(value)};
}
