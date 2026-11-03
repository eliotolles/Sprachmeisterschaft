
export const PROGRESS_KEYS=['sprach_vocabulary_reviews','sprach_grammar_attempts','sprach_writing_results','sprach_speaking_results','sprach_listening_results','sprach_core_focus_sessions','sprach_notes','history','grammarAttempts'];
const invalid=()=>Object.assign(Error('Một phần lịch sử học chưa hợp lệ; chưa dùng dữ liệu cục bộ thay thế.'),{code:'PROGRESS_INVALID'});
function rows(records,key,field){if(!Object.hasOwn(records,key))return [];const value=records[key]?.value;if(!value||typeof value!=='object'||!Array.isArray(value[field]))throw invalid();return value[field];}
const day=time=>{if(!Number.isSafeInteger(time)||time<=0)return null;const d=new Date(time);if(!Number.isFinite(d.getTime()))return null;return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const practiceScore=feedback=>{if(!Number.isFinite(feedback?.total)||feedback.total<0||feedback.total>20)throw invalid();return feedback.total*5;};
export function projectProgress(records,attempts){
 if(!records||typeof records!=='object'||!Array.isArray(attempts))throw invalid();
 const logs=new Map(),sessions=[],exams=[];
 function activity(time,review=false,minutes=0){const date=day(time);if(!date)return;const log=logs.get(date)||{date,cards_reviewed:0,new_words:0,xp:0,minutes:0,activity_count:0};log.activity_count++;if(review)log.cards_reviewed++;log.minutes+=minutes;logs.set(date,log);}
 function session(skill,id,score,time){if(!Number.isFinite(score)||score<0||score>100)throw invalid();sessions.push({id,skill,score,title:skill,date:day(time)||'',created_at:day(time)?new Date(time).toISOString():'',duration_seconds:0});activity(time);}
 for(const r of rows(records,PROGRESS_KEYS[0],'history'))activity(r.time,true);
 rows(records,PROGRESS_KEYS[1],'attempts').forEach((r,i)=>{if(typeof r.correct!=='boolean')throw invalid();session('grammar',r.exerciseId||'grammar-'+i,r.correct?100:0,r.time);});
 for(const r of rows(records,PROGRESS_KEYS[2],'results'))session('writing',r.id,practiceScore(r.feedback),r.time);
 for(const r of rows(records,PROGRESS_KEYS[3],'sessions'))if(r.feedback)session('interview',r.id,practiceScore(r.feedback),r.feedbackAt||r.lastActivityAt||r.time);
 for(const r of rows(records,PROGRESS_KEYS[4],'attempts'))session('listening',r.id,r.score,r.at);
 for(const r of rows(records,PROGRESS_KEYS[5],'sessions'))if(r.status==='completed'&&r.phase==='focus'){if(!Number.isFinite(r.durationMs)||r.durationMs<60000||r.durationMs>5400000||!day(r.completedAt))throw invalid();activity(r.completedAt,false,r.durationMs/60000);}
 for(const a of attempts)if(a.status==='submitted'){if(!Number.isFinite(a.percent)||a.percent<0||a.percent>100)throw invalid();exams.push({id:a.id,exam_id:encodeURIComponent(a.recordId),total:a.percent,passed:false,officialScore:false,created_at:day(a.submittedAt)?new Date(a.submittedAt).toISOString():''});activity(a.submittedAt);}
 let notes=[];if(Object.hasOwn(records,PROGRESS_KEYS[6])){const value=records[PROGRESS_KEYS[6]]?.value;notes=Array.isArray(value)?value:value?.notes;if(!Array.isArray(notes)||notes.some(n=>!n||typeof n.id!=='string'))throw invalid();notes=notes.map(n=>({id:n.id}));}
 // Old history is a read-only source. It never rewrites modern journals or invents XP/minutes.
 const oldHistory=records.history?.value,oldGrammar=records.grammarAttempts?.value;
 if(Array.isArray(oldHistory))for(const h of oldHistory){if(!h||typeof h.date!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(h.date)||!Number.isFinite(Date.parse(h.date))||!Number.isSafeInteger(h.total)||h.total<1||!Number.isSafeInteger(h.score)||h.score<0||h.score>h.total)continue;const datePart=h.date.slice(0,10);if(new Date(datePart+'T00:00:00Z').toISOString().slice(0,10)!==datePart)continue;const date=h.date.includes('T')?day(Date.parse(h.date)):datePart;if(!date)continue;const log=logs.get(date)||{date,cards_reviewed:0,new_words:0,xp:0,minutes:0,activity_count:0};log.activity_count++;logs.set(date,log);}
 if(Array.isArray(oldGrammar))for(const [index,a] of oldGrammar.entries()){if(!a||typeof a.correct!=='boolean'||!day(a.time)||typeof a.lessonId!=='string')continue;if(rows(records,PROGRESS_KEYS[1],'attempts').some(r=>r.lessonId===a.lessonId&&r.answer===a.answer&&r.time===a.time&&r.correct===a.correct))continue;session('grammar','legacy-grammar-'+index,a.correct?100:0,a.time);sessions[sessions.length-1].source='legacy-history';}
 sessions.sort((a,b)=>(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0));exams.sort((a,b)=>(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0));
 return {logs:[...logs.values()].sort((a,b)=>b.date.localeCompare(a.date)),sessions,exams,notes};
}
export function progressStreak(logs,today){const active=new Set(logs.filter(l=>l.activity_count>0||l.cards_reviewed>0||l.minutes>0).map(l=>l.date));const previous=date=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-1);return day(d.getTime());};let date=active.has(today)?today:previous(today),count=0;while(date&&active.has(date)){count++;date=previous(date);}return count;}
export function createProgressBinding({client,isActive}){
 let generation=0;const reset=()=>generation++;
 return {isActive,reset,async load(){if(!isActive()||!client.getUser())throw Error('Chưa đăng nhập để đọc tiến độ.');const scope={id:client.getUser().id,generation:++generation};const [records,history]=await Promise.all([client.stateSnapshot(PROGRESS_KEYS),client.examAttempts()]);if(scope.id!==client.getUser()?.id||scope.generation!==generation)throw Object.assign(Error('Tài khoản hoặc lần tải tiến độ đã thay đổi.'),{code:'ACCOUNT_CHANGED'});if(history.userId!==scope.id)throw invalid();return projectProgress(records,history.attempts);}};
}
