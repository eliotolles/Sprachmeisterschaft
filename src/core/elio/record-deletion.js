import {coreError,query} from './database.js';

export async function deleteRecord(env,user,input){
 if(!input||typeof input.recordId!=='string'||!input.recordId||input.recordId.length>256||
   Object.keys(input).some(key=>!['recordId','itemId'].includes(key))||
   input.itemId!==undefined&&!['string','number'].includes(typeof input.itemId)){
  throw coreError(400,'DELETE_INPUT','Chọn đúng nội dung cần xóa.');
 }
 const row=(await query(env,'SELECT id,owner,kind,public,data FROM ee_records WHERE id=?',[input.recordId])).rows[0];
 if(!row)return {userId:user.id,recordId:input.recordId,deleted:false};
 if(row.owner!==user.id&&!['admin','super_admin'].includes(user.role)){
  throw coreError(403,'DELETE_OWNER','Không có quyền xóa nội dung này.');
 }
 let result;
 if(input.itemId===undefined){
  result=await query(env,'DELETE FROM ee_records WHERE id=? AND data=? RETURNING id',[row.id,row.data]);
 }else{
  if(row.kind!=='listening')throw coreError(400,'DELETE_INPUT','Chỉ xóa tập con qua thư viện nghe.');
  let data;try{data=JSON.parse(row.data);}catch{throw coreError(409,'CONTENT_INVALID','Nội dung chưa đọc được; chưa xóa.');}
  if(!Array.isArray(data.items))throw coreError(409,'CONTENT_INVALID','Bộ nghe chưa có danh sách tập hợp lệ.');
  const items=data.items.filter(item=>item.id!==input.itemId);
  if(items.length===data.items.length)return {userId:user.id,recordId:row.id,deleted:false};
  result=await query(env,'UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND data=? RETURNING id',[
   JSON.stringify({...data,items}),new Date().toISOString(),row.id,row.data,
  ]);
 }
 if(!result.rows.length)throw coreError(409,'CONTENT_CHANGED','Nội dung thay đổi trong lúc xóa. Hãy tải lại để kiểm tra.');
 return {userId:user.id,recordId:row.id,deleted:true};
}
