import {digest} from './passwords.js';
import {validateGrammarCollection} from './grammar-content.js';
import {validateImport} from './importer-validation.js';
// Strict review projections. Never call legacy parsers that insert sample tasks.
export async function reviewedGrammar(text,exerciseText,{title,level}) {
 let raw=null;if(/^\s*[\[{]/.test(text)){try{raw=JSON.parse(text);}catch{throw Error('JSON ngữ pháp không hợp lệ.');}}
 let collection;
 if(raw?.items){collection=raw;if(collection.items.length!==1)throw Error('Màn xem trước hiện tại nhận một bài học mỗi lần; hãy tách bộ để kiểm tra đủ nội dung.');}
 else {
  const source=raw||{};let exercises=source.exercises;
  if(exercises===undefined){try{exercises=exerciseText.trim()?JSON.parse(exerciseText):[];}catch{throw Error('JSON bài tập không hợp lệ.');}}
  if(!Array.isArray(exercises))throw Error('Bài tập phải là một mảng JSON.');
  const content=source.content??source.rule??text;
  const fingerprint=await digest(JSON.stringify([content,exercises]));
  collection={id:source.collectionId||'grammar-'+fingerprint,name:title,items:[{...source,id:source.id||'lesson-'+fingerprint,title:source.title||title,level:source.level||level,content,exercises}]};
 }
 validateGrammarCollection(collection);const l=collection.items[0];
 return {rule:l.content,exercises:l.exercises,issues:[],_collection:collection};
}
export function reviewedExams(text){
 let raw;try{raw=JSON.parse(text);}catch{throw Error('Core nhận JSON đề có cấu trúc nguồn và đáp án đã kiểm tra. PDF/ảnh cần OCR và cấu trúc lại trước; không tự gán đề mẫu.');}
 const list=Array.isArray(raw)?raw:[raw];
 return list.map(collection=>{validateImport('exam',collection);for(const t of collection.items){if(['reading','listening'].includes(t.skill)&&(!Array.isArray(t.questions)||!t.questions.length||t.questions.some(q=>typeof q.id!=='string'||!q.id||typeof q.prompt!=='string'||!q.prompt.trim()||!Array.isArray(q.options)||q.options.length<2||new Set(q.options).size!==q.options.length||!q.options.every(x=>typeof x==='string')||typeof q.answer!=='string'||!q.options.includes(q.answer)||q.answerSource!=='document')))throw Error('Đề trắc nghiệm cần câu hỏi, lựa chọn và đáp án nguồn document; chưa tự tạo đáp án.');if(['writing','speaking'].includes(t.skill)&&(typeof t.content!=='string'||!t.content.trim()))throw Error('Đề viết/nói thiếu đề bài nguồn.');}
 return {id:collection.id,title:collection.name,level:collection.items[0].level,provider:collection.items[0].exam,reading:collection.items.filter(t=>t.skill==='reading'),listening:collection.items.filter(t=>t.skill==='listening'),writingTasks:collection.items.filter(t=>t.skill==='writing').map(t=>({...t,prompt:t.content})),speakingTasks:collection.items.filter(t=>t.skill==='speaking').map(t=>({...t,prompt:t.content})),_collection:collection};});
}
