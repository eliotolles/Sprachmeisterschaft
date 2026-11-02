import {coreError,query} from './database.js';
export async function readJournal(env,user,key,version,initial){
 const row=(await query(env,'SELECT value,revision FROM ee_state WHERE owner=? AND key=?',[user.id,key])).rows[0];
 if((row?.revision??0)!==version)return {conflict:true,version:row?.revision??0};
 let document;try{document=row?JSON.parse(row.value):structuredClone(initial);}catch{throw coreError(409,'HISTORY_INVALID','Lịch sử chưa đọc được; chưa ghi đè.');}
 return {document};
}
export async function saveJournal(env,user,key,version,document){
 const value=JSON.stringify(document);if(new TextEncoder().encode(value).byteLength>1500000)throw coreError(413,'HISTORY_LIMIT','Lịch sử cần lưu trữ bổ sung; chưa xóa dữ liệu cũ.');
 const r=version===0?await query(env,'INSERT INTO ee_state(owner,key,value,revision) VALUES(?,?,?,1) ON CONFLICT(owner,key) DO NOTHING RETURNING revision',[user.id,key,value]):await query(env,'UPDATE ee_state SET value=?,revision=revision+1 WHERE owner=? AND key=? AND revision=? RETURNING revision',[value,user.id,key,version]);
 return r.rows.length?{userId:user.id,version:r.rows[0].revision}:{conflict:true};
}
