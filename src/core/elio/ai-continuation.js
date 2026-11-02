import {coreError} from './database.js';import {digest} from './passwords.js';
const enc=new TextEncoder();
function base64url(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
function decode(value){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
async function signingKey(env){if(typeof env.AI_ENCRYPTION_KEY!=='string'||env.AI_ENCRYPTION_KEY.length<32)throw Error('Missing signing key');return crypto.subtle.importKey('raw',enc.encode('elio-continuation-v1:'+env.AI_ENCRYPTION_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
const context=input=>JSON.stringify({systemPrompt:input.systemPrompt,userPrompt:input.userPrompt,attachments:input.attachments||[],jsonMode:input.jsonMode!==false,task:input.task||'text',purpose:input.purpose||null});
export async function makeContinuation(env,user,row,input,text){
  const payload={user:user.id,config:row.id,fingerprint:await digest(row.model+'|'+row.secret),context:await digest(context(input)),prefix:await digest(text),expires:Date.now()+15*60000};
  const data=base64url(enc.encode(JSON.stringify(payload))),signature=base64url(await crypto.subtle.sign('HMAC',await signingKey(env),enc.encode(data)));
  return {text,token:data+'.'+signature};
}
export async function verifyContinuation(env,user,input){
  try{
    const next=input.continuation;if(!next||typeof next.text!=='string'||next.text.length>500000||typeof next.token!=='string'||next.token.length>3000)throw Error('Invalid continuation');
    const parts=next.token.split('.');if(parts.length!==2||!await crypto.subtle.verify('HMAC',await signingKey(env),decode(parts[1]),enc.encode(parts[0])))throw Error('Invalid signature');
    const payload=JSON.parse(new TextDecoder().decode(decode(parts[0])));
    if(payload.user!==user.id||!Number.isFinite(payload.expires)||payload.expires<Date.now()||payload.prefix!==await digest(next.text)||payload.context!==await digest(context(input)))throw Error('Changed continuation');
    return payload;
  }catch{throw coreError(409,'AI_CONTINUATION_INVALID','Phần tiếp tục không khớp tài khoản hoặc nội dung; phần đã nhận vẫn được giữ.');}
}
