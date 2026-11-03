// Uses the configured administrator credential locally; never prints it or user data.
// Creates a temporary core session, verifies it, then logs out. No account updates.
import {query,databaseEndpoint,APPROVED_HOST} from '../src/core/elio/database.js';
import {passwordMatches,digest} from '../src/core/elio/passwords.js';
import {handleElioCore} from '../src/core/elio/gateway.js';
export async function checkLiveAuthentication(env){
 databaseEndpoint(env.TURSO_DATABASE_URL,APPROVED_HOST);
 const allowed=(env.ADMIN_EMAILS||'').split(',').map(e=>e.trim().toLowerCase()).filter(Boolean);
 const users=(await query(env,'SELECT id,email,password,role,blocked FROM ee_users ORDER BY id',[])).rows;
 const fingerprint=await digest(JSON.stringify(users));let selected;
 for(const user of users)if(allowed.includes(user.email.toLowerCase())&&['admin','super_admin'].includes(user.role)&&!user.blocked&&await passwordMatches(env.ADMIN_INITIAL_PASSWORD||'',user.password)){selected=user;break;}
 if(!selected)return {credentialVerified:false,loginAttempted:false,accountUpdated:false,reason:'CONFIGURED_ADMIN_CREDENTIAL_NOT_MATCHED'};
 const runtime={...env,ELIO_CORE_ENABLED:'true'},origin='https://local-core-acceptance.invalid';let cookie=null,identity=null;
 const request=(path,method='GET',data)=>new Request(origin+'/api/core'+path,{method,headers:{Origin:origin,'CF-Connecting-IP':'local-core-acceptance',...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie,'X-Elio-User':identity.id}:{})},body:data?JSON.stringify(data):undefined});
 let report={credentialVerified:true,accountUpdated:false,productionWorkerActivated:false};
 try{
  const login=await handleElioCore(request('/auth/login','POST',{email:selected.email,password:env.ADMIN_INITIAL_PASSWORD}),runtime),payload=await login.json();report.loginStatus=login.status;
  if(login.status!==200)return {...report,sessionVerified:false};
  cookie=login.headers.get('Set-Cookie')?.split(';')[0];identity=payload.user;
  if(!cookie||identity?.id!==selected.id||identity.role!=='admin')throw Error('LIVE_AUTH_IDENTITY');
  const me=await handleElioCore(request('/auth/me'),runtime),restored=await me.json();report.sessionVerified=me.status===200&&restored.user?.id===selected.id;
  report.httpOnly=login.headers.get('Set-Cookie').includes('HttpOnly');
 }finally{
  if(cookie&&identity){const logout=await handleElioCore(request('/auth/logout','POST',{}),runtime);report.sessionCleanedUp=logout.status===200;}
  report.oldUsersUnchanged=fingerprint===await digest(JSON.stringify((await query(env,'SELECT id,email,password,role,blocked FROM ee_users ORDER BY id',[])).rows));
 }
 return report;
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){try{console.log(JSON.stringify(await checkLiveAuthentication(process.env)));}catch{console.log(JSON.stringify({sessionVerified:false,accountUpdated:false,errorCode:'LIVE_AUTH_CHECK_FAILED'}));process.exitCode=1;}}
