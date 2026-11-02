// Isolated build screenshots: no external services, credentials or real account data.
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {comparePixels} from './pixel-compare.mjs';
import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const roots=[resolve('.baseline/dist'),resolve('dist')],ports=[4173,4174],servers=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
for(let i=0;i<roots.length;i++){
 const root=roots[i];const server=createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(!path.startsWith(root+'/'))path=resolve(root,'index.html');let bytes;try{bytes=await readFile(path);}catch{path=resolve(root,'index.html');bytes=await readFile(path);}res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(500);res.end('Fixture server error');}});
 await new Promise(r=>server.listen(ports[i],'127.0.0.1',r));servers.push(server);
}
await mkdir('ui-artifacts',{recursive:true});const browser=await chromium.launch({headless:true,args:['--disable-gpu','--disable-lcd-text','--force-color-profile=srgb','--font-render-hinting=none']});const report=[];
const routes=['/landing','/register','/','/vocabulary','/skills','/skills/grammar','/exams','/elio','/progress'];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const colorScheme of ['light','dark'])for(const route of routes){
  const images=[],errors=[];const label=(route==='/'?'home':route.slice(1).replaceAll('/','-'))+'-'+viewport.width+'-'+colorScheme;
  for(let i=0;i<2;i++){
   const context=await browser.newContext({viewport,colorScheme,locale:'vi-VN',timezoneId:'UTC',reducedMotion:'reduce'});
   await context.addInitScript(({theme})=>{
    const OriginalDate=Date,fixed=1793613600000;globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}};
    let seed=42;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    localStorage.setItem('sprachmeisterschaft_auth_v1',JSON.stringify({id:'qa-user',name:'Migration Fixture',email:'qa@example.invalid',role:'user',is_verified:true,onboarding_completed:true,target_level:'B1',created_at:new Date().toISOString()}));
    localStorage.setItem('theme',theme);localStorage.setItem('sprach_theme',theme);document.addEventListener('DOMContentLoaded',()=>document.documentElement.classList.toggle('dark',theme==='dark'));
   },{theme:colorScheme});
   await context.route('**/*',async request=>{
    const url=new URL(request.request().url());
    if(url.origin!==`http://127.0.0.1:${ports[i]}`)return request.abort();
    if(url.pathname.startsWith('/api/'))return request.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname==='/api/core/config'?{enabled:false}:{success:true,admins:[],items:[],cards:[]})});
    return request.continue();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push({build:i,message:e.message}));
   await page.goto(`http://127.0.0.1:${ports[i]}/#${route}`,{waitUntil:'networkidle'});
   await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
   let screenshot=await page.screenshot({animations:'disabled',fullPage:true}),stable=false;
   for(let pass=0;pass<4;pass++){await page.waitForTimeout(100);const next=await page.screenshot({animations:'disabled',fullPage:true});if(comparePixels(PNG.sync.read(screenshot),PNG.sync.read(next)).equal){stable=true;screenshot=next;break;}screenshot=next;}
   if(!stable)errors.push({build:i,message:'Screenshot did not stabilize'});
   await writeFile(`ui-artifacts/${label}-${i?'candidate':'baseline'}.png`,screenshot);images.push(screenshot);
   if(await page.locator('body').innerText().then(s=>s.trim().length<20))errors.push({build:i,message:'Empty rendered page'});
   await context.close();
  }
  const pixels=comparePixels(PNG.sync.read(images[0]),PNG.sync.read(images[1]));
  report.push({route,viewport,colorScheme,byteEqual:images[0].equals(images[1]),...pixels,errors});console.log(JSON.stringify(report.at(-1)));
 }
 await writeFile('ui-artifacts/report.json',JSON.stringify(report,null,2));
 if(report.some(r=>!r.equal||r.errors.length))process.exitCode=1;
}finally{await browser.close();for(const server of servers)await new Promise(r=>server.close(r));}
