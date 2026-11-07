import {validateGrammarCollection} from './grammar-content.js';
import {reviewedExams} from './reviewed-import.js';
import {digest} from './passwords.js';
import {ListeningV2Core} from './listening-content.js';
export function importVocabularyJSON(text){
 let data;try{data=JSON.parse(text);}catch{throw Error('JSON nguồn không hợp lệ.');}const rows=Array.isArray(data)?data:data.words||data.items;
 if(!Array.isArray(rows))throw Error('JSON cần một mảng từ, words hoặc items.');
 return rows.map((item,index)=>{if(!item||typeof item!=='object')throw Error('Dòng từ vựng không hợp lệ.');if(item.source_id!==undefined&&item.id!==undefined&&item.source_id!==item.id)throw Error('ID và source_id mâu thuẫn; chưa tự chọn ID.');return {...item,_id:'preview-'+index,_sourceId:item.source_id??item.id,german:item.german??item.de??'',vietnamese:item.vietnamese??item.vi??'',_valid:!!String(item.german??item.de??'').trim()&&!!String(item.vietnamese??item.vi??'').trim()};});
}
export function createImportBinding({client,isActive}){
 const capture=()=>{if(!isActive()||!client.getUser())throw Error('Chưa đăng nhập core nhập liệu.');return client.getUser().id;};const check=id=>{if(client.getUser()?.id!==id)throw Error('Tài khoản đã thay đổi; chưa gửi tài liệu của tài khoản trước.');};
 return {isActive,async extractFile(file){const owner=capture();if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error('OCR nhận PDF/PNG/JPEG/WebP tối đa 10 MB.');const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let at=0;at<bytes.length;at+=16000)binary+=String.fromCharCode(...bytes.subarray(at,at+16000));check(owner);const result=await client.extractDocument({filename:file.name,attachments:[{mimeType:file.type,data:btoa(binary)}]});check(owner);if(!result.requiresReview||result.saved!==false||!Array.isArray(result.draft?.pages))throw Error('OCR chưa có bản nháp đầy đủ để kiểm tra.');return {text:result.draft.pages.map(p=>p.text).join('\n\n'),warnings:result.draft.warnings||[]};},
 async transcript(url){const owner=capture();const id=ListeningV2Core.id(url)||(/^[\w-]{11}$/.test(url)?url:null);if(!id)throw Error('Cần link YouTube HTTPS hoặc Video ID hợp lệ.');const result=await client.listeningTranscript('https://www.youtube.com/watch?v='+id);check(owner);if(result.available!==true||result.videoId!==id||!Array.isArray(result.cues))throw Error(result.reason||'Backend chưa lấy được phụ đề thật.');return result.cues.map((c,index)=>({_id:'cue-'+index,start:c.start,end:c.end,de:c.text,vi:''}));},
 async save({contentType,title,level,scope,rows,youtubeUrl,duplicateMode,grammarContent,exams,organizerId=null,rawText='',situationContent}){
  const owner=capture();if(!['private','public'].includes(scope))throw Error('Chọn phạm vi cá nhân hoặc công khai; chưa đổi phạm vi nội bộ.');if(scope==='public'&&!['admin','super_admin'].includes(client.getUser().role))throw Error('Chỉ Admin được nhập bộ chung.');let kind,items,skippedCount=0;
  if(contentType==='vocabulary'){
   if(duplicateMode!=='skip')throw Error('Core chỉ tạo mới và bỏ qua trùng; không ghi đè hoặc điền vào bản ghi cũ.');kind='vocab';items=[];const ids=new Set();
   for(let index=0;index<rows.length;index++){const row=rows[index];if(row._valid===false||row._isDuplicate){skippedCount++;continue;}const de=String(row.german||row.de||'').trim(),vi=String(row.vietnamese||row.vi||'').trim();if(!de||!vi)throw Error('Từ vựng thiếu tiếng Đức hoặc nghĩa Việt.');let id=row._sourceId??row.source_id??row.id;if(id!==undefined&&(typeof id!=='string'||!id.trim()))throw Error('ID nguồn không hợp lệ; chưa tự đổi ID.');if(id===undefined)id='word-'+await digest(JSON.stringify([index,de,vi]));if(ids.has(id))throw Error('ID từ vựng nguồn bị trùng.');ids.add(id);const item=Object.fromEntries(Object.entries(row).filter(([k])=>!k.startsWith('_')));items.push({...item,id,de,vi,level:row.level||level});}
  }else if(contentType==='listening'){
   kind='listening';const id=ListeningV2Core.id(youtubeUrl)||(/^[\w-]{11}$/.test(youtubeUrl)?youtubeUrl:null);if(!id)throw Error('URL YouTube không hợp lệ.');items=[{id,title,level,youtubeId:id,url:'https://www.youtube.com/watch?v='+id,cues:rows.map(r=>({start:r.start,end:r.end,text:r.de||r.text,vi:r.vi||''}))}];
  }else if(contentType==='grammar'){
   const collection=structuredClone(grammarContent?._collection);validateGrammarCollection(collection);check(owner);const result=await client.importCollection('grammar',collection,scope,organizerId);check(owner);if(typeof result.recordId!=='string'||(result.lessonCount??result.count)!==collection.items.length)throw Error('Server chưa xác nhận đủ bài ngữ pháp.');return {savedCount:result.lessonCount??result.count,skippedCount:0,updatedCount:0,recordId:result.recordId};
  }else if(contentType==='exam'){
   if(!Array.isArray(exams)||exams.length!==1)throw Error('Nhập một bộ đề mỗi lần để tránh lưu dở nhiều bộ.');
   const preview=exams[0];if(!preview?._collection)throw Error('Thiếu cấu trúc đề nguồn.');const verified=reviewedExams(JSON.stringify(preview._collection))[0];kind='exam';items=verified._collection.items;
   const collection={...verified._collection,name:preview.title};check(owner);const result=await client.importCollection(kind,collection,scope,organizerId);check(owner);if(typeof result.recordId!=='string'||result.count!==items.length)throw Error('Server chưa xác nhận đủ đề.');return {savedCount:result.count,skippedCount:0,updatedCount:0,recordId:result.recordId};
  }else if(['reading','writing','speaking','situation'].includes(contentType)){
   kind=contentType;
   const content=String(rawText||rows?.[0]?.content||'').trim();
   if(!content)throw Error('Chưa có văn bản gốc để nhập.');
   items=[{id:'document-'+await digest(content),title,level,content,...(situationContent?{situation:situationContent}:{})}];
  }else throw Error('Loại tài liệu chưa được hỗ trợ.');
  if(!items.length)throw Error('Không có bản ghi mới hợp lệ để nhập.');const collection={id:'reviewed-import-'+await digest(JSON.stringify([kind,items])),name:title,items};check(owner);const result=await client.importCollection(kind,collection,scope,organizerId);check(owner);if(typeof result.recordId!=='string'||result.count!==items.length)throw Error('Server chưa xác nhận đầy đủ số bản ghi.');return {savedCount:result.count,skippedCount,updatedCount:0,recordId:result.recordId};
 }};
}
