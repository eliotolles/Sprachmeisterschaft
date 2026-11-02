import {readAICooldowns,modelCooldown,coolAIModel} from './ai-cooldowns.js';
import {readAIRouting,AI_PURPOSES} from './ai-routing.js';
import {coreError,query} from './database.js';
import {encryptSecret,decryptSecret} from './secret-box.js';
import {PROVIDERS,validModelId,discoverModels,providerGenerate,providerSpeech,providerTranscribe} from './ai-providers.js';
import {makeContinuation,verifyContinuation} from './ai-continuation.js';
import {digest} from './passwords.js';
const PREFIX='sprach:ai:';
function admin(user){if(!['admin','super_admin'].includes(user.role))throw coreError(403,'ADMIN_REQUIRED','Chỉ Admin được quản lý khóa AI.');}
function metadata(row){return {id:row.id,label:row.label,provider:row.provider,model:row.model,task:row.task||'text',enabled:row.enabled,priority:row.priority,freeOnly:row.freeOnly,hasVision:!!row.hasVision||row.task==='vision',backupModel:row.backupModel||null,archived:!!row.archived};}
async function configs(env){
  const rows=(await query(env,"SELECT key,value FROM ee_config WHERE key GLOB 'sprach:ai:*' ORDER BY key")).rows;
  return rows.map(row=>{let value;try{value=JSON.parse(row.value);}catch{return null;}return value&&value.id===row.key.slice(PREFIX.length)&&PROVIDERS.includes(value.provider)&&validModelId(value.model)&&typeof value.secret==='string'?value:null;}).filter(Boolean);
}
export async function listAIConfigs(env,user){admin(user);const rows=await configs(env),cooldowns=await readAICooldowns(env,rows);return {items:rows.map(r=>({...metadata(r),cooldown:modelCooldown(cooldowns,r.id,r.model)}))};}
export async function discoverForAdmin(env,user,data){
  admin(user);if(!data||Object.keys(data).some(k=>!['provider','key','freeOnly'].includes(k))||!PROVIDERS.includes(data.provider)||typeof data.key!=='string'||!data.key.trim()||data.key.length>2000||(data.freeOnly!==undefined&&typeof data.freeOnly!=='boolean'))throw coreError(400,'AI_CONFIG_INPUT','Provider hoặc khóa không hợp lệ.');
  return discoverModels(data.provider,data.key.trim(),{freeOnly:data.freeOnly??data.provider==='openrouter'});
}
export async function addAIConfig(env,user,data){
  admin(user);
  if(!data||Object.keys(data).some(k=>!['provider','key','model','label','priority','freeOnly','task','hasVision','backupModel'].includes(k))||!PROVIDERS.includes(data.provider)||
      typeof data.key!=='string'||!data.key.trim()||data.key.length>2000||!validModelId(data.model)||
      (data.priority!==undefined&&(!Number.isSafeInteger(data.priority)||data.priority<0||data.priority>1000))||
      (data.freeOnly!==undefined&&typeof data.freeOnly!=='boolean')||(data.hasVision!==undefined&&typeof data.hasVision!=='boolean')||(data.backupModel!==undefined&&data.backupModel!==null&&!validModelId(data.backupModel))||(data.task!==undefined&&!['text','vision','speech','transcription'].includes(data.task))||
      data.task==='speech'&&data.provider!=='gemini'||data.task==='transcription'&&data.provider==='openrouter')throw coreError(400,'AI_CONFIG_INPUT','Cấu hình AI không hợp lệ.');
  // Require encryption before sending the submitted key to its selected provider.
  const secret=await encryptSecret(env,data.key.trim()),freeOnly=data.freeOnly??data.provider==='openrouter';
  const policy=(await readAIRouting(env)).policies;const catalog=await discoverModels(data.provider,data.key.trim(),{freeOnly:freeOnly||policy.FREE_ONLY||!policy.ALLOW_PAID_MODELS});
  if(!catalog.items.some(m=>m.id===data.model)||data.backupModel&&!catalog.items.some(m=>m.id===data.backupModel))throw coreError(400,'AI_MODEL_NOT_AVAILABLE','Model không có trong danh mục khả dụng của provider.');
  const row={id:crypto.randomUUID(),label:String(data.label||data.provider).slice(0,100),provider:data.provider,model:data.model,backupModel:data.backupModel||null,hasVision:data.hasVision??data.task==='vision',task:data.task||'text',secret,enabled:true,priority:data.priority??100,freeOnly};
  await query(env,'INSERT INTO ee_config(key,value) VALUES(?,?)',[PREFIX+row.id,JSON.stringify(row)]);
  return {config:metadata(row)};
}
export async function modelsForConfig(env,user,id){admin(user);const row=(await configs(env)).find(x=>x.id===id);if(!row)throw coreError(404,'AI_CONFIG_NOT_FOUND','Không tìm thấy cấu hình AI.');return discoverModels(row.provider,await decryptSecret(env,row.secret),{freeOnly:false});}
export async function updateAIConfig(env,user,data){
  admin(user);if(!data||typeof data.id!=='string'||Object.keys(data).some(k=>!['id','model','enabled','priority','backupModel','hasVision','archived','freeOnly'].includes(k))||
    (data.enabled!==undefined&&typeof data.enabled!=='boolean')||(data.priority!==undefined&&(!Number.isSafeInteger(data.priority)||data.priority<0||data.priority>1000))||
    (data.model!==undefined&&!validModelId(data.model))||(data.backupModel!==undefined&&data.backupModel!==null&&!validModelId(data.backupModel))||(data.hasVision!==undefined&&typeof data.hasVision!=='boolean')||(data.archived!==undefined&&typeof data.archived!=='boolean')||(data.freeOnly!==undefined&&typeof data.freeOnly!=='boolean')||(data.archived===true&&data.enabled===true))throw coreError(400,'AI_CONFIG_INPUT','Cấu hình AI không hợp lệ.');
  const row=(await configs(env)).find(x=>x.id===data.id);if(!row)throw coreError(404,'AI_CONFIG_NOT_FOUND','Không tìm thấy cấu hình AI.');
  if(data.model!==undefined||data.backupModel){const policy=(await readAIRouting(env)).policies;const catalog=await discoverModels(row.provider,await decryptSecret(env,row.secret),{freeOnly:(data.freeOnly??row.freeOnly)||policy.FREE_ONLY||!policy.ALLOW_PAID_MODELS});if(data.model!==undefined&&!catalog.items.some(x=>x.id===data.model)||data.backupModel&&!catalog.items.some(x=>x.id===data.backupModel))throw coreError(400,'AI_MODEL_NOT_AVAILABLE','Model không còn khả dụng.');}
  const previous=JSON.stringify(row),next={...row,...data,...(data.archived===true?{enabled:false}:{})};
  const result=await query(env,'UPDATE ee_config SET value=? WHERE key=? AND value=? RETURNING key',[JSON.stringify(next),PREFIX+row.id,previous]);
  if(!result.rows.length)throw coreError(409,'AI_CONFIG_CHANGED','Cấu hình đã thay đổi; chưa ghi đè.');return {config:metadata(next)};
}
export function validateAIInput(input){
  if(!input||typeof input.systemPrompt!=='string'||typeof input.userPrompt!=='string'||!input.userPrompt.trim()||
    input.systemPrompt.length+input.userPrompt.length>90000||input.attachments!==undefined&&!Array.isArray(input.attachments)||input.task!==undefined&&!['text','vision','transcription'].includes(input.task)||input.purpose!==undefined&&!AI_PURPOSES.includes(input.purpose))throw coreError(400,'AI_INPUT','Nội dung AI không hợp lệ.');
  const attachments=input.attachments||[];if(attachments.length>20)throw coreError(413,'AI_ATTACHMENTS','Quá nhiều trang trong một lần xử lý.');
  let bytes=0;for(const item of attachments){if(!item||!['image/png','image/jpeg','image/webp','application/pdf','audio/webm','audio/wav','audio/mpeg','audio/ogg','audio/mp4'].includes(item.mimeType)||typeof item.data!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(item.data))throw coreError(400,'AI_ATTACHMENTS','Dữ liệu tài liệu không hợp lệ.');bytes+=item.data.length;}
  if(bytes>14000000)throw coreError(413,'AI_ATTACHMENTS','Tài liệu vượt giới hạn một lần xử lý.');return input;
}
export async function generateAI(env,user,input,{validate}={}){
  validateAIInput(input);const continuation=input.continuation?await verifyContinuation(env,user,input):null;
  const routing=await readAIRouting(env),rule=routing.rules[input.purpose],requested=input.task||'text';let rows=(await configs(env)).filter(x=>x.enabled&&!x.archived&&((x.task||'text')===requested||requested==='vision'&&(x.task||'text')==='text'&&x.hasVision||requested==='transcription'&&input.purpose==='audio_subtitles'&&!!rule?.pool?.length&&(x.task||'text')==='text')).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
  if(rule?.pool?.length){rows=rows.filter(r=>rule.pool.includes(r.id)).sort((a,b)=>rule.pool.indexOf(a.id)-rule.pool.indexOf(b.id));}
  else if(rule?.assignment){rows=rows.filter(r=>r.id===rule.assignment.configId).map(r=>({...r,model:rule.assignment.model}));}
  let continuationModel=null;
  if(continuation){rows=rows.filter(row=>row.id===continuation.config);if(rows.length)for(const id of [rows[0].model,rows[0].backupModel].filter(Boolean))if(await digest(id+'|'+rows[0].secret)===continuation.fingerprint)continuationModel=id;if(!continuationModel)throw coreError(409,'AI_CONFIG_CHANGED','Cấu hình AI đã đổi; nội dung cũ vẫn được giữ.');}
  if(!rows.length)throw coreError(503,'AI_NOT_CONFIGURED','Admin chưa cấu hình provider AI phía server.');
  const deadlineAt=Date.now()+120000,cooldowns=await readAICooldowns(env,rows.slice(0,10));let attempted=false;
  for(const row of rows.slice(0,10)){
    if(Date.now()>=deadlineAt)break;
    if([row.model,row.backupModel].filter(Boolean).every(m=>modelCooldown(cooldowns,row.id,m)))continue;
    const effectiveFreeOnly=row.freeOnly||routing.policies.FREE_ONLY||!routing.policies.ALLOW_PAID_MODELS;let key,catalog;try{key=await decryptSecret(env,row.secret);catalog=await discoverModels(row.provider,key,{freeOnly:effectiveFreeOnly,deadlineAt});}catch{continue;}
    for(const id of [...new Set((continuation?[continuationModel]:[row.model,row.backupModel]).filter(Boolean))]){
      if(Date.now()>=deadlineAt)break;
      try{
        const model=catalog.items.find(m=>m.id===id);if(!model||modelCooldown(cooldowns,row.id,id)||(attempted||id!==row.model||row.id!==rows[0].id)&&model.free===false&&!routing.policies.AUTO_PAID_FALLBACK)continue;attempted=true;
        const result=await (requested==='transcription'?providerTranscribe:providerGenerate)(row.provider,key,model,{...input,freeOnly:effectiveFreeOnly,deadlineAt});
        if(continuation)result.text=input.continuation.text+result.text;
        if(result.truncated)return {...result,configId:row.id,continuation:await makeContinuation(env,user,{...row,model:id},input,result.text)};
        let value=result.text;if(input.jsonMode!==false){try{value=JSON.parse(result.text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{continue;}}
        if(validate)value=validate(value);return {...result,value,configId:row.id};
      }catch(error){try{await coolAIModel(env,row.id,id,error);}catch{/* Do not replace the real provider failure with a cooldown-storage error. */}}
    }
  }
  throw coreError(503,'AI_UNAVAILABLE','Các provider đang lỗi, hết quota hoặc trả dữ liệu chưa hợp lệ. Chưa tạo điểm/chữa bài giả.');
}
export async function generateGermanSpeech(env,user,input){
 if(!input||typeof input.text!=='string'||!input.text.trim()||input.text.length>1800||(input.voice!==undefined&&(typeof input.voice!=='string'||!/^[A-Za-z][A-Za-z0-9-]{0,60}$/.test(input.voice))))throw coreError(400,'TTS_INPUT','Nội dung giọng đọc không hợp lệ.');
 const rows=(await configs(env)).filter(x=>x.enabled&&!x.archived&&x.task==='speech').sort((a,b)=>a.priority-b.priority);
 if(!rows.length)throw coreError(503,'TTS_NOT_CONFIGURED','Admin chưa cấu hình model giọng nói tiếng Đức.');
 const deadlineAt=Date.now()+120000;
 for(const row of rows.slice(0,5)){if(Date.now()>=deadlineAt)break;try{const key=await decryptSecret(env,row.secret),catalog=await discoverModels(row.provider,key,{freeOnly:row.freeOnly,deadlineAt});for(const id of [...new Set([row.model,row.backupModel].filter(Boolean))]){if(Date.now()>=deadlineAt)break;const model=catalog.items.find(x=>x.id===id);if(model)try{return await providerSpeech(row.provider,key,model,{...input,deadlineAt});}catch{}}}catch{}}
 throw coreError(503,'TTS_UNAVAILABLE','Chưa tạo được âm thanh tiếng Đức hoàn chỉnh.');
}
export async function testAIConfig(env,user,data){
 admin(user);
 if(!data||Object.keys(data).some(k=>!['id','provider','key','model','vision'].includes(k))||data.vision!==undefined&&typeof data.vision!=='boolean')throw coreError(400,'AI_TEST_INPUT','Yêu cầu kiểm tra AI không hợp lệ.');
 let row,key;if(data.id){row=(await configs(env)).find(x=>x.id===data.id);if(!row)throw coreError(404,'AI_CONFIG_NOT_FOUND','Không tìm thấy cấu hình AI.');key=await decryptSecret(env,row.secret);}
 else{if(!PROVIDERS.includes(data.provider)||typeof data.key!=='string'||!data.key.trim()||data.key.length>2000||!validModelId(data.model))throw coreError(400,'AI_TEST_INPUT','Provider, key hoặc model chưa hợp lệ.');row={provider:data.provider,model:data.model,freeOnly:data.provider==='openrouter'};key=data.key.trim();}
 try{
  const policy=(await readAIRouting(env)).policies,deadlineAt=Date.now()+30000,catalog=await discoverModels(row.provider,key,{freeOnly:row.freeOnly||policy.FREE_ONLY||!policy.ALLOW_PAID_MODELS,deadlineAt}),model=catalog.items.find(m=>m.id===row.model);if(!model)throw Error();
  const result=await providerGenerate(row.provider,key,model,{systemPrompt:'Connection test only. Return exactly JSON {"ok":true}. Do not claim a learning assessment.',userPrompt:'Confirm JSON generation.',jsonMode:true,freeOnly:row.freeOnly||policy.FREE_ONLY||!policy.ALLOW_PAID_MODELS,deadlineAt,attachments:data.vision?[{mimeType:'image/png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='}]:[]});
  if(result.truncated||JSON.parse(result.text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''))?.ok!==true)throw Error();
  return {success:true,testedScope:data.vision?'json-generation-with-image':'json-generation',message:'Provider trả JSON kiểm tra hợp lệ'+(data.vision?' và nhận ảnh thử':'')+'. Chưa đánh giá chất lượng chấm bài/phụ đề.'};
 }catch{throw coreError(503,'AI_TEST_UNAVAILABLE','Chưa kiểm tra được khả năng sinh JSON của model. Không có kết quả giả lập.');}
}
