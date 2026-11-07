import {readCollection} from './collections.js';
import {collectionAccepts} from '../../lib/collection-types.js';
import {coreError,query} from './database.js';import {digest} from './passwords.js';
export const LEGACY_VOCAB_DECK='legacy-vocab';
const missing=()=>coreError(404,'DECK_NOT_FOUND','Không tìm thấy bộ từ được phép đọc.');
export async function vocabularyDeck(env,user,id){
 if(typeof id!=='string'||!id||id.length>256)throw missing();
 if(id===LEGACY_VOCAB_DECK){const row=(await query(env,"SELECT value FROM ee_state WHERE owner=? AND key='vocab'",[user.id])).rows[0];if(!row)throw missing();let words;try{words=JSON.parse(row.value);}catch{throw coreError(409,'LEGACY_VOCAB_INVALID','Bộ từ cũ chưa đọc được; chưa ghi đè.');}if(!Array.isArray(words)||words.some(w=>!w||typeof w.id!=='string'||typeof w.de!=='string'||typeof w.vi!=='string')||new Set(words.map(w=>w.id)).size!==words.length)throw coreError(409,'LEGACY_VOCAB_INVALID','Bộ từ cũ không hợp lệ; chưa tự đổi ID.');return {row:{id,owner:user.id,public:0,data:row.value},data:{id,name:'Từ cá nhân từ Elio',words},revision:await digest(row.value),virtual:true};}
 const row=(await query(env,"SELECT id,owner,public,data FROM ee_records WHERE id=? AND kind='vocab' AND (owner=? OR public=1)",[id,user.id])).rows[0];if(!row)throw missing();let data;try{data=JSON.parse(row.data);}catch{throw coreError(409,'DECK_INVALID','Bộ từ chưa đọc được; không ghi đè.');}
 if(!Array.isArray(data.words))throw coreError(409,'DECK_INVALID','Bộ từ chưa có danh sách words hợp lệ.');
 return {row,data,revision:await digest(row.data)};
}
export async function readVocabularyDeck(env,user,id){const {row,data,revision,virtual}=await vocabularyDeck(env,user,id);return {id:row.id,shared:!!row.public,canEdit:!virtual&&(row.owner===user.id||!!row.public&&['admin','super_admin'].includes(user.role)),collection:data,revision};}
export async function saveSharedWord(env,user,input){
 if(typeof input.sourceId!=='string'||!input.sourceId||input.sourceId.length>128||typeof input.deckId!=='string'||typeof input.revision!=='string')throw coreError(400,'SAVE_WORD_INPUT','Chọn bộ từ và phiên bản hợp lệ.');
 const {row,data,revision,virtual}=await vocabularyDeck(env,user,input.deckId);if(virtual)throw coreError(409,'LEGACY_DECK_READ_ONLY','Bộ nguồn cũ được giữ nguyên; hãy sao chép sang bộ riêng để chỉnh sửa.');
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
const lexical=['german','vietnamese','article','word_type','english','example_de','example_vi','topic','level','synonyms','collocations','phrases','chunks','explanation_de','meaning_de','plural','ipa','notes'];
function lexicalWord(input){
 if(!input||typeof input!=='object'||typeof input.german!=='string'||!input.german.trim()||typeof input.vietnamese!=='string'||!input.vietnamese.trim())throw coreError(400,'WORD_INPUT','Cần từ tiếng Đức và nghĩa Việt.');
 if(input.german.length>1000||input.vietnamese.length>2000||input.article!==undefined&&!['','der','die','das'].includes(input.article)||input.level!==undefined&&!['A1','A2','B1','B2','C1','C2',''].includes(input.level))throw coreError(400,'WORD_INPUT','Dữ liệu từ vựng không hợp lệ.');
 for(const field of lexical)if(input[field]!==undefined&&(typeof input[field]!=='string'&&!Array.isArray(input[field])||JSON.stringify(input[field]).length>10000))throw coreError(400,'WORD_INPUT','Trường từ vựng không hợp lệ.');
 return {...Object.fromEntries(lexical.filter(k=>input[k]!==undefined).map(k=>[k,input[k]])),de:input.german.trim(),vi:input.vietnamese.trim(),type:input.word_type||'',example:input.example_de||'',exampleVi:input.example_vi||''};
}
export async function editVocabulary(env,user,input){
 if(!input||!['create','update','delete','deleteShared'].includes(input.action))throw coreError(400,'WORD_INPUT','Thao tác từ vựng không hợp lệ.');
 if(input.action==='deleteShared'){
  if(!['admin','super_admin'].includes(user.role))throw coreError(403,'ADMIN_REQUIRED','Chỉ Admin được xóa từ trong nguồn chung.');
  const ids=input.wordIds;
  if(!Array.isArray(ids)||!ids.length||ids.length>10000||ids.some(id=>typeof id!=='string'||!id||id.length>256)||new Set(ids).size!==ids.length)throw coreError(400,'WORD_INPUT','Danh sách từ cần xóa không hợp lệ.');
  const removed=await query(env,'DELETE FROM elio_shared_vocabulary WHERE source_id IN (SELECT value FROM json_each(?)) RETURNING source_id',[JSON.stringify(ids)]);
  return {userId:user.id,deleted:removed.rows.map(row=>row.source_id)};
 }
 if(input.action==='create'){
  if(!Array.isArray(input.words)||!input.words.length||input.words.length>500)throw coreError(400,'WORD_INPUT','Nhập từ 1 đến 500 từ mỗi lần.');
  const incoming=input.words.map(w=>{const value=lexicalWord(w),id=w.source_id??w.id??crypto.randomUUID();if(typeof id!=='string'||!id||id.length>256)throw coreError(400,'WORD_INPUT','ID từ nguồn không hợp lệ.');return {...value,id};});
  const target=input.organizerId?await readCollection(env,user,input.organizerId,{write:true}):null;
  if(target&&!collectionAccepts(target.skill,'vocab'))throw coreError(400,'COLLECTION_KIND','Bộ đã chọn không nhận từ vựng.');
  const shared=target?.visibility==='public'?1:0;
  const id='personal-vocabulary-'+await digest(target?user.id+'|'+target.id:user.id),empty={id,name:target?target.name:'Từ của tôi',words:[],...(target?{organizerId:target.id}:{})};
  await query(env,'INSERT INTO ee_records(id,owner,kind,title,level,public,data,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',[id,user.id,'vocab',empty.name,'',shared,JSON.stringify(empty),new Date().toISOString()]);
  const row=(await query(env,"SELECT data FROM ee_records WHERE id=? AND owner=? AND kind='vocab' AND public=?",[id,user.id,shared])).rows[0];if(!row)throw coreError(409,'DECK_INVALID','Bộ cá nhân chưa hợp lệ.');let data;try{data=JSON.parse(row.data);}catch{throw coreError(409,'DECK_INVALID','Bộ cá nhân chưa đọc được.');}if(!Array.isArray(data.words))throw coreError(409,'DECK_INVALID','Bộ cá nhân thiếu words.');
  const added=[];for(const word of incoming){if(data.words.some(w=>w.id===word.id||w.de===word.de&&w.vi===word.vi&&(w.article||'')===(word.article||'')))continue;data.words.push(word);added.push(word.id);}
  if(!added.length)return {userId:user.id,deckId:id,added:[]};const value=JSON.stringify(data);if(new TextEncoder().encode(value).byteLength>1500000)throw coreError(413,'DECK_LIMIT','Bộ từ đã đầy; chưa xóa từ cũ.');
  const saved=await query(env,"UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND owner=? AND data=? RETURNING id",[value,new Date().toISOString(),id,user.id,row.data]);if(!saved.rows.length)throw coreError(409,'DECK_CONFLICT','Bộ từ thay đổi ở thiết bị khác; chưa ghi đè.');return {userId:user.id,deckId:id,added};
 }
 const {row,data,revision,virtual}=await vocabularyDeck(env,user,input.deckId);
 if(virtual&&input.action!=='delete')throw coreError(409,'LEGACY_DECK_READ_ONLY','Bộ nguồn cũ chưa hỗ trợ chỉnh sửa nội dung.');
 if(row.owner!==user.id&&!(row.public&&['admin','super_admin'].includes(user.role)))throw coreError(403,'DECK_OWNER','Không được sửa bộ từ này.');
 if(input.revision!==revision)throw coreError(409,'DECK_CONFLICT','Bộ từ đã thay đổi; chưa ghi đè.');
 if(input.action==='delete'){
  const ids=input.wordIds||[input.wordId];
  if(!Array.isArray(ids)||!ids.length||ids.length>10000||ids.some(id=>typeof id!=='string'||!id||id.length>256)||new Set(ids).size!==ids.length)throw coreError(400,'WORD_INPUT','Danh sách từ cần xóa không hợp lệ.');
  const selected=new Set(ids),remaining=data.words.filter(word=>!selected.has(word.id));
  if(remaining.length===data.words.length)return {userId:user.id,deckId:row.id,deleted:[]};
  let saved;
  if(virtual){
   saved=await query(env,"UPDATE ee_state SET value=?,revision=revision+1 WHERE owner=? AND key='vocab' AND value=? RETURNING owner",[JSON.stringify(remaining),user.id,row.data]);
  }else{
   data.words=remaining;
   if(Array.isArray(data.items))data.items=remaining;
   saved=await query(env,"UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND (owner=? OR (public=1 AND ?=1)) AND data=? RETURNING id",[JSON.stringify(data),new Date().toISOString(),row.id,user.id,['admin','super_admin'].includes(user.role)?1:0,row.data]);
  }
  if(!saved.rows.length)throw coreError(409,'DECK_CONFLICT','Bộ từ đã thay đổi; chưa ghi đè.');
  return {userId:user.id,deckId:row.id,deleted:ids.filter(id=>!remaining.some(word=>word.id===id))};
 }
 const index=data.words.findIndex(w=>w.id===input.wordId);if(index<0)throw coreError(404,'WORD_NOT_FOUND','Không tìm thấy từ trong bộ riêng.');
 data.words[index]={...data.words[index],...lexicalWord(input.word),id:data.words[index].id};
 if(Array.isArray(data.items))data.items=data.words;const value=JSON.stringify(data);if(new TextEncoder().encode(value).byteLength>1500000)throw coreError(413,'DECK_LIMIT','Bộ từ đã đầy.');
 const saved=await query(env,"UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND (owner=? OR (public=1 AND ?=1)) AND data=? RETURNING id",[value,new Date().toISOString(),row.id,user.id,['admin','super_admin'].includes(user.role)?1:0,row.data]);if(!saved.rows.length)throw coreError(409,'DECK_CONFLICT','Bộ từ đã thay đổi; chưa ghi đè.');return {userId:user.id,deckId:row.id,wordId:input.wordId};
}
