import {coreError,query} from './database.js';
import {readJournal,saveJournal} from './journal.js';
export const STUDY_KEY='sprach_core_focus_sessions';
const invalid=()=>coreError(400,'FOCUS_INPUT','Phiên tập trung không hợp lệ.');
export async function focusTimer(env,user,input,now=Date.now()){
 if(!Number.isSafeInteger(input.version)||input.version<0||!['start','pause','resume','finish','cancel'].includes(input.action))throw invalid();
 const r=await readJournal(env,user,STUDY_KEY,input.version,{sessions:[],active:null});if(r.conflict)return r;const d=r.document;if(!Array.isArray(d.sessions))throw coreError(409,'HISTORY_INVALID','Lịch sử tập trung chưa đọc được.');
 if(input.action==='start'){
  if(d.active)throw coreError(409,'FOCUS_ACTIVE','Đã có phiên đang chạy.');
  if(!Number.isInteger(input.minutes)||input.minutes<1||input.minutes>90||!['focus','break'].includes(input.phase)||typeof input.soundEnabled!=='boolean')throw invalid();
  d.active={id:crypto.randomUUID(),phase:input.phase,durationMs:input.minutes*60000,remainingMs:input.minutes*60000,startedAt:now,resumedAt:now,paused:false,soundEnabled:input.soundEnabled};
 }else{
  const a=d.active;if(!a||a.id!==input.sessionId)throw coreError(404,'FOCUS_NOT_FOUND','Không tìm thấy phiên tập trung.');
  const remaining=a.paused?a.remainingMs:Math.max(0,a.remainingMs-(now-a.resumedAt));
  if(input.action==='pause'){if(a.paused)throw invalid();a.remainingMs=remaining;a.paused=true;}
  if(input.action==='resume'){if(!a.paused)throw invalid();a.resumedAt=now;a.paused=false;}
  if(input.action==='finish'){if(remaining>0)throw coreError(409,'FOCUS_NOT_FINISHED','Chưa hết thời gian đã chọn.');d.sessions.push({...a,remainingMs:0,completedAt:now,status:'completed'});d.active=null;}
  if(input.action==='cancel'){d.sessions.push({...a,remainingMs:remaining,completedAt:now,status:'cancelled'});d.active=null;}
 }
 const saved=await saveJournal(env,user,STUDY_KEY,input.version,d);return saved.conflict?saved:{...saved,...d,serverNow:now};
}
// Derived counts describe persisted practice only, not learning quality or certified proficiency.
export async function studyStatistics(env,user){
 const keys=['sprach_vocabulary_reviews','sprach_grammar_attempts','sprach_writing_results','sprach_speaking_results','sprach_listening_results','sprach_core_exam_attempts',STUDY_KEY];
 const rows=(await query(env,'SELECT key,value FROM ee_state WHERE owner=? AND key IN ('+keys.map(()=>'?').join(',')+')',[user.id,...keys])).rows;const docs={};for(const row of rows){try{docs[row.key]=JSON.parse(row.value);}catch{throw coreError(409,'HISTORY_INVALID','Một phần lịch sử chưa đọc được; chưa tổng hợp sai.');}}
 const arr=(key,field)=>Array.isArray(docs[key]?.[field])?docs[key][field]:[];
 const exams=arr('sprach_core_exam_attempts','attempts'),focus=arr(STUDY_KEY,'sessions').filter(s=>s.status==='completed'&&s.phase==='focus');
 return {serverNow:Date.now(),userId:user.id,source:'persisted-core-practice',vocabularyReviews:arr(keys[0],'history').length,grammarAttempts:arr(keys[1],'attempts').length,writingResults:arr(keys[2],'results').length,speakingSessions:arr(keys[3],'sessions').length,listeningAttempts:arr(keys[4],'attempts').length,submittedExams:exams.filter(a=>a.status==='submitted').length,completedFocusSessions:focus.length,focusMinutes:focus.reduce((n,s)=>n+s.durationMs/60000,0)};
}
