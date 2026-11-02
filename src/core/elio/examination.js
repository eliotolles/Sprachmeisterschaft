import formats from './data/exam-formats.json' with {type:'json'};
import {coreError,query} from './database.js';
import {readJournal,saveJournal} from './journal.js';
export const EXAM_KEY='sprach_core_exam_attempts';
export const examFormats=()=>({sourceCommit:'bd5179107363ebcc19764454b08d7c94acd1a289',sourceSnapshot:true,formats});
const invalid=()=>coreError(400,'EXAM_INPUT','Dữ liệu đề thi không hợp lệ.');
const clean=s=>String(s).normalize('NFC').trim();
function publicAttempt(a){const {key,...safe}=a;return safe;}
async function journal(env,user,version){if(!Number.isSafeInteger(version)||version<0)throw invalid();const r=await readJournal(env,user,EXAM_KEY,version,{attempts:[]});if(!r.conflict&&!Array.isArray(r.document.attempts))throw coreError(409,'HISTORY_INVALID','Lịch sử thi chưa đọc được.');return r;}
export async function startExam(env,user,input){
 if(typeof input.recordId!=='string'||!Array.isArray(input.itemIds)||!input.itemIds.length||input.itemIds.length>30||new Set(input.itemIds).size!==input.itemIds.length||!Number.isInteger(input.minutes)||input.minutes<1||input.minutes>180)throw invalid();
 const r=await journal(env,user,input.version);if(r.conflict)return r;
 const row=(await query(env,"SELECT data FROM ee_records WHERE id=? AND kind='exam' AND (owner=? OR public=1)",[input.recordId,user.id])).rows[0];if(!row)throw coreError(404,'EXAM_NOT_FOUND','Không tìm thấy đề thi.');
 let data;try{data=JSON.parse(row.data);}catch{throw coreError(409,'EXAM_INVALID','Không đọc được đề thi.');}
 const tasks=[],key=[];
 for(const id of input.itemIds){const matches=data.items?.filter(x=>x.id===id);if(matches?.length!==1)throw invalid();const item=matches[0];
  if(!['reading','listening'].includes(item.skill)||!Array.isArray(item.questions)||!item.questions.length)throw coreError(409,'EXAM_OBJECTIVE_REQUIRED','Chỉ chấm tự động câu đọc/nghe có đáp án nguồn xác minh.');
  const questions=[];
  for(const q of item.questions){if(typeof q.id!=='string'||!q.id||typeof q.prompt!=='string'||!Array.isArray(q.options)||q.options.length<2||!q.options.every(x=>typeof x==='string'&&x.length<5000)||new Set(q.options.map(clean)).size!==q.options.length||typeof q.answer!=='string'||!q.options.includes(q.answer)||q.answerSource!=='document')throw coreError(409,'EXAM_KEY_REQUIRED','Câu hỏi chưa có đáp án nguồn xác minh.');
   const qid=id+':'+q.id;if(key.some(x=>x.id===qid))throw invalid();key.push({id:qid,answer:q.answer,explanation:typeof q.explanation==='string'?q.explanation:null,sourceDocument:q.answerSourceDocument||null,sourcePages:q.answerSourcePages||[]});questions.push({id:qid,prompt:q.prompt,options:q.options});}
  tasks.push({id,title:item.title,content:item.content,skill:item.skill,teil:item.teil,exam:item.exam,level:item.level,questions});
 }
 if(key.length>500)throw invalid();
 const startedAt=Date.now(),attempt={id:crypto.randomUUID(),recordId:input.recordId,mode:'timed-practice',startedAt,deadline:startedAt+input.minutes*60000,minutes:input.minutes,tasks,key,status:'active',answers:{}};
 r.document.attempts.push(attempt);const saved=await saveJournal(env,user,EXAM_KEY,input.version,r.document);return saved.conflict?saved:{...saved,attempt:publicAttempt(attempt)};
}
export async function answerExam(env,user,input,submit=false){
 if(typeof input.attemptId!=='string'||!input.answers||typeof input.answers!=='object'||Array.isArray(input.answers))throw invalid();
 const r=await journal(env,user,input.version);if(r.conflict)return r;const a=r.document.attempts.find(x=>x.id===input.attemptId);if(!a)throw coreError(404,'ATTEMPT_NOT_FOUND','Không tìm thấy bài làm.');
 if(a.status!=='active')throw coreError(409,'EXAM_FINISHED','Bài thi đã nộp.');
 const now=Date.now(),expired=now>=a.deadline;
 if(!expired){for(const [id,value] of Object.entries(input.answers)){const q=a.tasks.flatMap(t=>t.questions).find(q=>q.id===id);if(!q||typeof value!=='string'||!q.options.includes(value))throw invalid();a.answers[id]=value;}}
 if(submit||expired){a.status='submitted';a.submittedAt=now;a.expired=expired;a.results=a.key.map(k=>({...k,actual:a.answers[k.id]??null,correct:a.answers[k.id]===k.answer}));a.correct=a.results.filter(q=>q.correct).length;a.total=a.results.length;a.percent=Math.round(100*a.correct/a.total);a.scoring='equal-weight practice percentage; not an official certificate result';}
 const saved=await saveJournal(env,user,EXAM_KEY,input.version,r.document);return saved.conflict?saved:{...saved,attempt:publicAttempt(a),serverNow:now};
}
export async function readExams(env,user){
 const row=(await query(env,'SELECT value,revision FROM ee_state WHERE owner=? AND key=?',[user.id,EXAM_KEY])).rows[0];let document;
 try{document=row?JSON.parse(row.value):{attempts:[]};if(!Array.isArray(document.attempts))throw Error();}catch{throw coreError(409,'HISTORY_INVALID','Lịch sử thi chưa đọc được.');}
 return {userId:user.id,version:row?.revision??0,attempts:document.attempts.map(publicAttempt),serverNow:Date.now()};
}
// Catalog responses must not disclose keys before an attempt is submitted.
export function examCatalogData(raw){
 let d;try{d=JSON.parse(raw);}catch{throw coreError(409,'EXAM_INVALID','Không đọc được đề thi.');}
 const pick=(x,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(x,k)).map(k=>[k,x[k]]));
 return JSON.stringify({...pick(d,['id','name','type','exam','level','groupName']),items:(d.items||[]).map(t=>({...pick(t,['id','title','exam','level','skill','teil','content','setName','setKey']),questions:(t.questions||[]).map(q=>pick(q,['id','sourceNumber','prompt','options']))}))});
}
