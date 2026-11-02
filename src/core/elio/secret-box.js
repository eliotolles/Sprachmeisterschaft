// Elio's AES-GCM server-secret pattern, kept separate from presentation code.
import { coreError } from './database.js';
const encoder=new TextEncoder();
const hex=value=>Array.from(new Uint8Array(value),n=>n.toString(16).padStart(2,'0')).join('');
function bytes(value){if(typeof value!=='string'||value.length%2||!/^[a-f0-9]+$/i.test(value))throw Error('Invalid secret envelope');return Uint8Array.from(value.match(/../g),v=>parseInt(v,16));}
async function key(env){
  if(typeof env.AI_ENCRYPTION_KEY!=='string'||env.AI_ENCRYPTION_KEY.length<32)throw coreError(503,'AI_ENCRYPTION_CONFIG','Cần cấu hình khóa mã hóa phía server.');
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(env.AI_ENCRYPTION_KEY));
  return crypto.subtle.importKey('raw',digest,'AES-GCM',false,['encrypt','decrypt']);
}
export async function encryptSecret(env,value){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  return hex(iv)+':'+hex(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(env),encoder.encode(value)));
}
export async function decryptSecret(env,value){
  const parts=String(value).split(':');if(parts.length!==2||parts[0].length!==24)throw Error('Invalid secret envelope');
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(parts[0])},await key(env),bytes(parts[1])));
}
