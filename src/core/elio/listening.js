import {digest} from './passwords.js';
import {coreError,query} from './database.js';
import {fetchElioTranscript} from './transcript-backend.js';
import {ListeningV2Core} from './listening-content.js';
import {readJournal,saveJournal} from './journal.js';
export const LISTENING_KEY='sprach_listening_results';
export async function getTranscript(env,input,user){
 const id=ListeningV2Core.id(input.url)||(/^[\w-]{11}$/.test(input.videoId||'')?input.videoId:null);
 if(!id)throw coreError(400,'VIDEO_ID','URL YouTube không hợp lệ.');
 if(input.recordId===undefined)return fetchElioTranscript(env,id,['de']);
 const row=(await query(env,"SELECT data FROM ee_records WHERE id=? AND kind='listening' AND owner=?",[input.recordId,user.id])).rows[0];
 if(!row)throw coreError(403,'CAPTION_WRITE_FORBIDDEN','Chỉ chủ sở hữu được lưu phụ đề cho bài này.');
 const data=JSON.parse(row.data), item=input.itemId===undefined?data:data.items?.find(i=>i.id===input.itemId);
 if(!item||(item.youtubeId||item.videoId||ListeningV2Core.id(item.url||item.youtubeUrl||''))!==id)throw coreError(409,'VIDEO_CHANGED','Video đã thay đổi.');
 if(item.cues?.length)throw coreError(409,'CAPTION_EXISTS','Bài đã có phụ đề; không ghi đè.');
 const result=await fetchElioTranscript(env,id,['de']);if(!result.available)return result;
 item.cues=result.cues;item.transcriptComplete=true;item.transcriptSource=result.source;
 const value=JSON.stringify(data);
 if(new TextEncoder().encode(value).byteLength>1500000)throw coreError(413,'CAPTION_LIMIT','Bản lời vượt giới hạn lưu trữ.');
 const saved=await query(env,"UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND owner=? AND data=? RETURNING id",[value,new Date().toISOString(),input.recordId,user.id,row.data]);
 if(!saved.rows.length)throw coreError(409,'CAPTION_CHANGED','Bài nghe đã thay đổi; chưa ghi đè.');
 return {...result,saved:true};
}
// Caption answers are resolved from accessible stored records, never from the request.
export async function submitDictation(env,user,input){
 if(!Number.isSafeInteger(input.version)||input.version<0||!Number.isSafeInteger(input.cueIndex)||input.cueIndex<0||typeof input.answer!=='string'||input.answer.length>5000||typeof input.recordId!=='string')throw coreError(400,'DICTATION_INPUT','Bài nghe không hợp lệ.');
 const row=(await query(env,"SELECT data FROM ee_records WHERE id=? AND kind='listening' AND (owner=? OR public=1)",[input.recordId,user.id])).rows[0];
 if(!row)throw coreError(404,'LISTENING_NOT_FOUND','Không tìm thấy bài nghe.');
 let data;try{data=JSON.parse(row.data);}catch{throw coreError(409,'LISTENING_INVALID','Dữ liệu bài nghe chưa đọc được.');}
 const content=input.itemId===undefined?data:data.items?.find(item=>item.id===input.itemId);
 const cue=content?.cues?.[input.cueIndex];
 if(!cue||typeof cue.text!=='string'||!cue.text.trim()||cue.text.length>5000)throw coreError(409,'CAPTION_REQUIRED','Bài nghe chưa có phụ đề để chấm.');
 if(input.cueRevision!==undefined&&(typeof input.cueRevision!=='string'||input.cueRevision!==await digest(JSON.stringify(cue))))throw coreError(409,'CAPTION_CHANGED','Phụ đề đã thay đổi; chưa ghi bài làm vào câu khác.');
 let result;try{result=ListeningV2Core.compare(input.answer,cue.text,input.strict===true);}catch{throw coreError(400,'DICTATION_LIMIT','Chia câu thành đoạn ngắn hơn.');}
 const journal=await readJournal(env,user,LISTENING_KEY,input.version,{attempts:[]});if(journal.conflict)return journal;
 if(!Array.isArray(journal.document.attempts))throw coreError(409,'HISTORY_INVALID','Lịch sử chưa đọc được.');
 const attempt={id:crypto.randomUUID(),recordId:input.recordId,...(input.itemId!==undefined?{itemId:input.itemId}:{}),cueIndex:input.cueIndex,answer:input.answer,expected:cue.text,strict:input.strict===true,...result,at:Date.now()};
 journal.document.attempts.push(attempt);const saved=await saveJournal(env,user,LISTENING_KEY,input.version,journal.document);
 return saved.conflict?saved:{...saved,attempt};
}

// Save the stored cue, not client-provided translations or fabricated dictionary data.
export async function saveListeningCue(env,user,input){
 if(!input||typeof input.recordId!=='string'||!Number.isSafeInteger(input.cueIndex)||input.cueIndex<0||typeof input.cueRevision!=='string')throw coreError(400,'CAPTION_INPUT','Chọn câu phụ đề hợp lệ.');
 const source=(await query(env,"SELECT data FROM ee_records WHERE id=? AND kind='listening' AND (owner=? OR public=1)",[input.recordId,user.id])).rows[0];if(!source)throw coreError(404,'LISTENING_NOT_FOUND','Không tìm thấy bài nghe.');
 let raw;try{raw=JSON.parse(source.data);}catch{throw coreError(409,'LISTENING_INVALID','Dữ liệu bài nghe chưa đọc được.');}
 const item=input.itemId===undefined?raw:raw.items?.find(i=>i.id===input.itemId),cue=item?.cues?.[input.cueIndex];
 if(!cue||typeof cue.text!=='string'||!cue.text.trim()||cue.text.length>5000||await digest(JSON.stringify(cue))!==input.cueRevision)throw coreError(409,'CAPTION_CHANGED','Phụ đề đã thay đổi; chưa lưu nhầm câu.');
 const deckId='saved-listening-'+await digest(user.id),sourceId='cue-'+await digest(JSON.stringify([input.recordId,input.itemId??null,input.cueIndex,cue]));
 const empty={id:deckId,name:'Câu đã lưu từ bài nghe',words:[]};
 await query(env,"INSERT INTO ee_records(id,owner,kind,title,level,public,data,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",[deckId,user.id,'vocab',empty.name,item.level||'',0,JSON.stringify(empty),new Date().toISOString()]);
 const row=(await query(env,"SELECT data FROM ee_records WHERE id=? AND owner=? AND kind='vocab' AND public=0",[deckId,user.id])).rows[0];if(!row)throw coreError(409,'DECK_INVALID','Bộ câu đã lưu không hợp lệ.');let deck;try{deck=JSON.parse(row.data);}catch{throw coreError(409,'DECK_INVALID','Bộ câu đã lưu chưa đọc được.');}if(!Array.isArray(deck.words))throw coreError(409,'DECK_INVALID','Bộ câu đã lưu thiếu words.');
 if(deck.words.some(w=>w.id===sourceId))return {userId:user.id,recordId:deckId,sourceId,skipped:true};
 deck.words.push({id:sourceId,de:cue.text,vi:typeof cue.vi==='string'?cue.vi:'',level:item.level||'',type:'phrase',source:{recordId:input.recordId,itemId:input.itemId??null,cueIndex:input.cueIndex,cueRevision:input.cueRevision}});
 const value=JSON.stringify(deck);if(new TextEncoder().encode(value).byteLength>1500000)throw coreError(413,'DECK_LIMIT','Bộ câu đã đầy; chưa xóa câu cũ.');
 const written=await query(env,"UPDATE ee_records SET data=?,updated_at=? WHERE id=? AND owner=? AND data=? RETURNING id",[value,new Date().toISOString(),deckId,user.id,row.data]);if(!written.rows.length)throw coreError(409,'DECK_CONFLICT','Bộ câu đã thay đổi; hãy thử lưu lại.');return {userId:user.id,recordId:deckId,sourceId,skipped:false};
}
