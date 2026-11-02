import {coreError,query} from './database.js';
import {encryptSecret,decryptSecret} from './secret-box.js';
import {PROVIDERS,validModelId,discoverModels,providerGenerate} from './ai-providers.js';
import {makeContinuation,verifyContinuation} from './ai-continuation.js';
import {digest} from './passwords.js';
const PREFIX='sprach:ai:';
function admin(user){if(!['admin','super_admin'].includes(user.role))throw coreError(403,'ADMIN_REQUIRED','Chỉ Admin được quản lý khóa AI.');}
function metadata(row){return {id:row.id,label:row.label,provider:row.provider,model:row.model,enabled:row.enabled,priority:row.priority,freeOnly:row.freeOnly};}
async function configs(env){
  const rows=(await query(env,"SELECT key,value FROM ee_config WHERE key GLOB 'sprach:ai:*' ORDER BY key")).rows;
  return rows.map(row=>{let value;try{value=JSON.parse(row.value);}catch{return null;}return value&&value.id===row.key.slice(PREFIX.length)&&PROVIDERS.includes(value.provider)&&validModelId(value.model)&&typeof value.secret==='string'?value:null;}).filter(Boolean);
}
export async function listAIConfigs(env,user){admin(user);return {items:(await configs(env)).map(metadata)};}
export async function discoverForAdmin(env,user,data){
  admin(user);if(!data||Object.keys(data).some(k=>!['provider','key','freeOnly'].includes(k))||!PROVIDERS.includes(data.provider)||typeof data.key!=='string'||!data.key.trim()||data.key.length>2000||(data.freeOnly!==undefined&&typeof data.freeOnly!=='boolean'))throw coreError(400,'AI_CONFIG_INPUT','Provider hoặc khóa không hợp lệ.');
  return discoverModels(data.provider,data.key.trim(),{freeOnly:data.freeOnly??data.provider==='openrouter'});
}
export async function addAIConfig(env,user,data){
  admin(user);
  if(!data||Object.keys(data).some(k=>!['provider','key','model','label','priority','freeOnly'].includes(k))||!PROVIDERS.includes(data.provider)||
      typeof data.key!=='string'||!data.key.trim()||data.key.length>2000||!validModelId(data.model)||
      (data.priority!==undefined&&(!Number.isSafeInteger(data.priority)||data.priority<0||data.priority>1000))||
      (data.freeOnly!==undefined&&typeof data.freeOnly!=='boolean'))throw coreError(400,'AI_CONFIG_INPUT','Cấu hình AI không hợp lệ.');
  // Require encryption before sending the submitted key to its selected provider.
  const secret=await encryptSecret(env,data.key.trim()),freeOnly=data.freeOnly??data.provider==='openrouter';
  const catalog=await discoverModels(data.provider,data.key.trim(),{freeOnly});
  if(!catalog.items.some(m=>m.id===data.model))throw coreError(400,'AI_MODEL_NOT_AVAILABLE','Model không có trong danh mục khả dụng của provider.');
  const row={id:crypto.randomUUID(),label:String(data.label||data.provider).slice(0,100),provider:data.provider,model:data.model,secret,enabled:true,priority:data.priority??100,freeOnly};
  await query(env,'INSERT INTO ee_config(key,value) VALUES(?,?)',[PREFIX+row.id,JSON.stringify(row)]);
  return {config:metadata(row)};
}
export async function modelsForConfig(env,user,id){admin(user);const row=(await configs(env)).find(x=>x.id===id);if(!row)throw coreError(404,'AI_CONFIG_NOT_FOUND','Không tìm thấy cấu hình AI.');return discoverModels(row.provider,await decryptSecret(env,row.secret),{freeOnly:row.freeOnly});}
export async function updateAIConfig(env,user,data){
  admin(user);if(!data||typeof data.id!=='string'||Object.keys(data).some(k=>!['id','model','enabled','priority'].includes(k))||
    (data.enabled!==undefined&&typeof data.enabled!=='boolean')||(data.priority!==undefined&&(!Number.isSafeInteger(data.priority)||data.priority<0||data.priority>1000))||
    (data.model!==undefined&&!validModelId(data.model)))throw coreError(400,'AI_CONFIG_INPUT','Cấu hình AI không hợp lệ.');
  const row=(await configs(env)).find(x=>x.id===data.id);if(!row)throw coreError(404,'AI_CONFIG_NOT_FOUND','Không tìm thấy cấu hình AI.');
  if(data.model!==undefined){const catalog=await discoverModels(row.provider,await decryptSecret(env,row.secret),{freeOnly:row.freeOnly});if(!catalog.items.some(x=>x.id===data.model))throw coreError(400,'AI_MODEL_NOT_AVAILABLE','Model không còn khả dụng.');}
  const previous=JSON.stringify(row),next={...row,...data};
  const result=await query(env,'UPDATE ee_config SET value=? WHERE key=? AND value=? RETURNING key',[JSON.stringify(next),PREFIX+row.id,previous]);
  if(!result.rows.length)throw coreError(409,'AI_CONFIG_CHANGED','Cấu hình đã thay đổi; chưa ghi đè.');return {config:metadata(next)};
}
export function validateAIInput(input){
  if(!input||typeof input.systemPrompt!=='string'||typeof input.userPrompt!=='string'||!input.userPrompt.trim()||
    input.systemPrompt.length+input.userPrompt.length>90000||input.attachments!==undefined&&!Array.isArray(input.attachments))throw coreError(400,'AI_INPUT','Nội dung AI không hợp lệ.');
  const attachments=input.attachments||[];if(attachments.length>20)throw coreError(413,'AI_ATTACHMENTS','Quá nhiều trang trong một lần xử lý.');
  let bytes=0;for(const item of attachments){if(!item||!['image/png','image/jpeg','image/webp','application/pdf'].includes(item.mimeType)||typeof item.data!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(item.data))throw coreError(400,'AI_ATTACHMENTS','Dữ liệu tài liệu không hợp lệ.');bytes+=item.data.length;}
  if(bytes>14000000)throw coreError(413,'AI_ATTACHMENTS','Tài liệu vượt giới hạn một lần xử lý.');return input;
}
export async function generateAI(env,user,input,{validate}={}){
  validateAIInput(input);const continuation=input.continuation?await verifyContinuation(env,user,input):null;
  let rows=(await configs(env)).filter(x=>x.enabled).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
  if(continuation){rows=rows.filter(row=>row.id===continuation.config);if(!rows.length||await digest(rows[0].model+'|'+rows[0].secret)!==continuation.fingerprint)throw coreError(409,'AI_CONFIG_CHANGED','Cấu hình AI đã đổi; nội dung cũ vẫn được giữ.');}
  if(!rows.length)throw coreError(503,'AI_NOT_CONFIGURED','Admin chưa cấu hình provider AI phía server.');
  // One request per eligible key: no unbounded retry loop or fabricated local grading.
  const deadlineAt=Date.now()+120000;
  for(const row of rows.slice(0,10)){
    if(Date.now()>=deadlineAt)break;
    try{
      const key=await decryptSecret(env,row.secret),catalog=await discoverModels(row.provider,key,{freeOnly:row.freeOnly,deadlineAt});
      const model=catalog.items.find(m=>m.id===row.model);if(!model)continue;
      const result=await providerGenerate(row.provider,key,model,{...input,freeOnly:row.freeOnly,deadlineAt});
      if(continuation)result.text=input.continuation.text+result.text;
      if(result.truncated)return {...result,configId:row.id,continuation:await makeContinuation(env,user,row,input,result.text)};
      let value=result.text;
      if(input.jsonMode!==false){try{value=JSON.parse(result.text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{continue;}}
      if(validate)value=validate(value);
      return {...result,value,configId:row.id};
    }catch{/* Provider failures, invalid model outputs and secrets never leak in API responses. */}
  }
  throw coreError(503,'AI_UNAVAILABLE','Các provider đang lỗi, hết quota hoặc trả dữ liệu chưa hợp lệ. Chưa tạo điểm/chữa bài giả.');
}
