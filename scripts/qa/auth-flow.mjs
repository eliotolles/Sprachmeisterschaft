// Browser contract tests for existing auth controls against isolated API fixtures.
import {chromium} from 'playwright';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=resolve('dist'),origin='http://127.0.0.1:4175';
const server=createServer(async(req,res)=>{let path=resolve(root,'.'+new URL(req.url,origin).pathname);if(!path.startsWith(root+'/'))path=resolve(root,'index.html');let bytes;try{bytes=await readFile(path);}catch{path=resolve(root,'index.html');bytes=await readFile(path);}res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream'});res.end(bytes);});await new Promise(r=>server.listen(4175,'127.0.0.1',r));
const browser=await chromium.launch();
try{
 for(const action of ['login','register','google','review','review-fail','tutor','tutor-fail']){
  let identity=null;const requests=[],errors=[];const context=await browser.newContext();await context.addInitScript(()=>{sessionStorage.setItem('sprach_onboarding_dismissed','true');localStorage.setItem('sprach_elio_history',JSON.stringify([{role:'user',content:'Old other-account chat'}]));localStorage.setItem('sprachmeisterschaft_auth_v1',JSON.stringify({id:'forged-local-admin',name:'Local admin',role:'admin',email:'admin@example.invalid',is_verified:true}));});
  await context.route('**/*',async route=>{
   const request=route.request(),u=new URL(request.url());
   if(u.origin==='https://accounts.google.com')return route.fulfill({contentType:'text/html',body:'<h1>Isolated Google destination fixture</h1>'});
   if(u.origin!==origin)return route.abort();if(!u.pathname.startsWith('/api/'))return route.continue();
   requests.push({path:u.pathname,method:request.method()});let status=200,body={};
   if(u.pathname==='/api/core/config')body={enabled:true,uiAuthEnabled:true,uiVocabularyEnabled:action.startsWith('review'),uiTutorEnabled:action.startsWith('tutor')};
   else if(u.pathname==='/api/core/auth/me'){status=401;body={code:'AUTH_REQUIRED',error:'Fixture session absent'};}
   else if(['/api/core/auth/login','/api/core/auth/register'].includes(u.pathname)){const data=request.postDataJSON();assert.equal(data.email,'qa@example.invalid');assert.equal(data.password,'Fixture-password-123!');await new Promise(r=>setTimeout(r,100));identity={id:'server-account-id',email:data.email,name:'Backend Fixture',role:'user'};body={user:identity};}
   else if(u.pathname==='/api/core/auth/google/start'){assert.deepEqual(request.postDataJSON(),{link:false});body={url:'https://accounts.google.com/o/oauth2/v2/auth?state=isolated-fixture'};}
   else if(u.pathname==='/api/core/vocabulary')body={cards:[{source_id:'fixture-source-id',german:'grün',vietnamese:'xanh',level:'A1',article:'',word_type:'adjective',extra_json:'{}'}]};
   else if(u.pathname==='/api/core/vocabulary/review'){const data=request.postDataJSON();assert.equal(data.sourceId,'fixture-source-id');assert.equal(data.rating,'good');assert.equal(data.version,0);assert.equal(request.headers()['x-elio-user'],'server-account-id');if(action==='review-fail'){status=503;body={code:'FIXTURE_UNAVAILABLE',error:'Fixture save failed'};}else body={userId:'server-account-id',sourceId:data.sourceId,version:1,direction:'de',review:{repetitions:1,intervalDays:1,ease:2.5,lapses:0,dueAt:Date.now()+86400000,lastReviewedAt:Date.now()}};}
   else if(u.pathname==='/api/core/tutor/reply'){const data=request.postDataJSON();assert.equal(data.text,'Erkläre Dativ');assert.equal(data.version,0);assert.equal(data.messages,undefined);if(action==='tutor-fail'){status=503;body={code:'AI_UNAVAILABLE',error:'Fixture tutor unavailable'};}else body={userId:'server-account-id',version:1,session:{id:'fixture-thread',level:'B1',language:'vi',messages:[{role:'user',text:data.text},{role:'assistant',text:'Dativ aus dem Server'}]}};}
   else if(u.pathname==='/api/core/tutor/new'){const data=request.postDataJSON();assert.equal(data.version,1);body={userId:'server-account-id',version:2,session:{id:'fixture-new-thread',level:'B1',language:'vi',messages:[]}};}
   else if(u.pathname==='/api/auth/admins')body={success:true,admins:[]};
   else body={items:[],cards:[],records:{},userId:identity?.id};
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/#/'+(action==='register'?'register':'login'),{waitUntil:'networkidle'});
  if(action==='login'||action.startsWith('review')||action.startsWith('tutor')){
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
  if(action.startsWith('review')){
   await page.goto(origin+'/#/review');await page.getByRole('button',{name:'Lật thẻ xem đáp án',exact:true}).click();await page.getByRole('button',{name:/^Được/}).click();
   if(action==='review-fail'){await page.getByText('Fixture save failed',{exact:true}).waitFor();await page.getByRole('button',{name:/^Được/}).waitFor();}
   else await page.getByText('Kết quả phiên học từ vựng',{exact:true}).waitFor();
   assert.equal(requests.filter(r=>r.path==='/api/core/vocabulary/review').length,1);const localWords=await page.evaluate(()=>JSON.parse(localStorage.getItem('sprachmeisterschaft_db_v1')||'{}').vocabularyCards||[]);assert.equal(localWords.length,0);
  }
  if(action.startsWith('tutor')){
   await page.goto(origin+'/#/elio');assert.equal(await page.locator('body').innerText().then(s=>s.includes('Old other-account chat')),false);const input=page.getByPlaceholder('Hỏi ELIO bất kỳ điều gì về tiếng Đức, ngữ pháp, mẫu câu thi...',{exact:true});await input.fill('Erkläre Dativ');await page.getByRole('button',{name:'Gửi',exact:true}).click();
   if(action==='tutor-fail'){await page.getByText('Fixture tutor unavailable',{exact:true}).waitFor();assert.equal(await input.inputValue(),'Erkläre Dativ');}
   else{await page.getByText('Dativ aus dem Server',{exact:true}).waitFor();await page.getByRole('button',{name:'Xoá lịch sử chat',exact:true}).click();await page.getByText('Lịch sử hội thoại đã được làm mới. Hãy gửi câu hỏi tiếng Đức tiếp theo của bạn nhé!',{exact:true}).waitFor();assert.equal(requests.filter(r=>r.path==='/api/core/tutor/new').length,1);}
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sprach_elio_history'))[0].content),'Old other-account chat');assert.equal(requests.some(r=>r.method==='DELETE'),false);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({action,pass:true,serverAccount:identity?.id||null}));await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
