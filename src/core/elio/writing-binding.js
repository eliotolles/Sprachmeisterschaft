import {validateFeedback,CRITERIA} from './feedback.js';
const statuses={met:'đạt',partial:'đạt một phần',missing:'thiếu'};
const describe=row=>row?`${row.requirement}: ${statuses[row.status]} — ${row.evidence}${row.suggestion?' · '+row.suggestion:''}`:'Chưa được đánh giá trong phản hồi nguồn.';
const phrases=list=>list.map(x=>`${x.de} — ${x.usage}`).join('\n');
export function mapWritingFeedback(data,text){
 const f=validateFeedback(data,text),criterionKeys=['taskCompletion','coherence','vocabulary','structures'];
 const check=regex=>describe(f.formatReview.find(r=>regex.test(r.requirement)));
 return {generalRemarks:[f.summary,...f.formatReview.map(describe)].join('\n\n'),
  leitpunkte:f.examReview.map(r=>({point:r.requirement,status:statuses[r.status],evidence:[r.evidence,r.suggestion].filter(Boolean).join(' · ')})),
  genreCheck:{genre:check(/genre|text.?type|loại bài|thể loại/i),recipient:check(/recipient|người nhận/i),salutation:check(/salutation|greeting|lời chào/i),closing:check(/closing|kết thư|kết bài/i),formOfAddress:check(/\b(?:du|Sie)\b|address|xưng hô/i),register:check(/register|văn phong/i),wordCount:f.wordCount,wordCountAssessment:check(/length|word.?count|độ dài|số từ/i)},
  criteriaScores:Object.fromEntries(CRITERIA.map((k,i)=>[criterionKeys[i],{score:f.scores[k].score,label:['Aufgabenerfüllung (Đáp ứng đề bài)','Kohärenz (Mạch lạc & Liên kết)','Wortschatz (Vốn từ & Độ chuẩn xác)','Strukturen (Ngữ pháp & Cấu trúc)'][i],evidence:f.scores[k].comment,improvement:f.scores[k].improve}])),totalPracticeScore:f.total,
  sentenceAnalysis:f.sentences.map((s,i)=>({sentenceIndex:i+1,originalSentence:s.original,status:{good:'correct',improve:'minor_flaw',error:'error'}[s.status],praise:s.comment,correction:s.corrected,suggestedRedemittel:phrases(s.alternatives)})),
  errorList:f.errors.map(e=>({sentenceNumber:f.sentences.flatMap((s,i)=>s.original.includes(e.original)?[i+1]:[]).join(', ')||null,quote:e.original,corrected:e.correction,whyWrong:e.reason,rule:e.reason,preventionTip:e.avoid,alternatives:phrases(e.alternatives),isStilImprovement:false})),
  fullRevisedText:f.corrected,modelEssay:f.model,alternativePhrases:f.errors.flatMap(e=>e.alternatives.map(a=>({original:e.original,suggested:a.de,context:a.usage}))),priorityFixes:f.priorities,
  stepByStepGuide:f.writingPlan.map(s=>[s.title,s.explanation,...s.examples].join('\n')).concat(phrases(f.alternatives)).filter(Boolean).join('\n\n'),officialScore:false,coreFeedback:f};
}
export function createWritingBinding({client,isActive}){
 return {isActive,async loadTasks(){
  const user=client.getUser()?.id;if(!isActive()||!user)return[];const tasks=[],ids=new Set();
  for(let offset=0;offset<10000;offset+=200){const rows=await client.records('writing',{limit:200,offset});for(const row of rows){let data;try{data=JSON.parse(row.data);}catch{throw Error('Đề viết chưa đọc được; không dùng bản cục bộ thay thế.');}for(const item of Array.isArray(data.items)?data.items:[data]){const prompt=item.content||item.rawText||item.prompt;if(typeof prompt!=='string'||!prompt.trim())continue;const id=row.id+':'+String(item.id||row.id);if(ids.has(id))throw Error('Đề viết có ID trùng.');ids.add(id);tasks.push({id,title:item.title||item.name||row.title,level:item.level||row.level||'B1',prompt,provider:item.exam||item.provider||'practice',hints:Array.isArray(item.hints)?item.hints:[]});}}if(rows.length<200)break;if(offset===9800)throw Error('Quá nhiều đề viết.');}
  if(client.getUser()?.id!==user)throw Object.assign(new Error('Tài khoản đã thay đổi.'),{code:'ACCOUNT_CHANGED'});return tasks;
 },async grade({task,text,level,examProvider='practice',language='vi'},options){
  const user=client.getUser()?.id;if(!isActive()||!user)throw Error('Chưa đăng nhập core viết.');
  const provider={goethe:'Goethe',telc:'telc','ösd':'ÖSD',ecl:'ECL',practice:'practice'}[String(examProvider).trim().toLowerCase()];if(!provider)throw Error('Cần xác định đúng loại đề; không tự gán chứng chỉ.');
  const r=await client.gradeWriting({task,text,level,examProvider:provider,language},options);if(client.getUser()?.id!==user)throw Object.assign(new Error('Tài khoản đã thay đổi.'),{code:'ACCOUNT_CHANGED'});if(r.result?.text!==text||typeof r.result.id!=='string')throw Error('Bài chữa không khớp bài viết gốc.');return {...mapWritingFeedback(r.result.feedback,text),coreResultId:r.result.id};
 }};
}
