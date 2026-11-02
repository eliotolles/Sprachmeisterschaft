// Adapter only: presentation markup and legacy storage stay untouched.
export function createAuthBinding({client,legacy,notify=()=>{},redirect=url=>globalThis.location.assign(url)}){
 let mode='pending',init=null,configuration={};
 const fail=(code,message)=>Object.assign(new Error(message),{code});
 const user=()=>{const u=client.getUser();return u?Object.freeze({...u,is_verified:true}):null;};
 async function initialize(){
  if(init)return init;
  init=(async()=>{try{const config=await client.config();configuration=config;
   // Explicit preview opt-in; unfinished account/module compatibility cannot activate accidentally.
   if(config.enabled===false||config.uiAuthEnabled!==true){mode='legacy';return mode;}
   mode='core';await client.restore();notify(user());return mode;
  }catch(error){mode='unavailable';throw error;}})();return init;
 }
 async function run(name,...args){await initialize();if(mode==='legacy')return legacy[name](...args);if(mode!=='core')throw fail('AUTH_UNAVAILABLE','Chưa kết nối được xác thực; không đăng nhập dự phòng cục bộ.');
  try{const result=await client[name](...args);return result?user():result;}finally{notify(user());}
 }
 const auth={getUser:()=>mode==='legacy'?legacy.getUser():user(),isAdmin:()=>mode==='legacy'?legacy.isAdmin():user()?.role==='admin',
  login:(email,password)=>run('login',email,password),register:data=>run('register',data),
  logout:()=>run('logout'),
  async loginWithGoogle(data={}){await initialize();if(mode==='legacy')return legacy.loginWithGoogle(data);if(mode!=='core')throw fail('AUTH_UNAVAILABLE','Chưa kết nối xác thực.');const flow=await client.startGoogleAuth();const url=new URL(flow.url);if(url.origin!=='https://accounts.google.com'||url.pathname!=='/o/oauth2/v2/auth')throw fail('GOOGLE_REDIRECT','Địa chỉ Google không hợp lệ.');redirect(url.href);return new Promise(()=>{});},
  verifyOtp:(...args)=>mode==='legacy'?legacy.verifyOtp(...args):!!user(),
  setRole:role=>{if(mode==='legacy')return legacy.setRole(role);throw fail('SERVER_ROLE','Phân quyền được quản lý phía server.');},
  toggleAdminMode:()=>mode==='legacy'?legacy.toggleAdminMode():user()?.role==='admin'};
 for(const name of Object.keys(legacy))if(!(name in auth))auth[name]=(...args)=>{if(mode==='legacy')return legacy[name](...args);throw fail('AUTH_FLOW_UNSUPPORTED','Chức năng tài khoản này chưa được nối với server; dữ liệu cũ được giữ nguyên.');};
 return {auth,initialize,getMode:()=>mode,isActive:()=>mode==='core',configuration:()=>({...configuration}),isAdminEmail:email=>mode==='core'&&user()?.role==='admin'&&user()?.email?.toLowerCase()===String(email).trim().toLowerCase()};
}
