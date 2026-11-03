// Adapted from ElioEinfachlernen- bd517910: OAuth PKCE and verified Google JWTs.
import {coreError,query} from './database.js';
import {digest,randomToken} from './passwords.js';
const encoder=new TextEncoder();
function unbase64url(value){const s=value.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(s+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));}
let googleKeys=null,googleKeysUntil=0;
export async function verifyGoogleToken(token,env,nonce){
 if(typeof token!=='string'||token.length>20000)throw coreError(401,'GOOGLE_IDENTITY','Google không trả về thông tin đăng nhập hợp lệ.');
 let parts,header,claims;try{parts=token.split('.');if(parts.length!==3)throw Error();header=JSON.parse(new TextDecoder().decode(unbase64url(parts[0])));claims=JSON.parse(new TextDecoder().decode(unbase64url(parts[1])));}catch{throw coreError(401,'GOOGLE_IDENTITY','Token Google không hợp lệ.');}
 if(header.alg!=='RS256'||typeof header.kid!=='string')throw coreError(401,'GOOGLE_IDENTITY','Chữ ký Google không hợp lệ.');
 const now=Math.floor(Date.now()/1000);
 if(!['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||claims.aud!==env.GOOGLE_CLIENT_ID||claims.azp&&claims.azp!==env.GOOGLE_CLIENT_ID||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||claims.nonce!==nonce||claims.email_verified!==true||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>255)throw coreError(401,'GOOGLE_IDENTITY','Không xác minh được tài khoản Google.');
 if(!googleKeys||Date.now()>googleKeysUntil||!googleKeys.some(k=>k.kid===header.kid)){const response=await fetch('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw coreError(503,'GOOGLE_KEYS','Không tải được khóa xác minh Google.');const data=await response.json();if(!Array.isArray(data.keys))throw coreError(503,'GOOGLE_KEYS','Khóa Google không hợp lệ.');googleKeys=data.keys;googleKeysUntil=Date.now()+300000;}
 const jwk=googleKeys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256');if(!jwk)throw coreError(401,'GOOGLE_IDENTITY','Không tìm thấy chữ ký Google.');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,unbase64url(parts[2]),encoder.encode(parts[0]+'.'+parts[1])))throw coreError(401,'GOOGLE_IDENTITY','Chữ ký Google không hợp lệ.');return claims;
}
export const googleStateCookie=(state,age=600)=>`__Host-sprach_google=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
function configured(env){if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)throw coreError(503,'GOOGLE_NOT_CONFIGURED','Chưa cấu hình Google OAuth phía server.');}
const callback=request=>new URL('/api/core/auth/google/callback',request.url).href;
export async function startGoogleAuth(request,env,input,user=null){
 configured(env);if(input.link===true&&!user)throw coreError(401,'AUTH_REQUIRED','Đăng nhập trước khi liên kết Google.');
 const state=randomToken(),nonce=randomToken(),verifier=randomToken();const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(verifier));
 const challenge=btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
 await query(env,'INSERT INTO sprach_core_google_flows(state_hash,nonce,verifier,expires,link_user) VALUES(?,?,?,?,?)',[await digest(state),nonce,verifier,Date.now()+600000,input.link===true?user.id:null]);
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:callback(request),response_type:'code',scope:'openid email profile',state,nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}).toString();
 return {url:url.href,cookie:googleStateCookie(state)};
}
export async function completeGoogleAuth(request,env){
 configured(env);const url=new URL(request.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');
 const cookie=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)__Host-sprach_google=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!state||state!==cookie||!code||code.length>4000)throw coreError(401,'GOOGLE_STATE','Phiên Google không khớp hoặc đã hết hạn.');
 const flow=(await query(env,'DELETE FROM sprach_core_google_flows WHERE state_hash=? AND expires>? RETURNING nonce,verifier,link_user',[await digest(state),Date.now()])).rows[0];if(!flow)throw coreError(401,'GOOGLE_STATE','Phiên Google đã dùng hoặc hết hạn.');
 let claims;try{
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:callback(request),grant_type:'authorization_code',code_verifier:flow.verifier}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error();const data=await response.json();claims=await verifyGoogleToken(data.id_token,env,flow.nonce);
 }catch{throw coreError(401,'GOOGLE_IDENTITY','Chưa xác minh được danh tính Google.');}
 let identity=(await query(env,'SELECT user_id FROM ee_google_identities WHERE google_sub=?',[claims.sub])).rows[0];
 if(flow.link_user){
  // Link only the authenticated ID captured at flow creation; never by caller-supplied email.
  const linked=(await query(env,'SELECT id,blocked FROM ee_users WHERE id=?',[flow.link_user])).rows[0];if(!linked||linked.blocked)throw coreError(403,'ACCOUNT_BLOCKED','Không thể liên kết tài khoản.');
  if(identity&&identity.user_id!==flow.link_user)throw coreError(409,'GOOGLE_ALREADY_LINKED','Danh tính Google đã thuộc tài khoản khác.');
  if(!identity){await query(env,'INSERT INTO ee_google_identities(google_sub,user_id) VALUES(?,?) ON CONFLICT(google_sub) DO NOTHING',[claims.sub,flow.link_user]);identity=(await query(env,'SELECT user_id FROM ee_google_identities WHERE google_sub=?',[claims.sub])).rows[0];}
  if(identity?.user_id!==flow.link_user)throw coreError(409,'GOOGLE_ALREADY_LINKED','Danh tính Google đã thuộc tài khoản khác.');
 }
 if(!identity)throw coreError(409,'GOOGLE_NOT_LINKED','Google chưa được liên kết. Hãy đăng nhập bằng mật khẩu trước.');
 const user=(await query(env,'SELECT id,email,name,role,blocked FROM ee_users WHERE id=?',[identity.user_id])).rows[0];if(!user||user.blocked)throw coreError(403,'ACCOUNT_BLOCKED','Tài khoản không được phép đăng nhập.');
 return user;
}
