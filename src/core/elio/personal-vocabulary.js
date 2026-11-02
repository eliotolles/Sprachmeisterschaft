import {coreError,query} from './database.js';import {digest} from './passwords.js';
const missing=()=>coreError(404,'DECK_NOT_FOUND','Không tìm thấy bộ từ được phép đọc.');
export async function vocabularyDeck(env,user,id){
 if(typeof id!=='string'||!id||id.length>256)throw missing();
 const row=(await query(env,"SELECT id,owner,public,data FROM ee_records WHERE id=? AND kind='vocab' AND (owner=? OR public=1)",[id,user.id])).rows[0];if(!row)throw missing();let data;try{data=JSON.parse(row.data);}catch{throw coreError(409,'DECK_INVALID','Bộ từ chưa đọc được; không ghi đè.');}
 if(!Array.isArray(data.words))throw coreError(409,'DECK_INVALID','Bộ từ chưa có danh sách words hợp lệ.');
 return {row,data,revision:await digest(row.data)};
}
export async function readVocabularyDeck(env,user,id){const {row,data,revision}=await vocabularyDeck(env,user,id);return {id:row.id,shared:!!row.public,canEdit:row.owner===user.id||!!row.public&&['admin','super_admin'].includes(user.role),collection:data,revision};}
export async function saveSharedWord(env,user,input){
 if(typeof input.sourceId!=='string'||!input.sourceId||input.sourceId.length>128||typeof input.deckId!=='string'||typeof input.revision!=='string')throw coreError(400,'SAVE_WORD_INPUT','Chọn bộ từ và phiên bản hợp lệ.');
 const {row,data,revision}=await vocabularyDeck(env,user,input.deckId);
 if(row.owner!==user.id&&!(row.public&&['admin','super_admin'].includes(user.role)))throw coreError(403,'DECK_OWNER','Không được sửa bộ từ này.');
 if(revision!==input.revision)return {conflict:true,revision};
 const source=(await query(env,'SELECT * FROM elio_shared_vocabulary WHERE source_id=?',[input.sourceId])).rows[0];if(!source)throw coreError(404,'WORD_NOT_FOUND','Không tìm thấy từ nguồn.');
 if(data.words.some(w=>w.id===input.sourceId||w.sourceId===input.sourceId))return {userId:user.id,deckId:row.id,sourceId:input.sourceId,skipped:true,reason:'already-present',revision};
 let extra;try{extra=JSON.parse(source.extra_json||'{}');}catch{throw coreError(409,'WORD_INVALID','Dữ liệu từ nguồn chưa đọc được.');}
 data.words.push({id:source.source_id,sourceId:source.source_id,de:source.german,vi:source.vietnamese,article:source.article,type:source.word_type,level:source.level,example:source.example_de,exampleVi:source.example_vi,english:extra.english||'',sourceDeckId:source.source_deck_id,extra});
 // Keep the imported items alias consistent without replacing other legacy metadata.
 if(Array.isArray(data.items))data.items=data.words;
 const value=JSON.stringify(data);if(new TextEncoder().encode(value).byteLength>1500000)throw coreError(413,'DECK_LIMIT','Bộ từ đã đầy; chưa xóa từ cũ.');
 const saved=await query(env,"UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND kind='vocab' AND data=? RETURNING id",[value,new Date().toISOString(),row.id,row.data]);
 return saved.rows.length?{userId:user.id,deckId:row.id,sourceId:input.sourceId,skipped:false,revision:await digest(value)}:{conflict:true};
}
