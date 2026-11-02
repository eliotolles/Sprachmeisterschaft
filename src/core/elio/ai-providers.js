import { coreError } from './database.js';
const ROOTS=Object.freeze({gemini:'https://generativelanguage.googleapis.com/v1beta',groq:'https://api.groq.com/openai/v1',openrouter:'https://openrouter.ai/api/v1'});
export const PROVIDERS=Object.freeze(Object.keys(ROOTS));
async function responseJSON(url,options={},deadlineAt=Date.now()+45000){
  let response;
  try{const remaining=Math.min(15000,deadlineAt-Date.now());if(remaining<=0)throw Error('Deadline');response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(remaining)});}
  catch{throw coreError(503,'AI_TRANSPORT','Provider AI chưa phản hồi hoặc hết thời gian chờ.');}
  if(!response.ok)throw coreError([401,403].includes(response.status)?502:response.status===429?429:503,'AI_PROVIDER','Provider AI từ chối yêu cầu hoặc đang bận.');
  const text=await response.text();if(text.length>4000000)throw coreError(502,'AI_RESPONSE_SIZE','Provider trả dữ liệu quá lớn.');
  try{return JSON.parse(text);}catch{throw coreError(502,'AI_RESPONSE_JSON','Provider trả JSON không hợp lệ.');}
}
function auth(provider,key){return provider==='gemini'?{'x-goog-api-key':key}:{Authorization:'Bearer '+key};}
export function validModelId(id){return typeof id==='string'&&id.length>0&&id.length<=200&&/^[A-Za-z0-9._:/-]+$/.test(id);}
function freeRouter(model){const p=model.pricing;return !!p&&['prompt','completion'].every(k=>p[k]!==undefined&&Number.isFinite(Number(p[k]))&&Number(p[k])===0)&&['request','image','web_search','internal_reasoning'].every(k=>p[k]===undefined||Number.isFinite(Number(p[k]))&&Number(p[k])===0);}
export async function discoverModels(provider,key,{freeOnly=false,deadlineAt=Date.now()+45000}={}){
  if(!PROVIDERS.includes(provider)||typeof key!=='string'||!key.trim())throw coreError(400,'AI_PROVIDER_INPUT','Provider hoặc khóa không hợp lệ.');
  const items=[];let token='';
  for(let page=0;page<10;page++){
    const url=new URL(ROOTS[provider]+'/models');if(provider==='gemini'){url.searchParams.set('pageSize','1000');if(token)url.searchParams.set('pageToken',token);}
    const data=await responseJSON(url,{headers:auth(provider,key)},deadlineAt);
    const rows=provider==='gemini'?data.models:data.data;if(!Array.isArray(rows))throw coreError(502,'AI_MODEL_CATALOG','Danh mục model không hợp lệ.');
    for(const model of rows){
      const id=provider==='gemini'?String(model.name||'').replace(/^models\//,''):model.id;
      if(!validModelId(id)||provider==='gemini'&&!model.supportedGenerationMethods?.includes('generateContent'))continue;
      const free=provider==='openrouter'?freeRouter(model):null;
      // Gemini/Groq free-tier quotas depend on the account; do not invent free pricing.
      if(freeOnly&&provider==='openrouter'&&!free)continue;
      items.push({id,name:model.displayName||model.name||id,free,created:Number(model.created)||null,
        outputLimit:Number(model.outputTokenLimit||model.top_provider?.max_completion_tokens)||null,
        inputModalities:model.architecture?.input_modalities||null,
        jsonMode:provider==='openrouter'?!!model.supported_parameters?.includes('response_format'):true});
    }
    token=provider==='gemini'?data.nextPageToken:'';if(!token)return {items,freeTierDependsOnAccount:provider!=='openrouter'};
    if(typeof token!=='string'||token.length>5000)throw coreError(502,'AI_MODEL_CATALOG','Phân trang model không hợp lệ.');
  }
  throw coreError(502,'AI_MODEL_CATALOG','Danh mục model chưa tải hết; không trả danh sách bị cắt.');
}
export async function providerGenerate(provider,key,model,input){
  if(!PROVIDERS.includes(provider)||!validModelId(model.id))throw coreError(400,'AI_MODEL','Model không hợp lệ.');
  const maxTokens=Math.min(8000,model.outputLimit||8000),attachments=input.attachments||[];
  let url=ROOTS[provider]+'/chat/completions',body;
  if(provider==='gemini'){
    url=ROOTS.gemini+'/models/'+encodeURIComponent(model.id)+':generateContent';
    body={systemInstruction:{parts:[{text:input.systemPrompt}]},contents:[{role:'user',parts:[{text:input.userPrompt},...attachments.map(x=>({inlineData:{mimeType:x.mimeType,data:x.data}}))]}],generationConfig:{temperature:0.2,maxOutputTokens:maxTokens,...(input.jsonMode!==false?{responseMimeType:'application/json'}:{})}};
    if(input.continuation)body.contents.push({role:'model',parts:[{text:input.continuation.text}]},{role:'user',parts:[{text:'Continue exactly from the final character of your previous response. Do not repeat any prefix or restart the JSON.'}]});
  }else{
    if(attachments.some(x=>!x.mimeType.startsWith('image/')))throw coreError(422,'AI_ATTACHMENT_UNSUPPORTED','Provider này cần ảnh trang, không nhận PDF thô.');
    if(attachments.length&&model.inputModalities&&!model.inputModalities.includes('image'))throw coreError(422,'AI_ATTACHMENT_UNSUPPORTED','Model không nhận ảnh.');
    const content=attachments.length?[{type:'text',text:input.userPrompt},...attachments.map(x=>({type:'image_url',image_url:{url:'data:'+x.mimeType+';base64,'+x.data}}))]:input.userPrompt;
    body={model:model.id,messages:[{role:'system',content:input.systemPrompt},{role:'user',content}],temperature:0.2,max_tokens:maxTokens,...(input.jsonMode!==false&&model.jsonMode?{response_format:{type:'json_object'}}:{})};
    if(input.continuation)body.messages.push({role:'assistant',content:input.continuation.text},{role:'user',content:'Continue exactly from the final character of your previous response. Do not repeat any prefix or restart the JSON.'});
    if(provider==='openrouter'&&input.freeOnly)body.provider={max_price:{prompt:0,completion:0,request:0,image:0}};
  }
  const data=await responseJSON(url,{method:'POST',headers:{...auth(provider,key),'Content-Type':'application/json'},body:JSON.stringify(body)},input.deadlineAt);
  const text=provider==='gemini'?(data.candidates?.[0]?.content?.parts||[]).filter(x=>typeof x.text==='string').map(x=>x.text).join(''):data.choices?.[0]?.message?.content;
  const reason=provider==='gemini'?data.candidates?.[0]?.finishReason:data.choices?.[0]?.finish_reason;
  if(typeof text!=='string'||!text.trim())throw coreError(502,'AI_EMPTY','Model không trả nội dung.');
  return {text,truncated:['MAX_TOKENS','length'].includes(reason),provider,model:model.id};
}
