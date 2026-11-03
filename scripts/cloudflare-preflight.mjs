// Read-only Cloudflare API inspection. No browser auth, deployment or secret writes.
import {writeFile} from 'node:fs/promises';
const required=['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','AI_ENCRYPTION_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','TRANSCRIPT_BACKEND_URL','TRANSCRIPT_BACKEND_TOKEN'];
export async function cloudflarePreflight(env,{fetcher=fetch}={}){
 const token=env.CLOUDFLARE_API_TOKEN||env.CF_API_TOKEN,account=env.CLOUDFLARE_ACCOUNT_ID||env.CF_ACCOUNT_ID;
 if(!token||!account)return {ready:false,readOnly:true,credentialPresent:!!token,accountConfigured:!!account,blocker:'CLOUDFLARE_CREDENTIALS_NOT_CONFIGURED'};
 if(!/^[a-f0-9]{32}$/i.test(account))return {ready:false,readOnly:true,blocker:'CLOUDFLARE_ACCOUNT_ID_INVALID'};
 try{
  const response=await fetcher('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/sprachmeisterschaft/settings',{method:'GET',redirect:'error',signal:AbortSignal.timeout(30000),headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
  if(!response.ok)return {ready:false,readOnly:true,credentialPresent:true,accountConfigured:true,httpStatus:response.status,blocker:'CLOUDFLARE_ACCESS_UNAVAILABLE'};
  const payload=await response.json();if(payload.success!==true||!Array.isArray(payload.result?.bindings))return {ready:false,readOnly:true,blocker:'CLOUDFLARE_RESPONSE_INVALID'};
  const bindingNames=payload.result.bindings.map(b=>b.name).filter(name=>typeof name==='string'&&/^[A-Z][A-Z0-9_]{0,80}$/.test(name));
  return {ready:false,readOnly:true,workerFound:true,worker:'sprachmeisterschaft',bindingNames:[...new Set(bindingNames)].sort(),missingCoreBindings:required.filter(name=>!bindingNames.includes(name)),blocker:'LIVE_PROVIDER_AND_PREVIEW_ACCEPTANCE_STILL_REQUIRED'};
 }catch{return {ready:false,readOnly:true,blocker:'CLOUDFLARE_CONNECTION_FAILED'};}
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){const report=await cloudflarePreflight(process.env);await writeFile('cloudflare-preflight.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
