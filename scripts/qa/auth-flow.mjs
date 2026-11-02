// Browser contract tests for existing auth controls against isolated API fixtures.
import {chromium} from 'playwright';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=resolve('dist'),origin='http://127.0.0.1:4175';
const server=createServer(async(req,res)=>{let path=resolve(root,'.'+new URL(req.url,origin).pathname);if(!path.startsWith(root+'/'))path=resolve(root,'index.html');let bytes;try{bytes=await readFile(path);}catch{path=resolve(root,'index.html');bytes=await readFile(path);}res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream'});res.end(bytes);});await new Promise(r=>server.listen(4175,'127.0.0.1',r));
const browser=await chromium.launch();
try{
 for(const action of ['login','register','google']){
  let identity=null;const requests=[],errors=[];const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('sprachmeisterschaft_auth_v1',JSON.stringify({id:'forged-local-admin',name:'Local admin',role:'admin',email:'admin@example.invalid',is_verified:true})));
  await context.route('**/*',async route=>{
   const request=route.request(),u=new URL(request.url());
   if(u.origin==='https://accounts.google.com')return route.fulfill({contentType:'text/html',body:'<h1>Isolated Google destination fixture</h1>'});
   if(u.origin!==origin)return route.abort();if(!u.pathname.startsWith('/api/'))return route.continue();
   requests.push({path:u.pathname,method:request.method()});let status=200,body={};
   if(u.pathname==='/api/core/config')body={enabled:true,uiAuthEnabled:true};
   else if(u.pathname==='/api/core/auth/me'){status=401;body={code:'AUTH_REQUIRED',error:'Fixture session absent'};}
   else if(['/api/core/auth/login','/api/core/auth/register'].includes(u.pathname)){const data=request.postDataJSON();assert.equal(data.email,'qa@example.invalid');assert.equal(data.password,'Fixture-password-123!');await new Promise(r=>setTimeout(r,100));identity={id:'server-account-id',email:data.email,name:'Backend Fixture',role:'user'};body={user:identity};}
   else if(u.pathname==='/api/core/auth/google/start'){assert.deepEqual(request.postDataJSON(),{link:false});body={url:'https://accounts.google.com/o/oauth2/v2/auth?state=isolated-fixture'};}
   else if(u.pathname==='/api/auth/admins')body={success:true,admins:[]};
   else body={items:[],cards:[],records:{},userId:identity?.id};
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/#/'+(action==='register'?'register':'login'),{waitUntil:'networkidle'});
  if(action==='login'){
   await page.getByText('Đăng nhập mật khẩu truyền thống',{exact:true}).click();await page.getByPlaceholder('Email đăng nhập',{exact:true}).fill('qa@example.invalid');await page.getByPlaceholder('Mật khẩu (ví dụ: admin123)',{exact:true}).fill('Fixture-password-123!');await page.getByRole('button',{name:'Đăng nhập bằng Mật khẩu',exact:true}).click();
  }else if(action==='register'){
   await page.getByPlaceholder('Nguyễn Văn Đạt',{exact:true}).fill('Backend Fixture');await page.getByPlaceholder('hocvien@sprachmeisterschaft.de',{exact:true}).fill('qa@example.invalid');await page.locator('input[type=password]').fill('Fixture-password-123!');await page.getByRole('button',{name:'Đăng ký & Bắt đầu học',exact:true}).click();
  }else{
   await page.locator('button').filter({hasText:'dat.uneti.1999@gmail.com'}).click();await page.waitForURL('https://accounts.google.com/**');assert.equal(identity,null);assert.equal(requests.some(r=>r.path==='/api/core/auth/login'),false);
  }
  if(action!=='google'){
   await page.waitForURL(url=>url.hash==='#/');assert.equal(identity?.id,'server-account-id');assert.equal(await page.locator('body').innerText().then(s=>s.includes('Trung tâm Quản trị tối cao')),false);
   // Bundle UI must show the server identity, not the forged LocalStorage admin.
   await page.getByText('Backend Fixture',{exact:false}).first().waitFor();assert.equal(await page.locator('body').innerText().then(s=>s.includes('Local admin')),false);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({action,pass:true,serverAccount:identity?.id||null}));await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
