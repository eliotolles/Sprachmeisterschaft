import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {encryptSecret,decryptSecret} from '../src/core/elio/secret-box.js';
import {discoverModels,providerGenerate} from '../src/core/elio/ai-providers.js';
import {addAIConfig,listAIConfigs,modelsForConfig,updateAIConfig,discoverForAdmin,generateAI} from '../src/core/elio/ai.js';
const owner={id:'owner',role:'super_admin'},student={id:'student',role:'user'};
function fixture(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
 const env={AI_ENCRYPTION_KEY:'only-a-long-test-fixture-not-a-live-secret',TEST_CORE_DB:async(sql,args=[])=>{const s=db.prepare(sql);if(/^SELECT/i.test(sql)||/RETURNING/.test(sql))return {rows:s.all(...args),changes:0};return {rows:[],changes:Number(s.run(...args).changes)};}};return {db,env};}
const catalog=()=>({data:[{id:'fresh-model',name:'Fresh model',created:100}]});
test('provider keys are randomized AES-GCM envelopes and require a server encryption secret',async()=>{
 const {db,env}=fixture();try{const a=await encryptSecret(env,'fixture-key'),b=await encryptSecret(env,'fixture-key');assert.notEqual(a,b);assert.equal(await decryptSecret(env,a),'fixture-key');assert(!a.includes('fixture-key'));await assert.rejects(encryptSecret({},'fixture-key'));await assert.rejects(decryptSecret({...env,AI_ENCRYPTION_KEY:'another-very-long-fixture-not-real'},a));}finally{db.close();}
});
test('model discovery returns the actual provider catalog and handles Gemini pagination',async()=>{
 const original=globalThis.fetch;let pages=0;
 globalThis.fetch=async(url,opts)=>{assert.equal(opts.headers['x-goog-api-key'],'fixture-key');assert(!String(url).includes('fixture-key'));pages++;return Response.json(pages===1?{models:[{name:'models/current-one',supportedGenerationMethods:['generateContent']},{name:'models/embed-only',supportedGenerationMethods:['embedContent']}],nextPageToken:'next'}:{models:[{name:'models/current-two',supportedGenerationMethods:['generateContent']}]});};
 try{const r=await discoverModels('gemini','fixture-key',{freeOnly:true});assert.deepEqual(r.items.map(x=>x.id),['current-one','current-two']);assert.equal(r.freeTierDependsOnAccount,true);assert(r.items.every(x=>x.free===null));assert.equal(pages,2);}finally{globalThis.fetch=original;}
});
test('OpenRouter free filter checks actual prices rather than a model-name suffix',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({data:[{id:'free-now',pricing:{prompt:'0',completion:'0'}},{id:'paid-name:free',pricing:{prompt:'1',completion:'0'}},{id:'unknown-prices'},{id:'bad-price',pricing:{prompt:'NaN',completion:'0'}}]});
 try{assert.deepEqual((await discoverModels('openrouter','fixture',{freeOnly:true})).items.map(x=>x.id),['free-now']);}finally{globalThis.fetch=original;}
});
test('only Admin can discover/store keys; metadata never returns the secret and model changes use live discovery',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let called=0;globalThis.fetch=async()=>{called++;return Response.json(catalog());};
 try{await assert.rejects(discoverForAdmin(env,student,{provider:'groq',key:'fixture-key'}),e=>e.status===403);assert.equal(called,0);
  const added=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});assert(!JSON.stringify(added).includes('fixture-key'));
  const stored=db.prepare('SELECT value FROM ee_config').get().value;assert(!stored.includes('fixture-key'));
  const meta=await listAIConfigs(env,owner);assert.equal(meta.items.length,1);assert.equal(meta.items[0].secret,undefined);assert.equal((await modelsForConfig(env,owner,added.config.id)).items[0].id,'fresh-model');
  await assert.rejects(updateAIConfig(env,owner,{id:added.config.id,model:'old-hardcoded-model'}),e=>e.code==='AI_MODEL_NOT_AVAILABLE');
  assert.equal((await updateAIConfig(env,owner,{id:added.config.id,enabled:false})).config.enabled,false);
 }finally{db.close();globalThis.fetch=original;}
});
test('fallback rotates through five stored configurations and skips invalid JSON without inventing a result',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let generations=0;
 globalThis.fetch=async(url)=>String(url).endsWith('/models')?Response.json(catalog()):(++generations<5?Response.json({choices:[{message:{content:'invalid JSON'}}]}):Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]}));
 try{for(let i=0;i<5;i++)await addAIConfig(env,owner,{provider:'groq',key:'fixture-key-'+i,model:'fresh-model',priority:i});const r=await generateAI(env,student,{systemPrompt:'Return JSON',userPrompt:'Fixture'});assert.equal(r.value.ok,true);assert.equal(generations,5);assert(!JSON.stringify(r).includes('fixture-key'));}finally{db.close();globalThis.fetch=original;}
});
test('truncated responses are explicit partial content and malformed outputs are not scored',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;globalThis.fetch=async(url)=>String(url).endsWith('/models')?Response.json(catalog()):Response.json({choices:[{message:{content:'{"scores":'},finish_reason:'length'}]});
 try{await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});const r=await generateAI(env,student,{systemPrompt:'JSON',userPrompt:'Fixture'});assert.equal(r.truncated,true);assert.equal(r.value,undefined);assert.equal(r.text,'{"scores":');}finally{db.close();globalThis.fetch=original;}
});
test('provider HTTP failures never leak error bodies or keys, and PDF is not silently sent to unsupported chat providers',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('private-key-in-provider-error',{status:401});
 try{await assert.rejects(discoverModels('groq','fixture-key'),e=>!e.message.includes('private-key'));
  await assert.rejects(providerGenerate('groq','fixture-key',{id:'fresh-model'},{systemPrompt:'x',userPrompt:'x',attachments:[{mimeType:'application/pdf',data:'YQ=='}]}),e=>e.code==='AI_ATTACHMENT_UNSUPPORTED');
 }finally{globalThis.fetch=original;}
});
test('missing provider configuration fails explicitly and invalid grading falls through without fake feedback',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;
 try{await assert.rejects(generateAI(env,student,{systemPrompt:'x',userPrompt:'x'}),e=>e.code==='AI_NOT_CONFIGURED');
  globalThis.fetch=async(url)=>String(url).endsWith('/models')?Response.json(catalog()):Response.json({choices:[{message:{content:'{"score":999}'},finish_reason:'stop'}]});
  await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});
  await assert.rejects(generateAI(env,student,{systemPrompt:'x',userPrompt:'x'},{validate:()=>{throw Error('invalid feedback');}}),e=>e.code==='AI_UNAVAILABLE');
 }finally{db.close();globalThis.fetch=original;}
});
test('signed continuation preserves previous JSON and rejects changed prefixes or accounts',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/models'))return Response.json(catalog());calls++;if(calls===1)return Response.json({choices:[{message:{content:'{"ok":'},finish_reason:'length'}]});
  const body=JSON.parse(options.body);assert.equal(body.messages[2].content,'{"ok":');return Response.json({choices:[{message:{content:'true}'},finish_reason:'stop'}]});};
 try{await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});const input={systemPrompt:'JSON',userPrompt:'Fixture'};
  const partial=await generateAI(env,student,input);assert(partial.continuation.token);
  await assert.rejects(generateAI(env,student,{...input,continuation:{...partial.continuation,text:'{"changed":'}}),e=>e.code==='AI_CONTINUATION_INVALID');
  await assert.rejects(generateAI(env,{...student,id:'other'},{...input,continuation:partial.continuation}),e=>e.code==='AI_CONTINUATION_INVALID');
  const complete=await generateAI(env,student,{...input,continuation:partial.continuation});assert.equal(complete.text,'{"ok":true}');assert.equal(complete.value.ok,true);assert.equal(calls,2);
 }finally{db.close();globalThis.fetch=original;}
});
test('configured backup model is catalog-verified, used after primary failure, and archive retains encrypted config',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,calls=[];globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/models'))return Response.json({data:[{id:'primary-fixture'},{id:'backup-fixture'}]});const model=JSON.parse(options.body).model;calls.push(model);return model==='primary-fixture'?new Response('private upstream failure',{status:503}):Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});};
 try{const r=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'primary-fixture',backupModel:'backup-fixture'});assert.equal(r.config.backupModel,'backup-fixture');const result=await generateAI(env,student,{systemPrompt:'S',userPrompt:'U'});assert.equal(result.value.ok,true);assert.deepEqual(calls,['primary-fixture','backup-fixture']);const before=db.prepare("SELECT value FROM ee_config WHERE key GLOB 'sprach:ai:*'").get().value;const archived=await updateAIConfig(env,owner,{id:r.config.id,archived:true});assert.equal(archived.config.enabled,false);assert.equal(db.prepare("SELECT count(*) n FROM ee_config WHERE key GLOB 'sprach:ai:*'").get().n,1);assert.equal(JSON.parse(before).secret,JSON.parse(db.prepare("SELECT value FROM ee_config WHERE key GLOB 'sprach:ai:*'").get().value).secret);await assert.rejects(generateAI(env,student,{systemPrompt:'S',userPrompt:'U'}),e=>e.code==='AI_NOT_CONFIGURED');assert(!JSON.stringify((await listAIConfigs(env,owner))).includes('fixture-key'));
 }finally{db.close();globalThis.fetch=original;}
});
test('backup continuation stays on the signed backup model and rejects configuration changes',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let backupCalls=0;globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/models'))return Response.json({data:[{id:'primary-fixture'},{id:'backup-fixture'},{id:'other-fixture'}]});const model=JSON.parse(options.body).model;if(model==='primary-fixture')return new Response('',{status:503});assert.equal(model,'backup-fixture');return Response.json({choices:[{message:{content:++backupCalls===1?'{"ok":':'true}'},finish_reason:backupCalls===1?'length':'stop'}]});};
 try{const cfg=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'primary-fixture',backupModel:'backup-fixture'}),input={systemPrompt:'S',userPrompt:'U'};const partial=await generateAI(env,student,input);assert.equal(partial.truncated,true);const complete=await generateAI(env,student,{...input,continuation:partial.continuation});assert.equal(complete.value.ok,true);assert.equal(backupCalls,2);await updateAIConfig(env,owner,{id:cfg.config.id,backupModel:'other-fixture'});await assert.rejects(generateAI(env,student,{...input,continuation:partial.continuation}),e=>e.code==='AI_CONFIG_CHANGED');
 }finally{db.close();globalThis.fetch=original;}
});
test('explicit vision support lets one text key handle image tasks while keeping secrets server-side',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;globalThis.fetch=async(url,options)=>{if(String(url).includes('/models?'))return Response.json({models:[{name:'models/vision-fixture',input_modalities:['text','image'],supportedGenerationMethods:['generateContent']}]});const body=JSON.parse(options.body);assert.equal(body.contents[0].parts[1].inlineData.mimeType,'image/png');return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"ok":true}'}]}}]});};
 try{const cfg=await addAIConfig(env,owner,{provider:'gemini',key:'fixture-key',model:'vision-fixture',hasVision:true});assert.equal(cfg.config.task,'text');assert.equal(cfg.config.hasVision,true);const result=await generateAI(env,student,{task:'vision',systemPrompt:'S',userPrompt:'U',attachments:[{mimeType:'image/png',data:'YQ=='}]});assert.equal(result.value.ok,true);}finally{db.close();globalThis.fetch=original;}
});
test('Admin connection diagnostic actually generates JSON and never returns provider errors or raw keys',async()=>{
 const {testAIConfig}=await import('../src/core/elio/ai.js');const {db,env}=fixture(),original=globalThis.fetch;let generations=0;globalThis.fetch=async(url)=>String(url).endsWith('/models')?Response.json(catalog()):(generations++,Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]}));
 try{await assert.rejects(testAIConfig(env,student,{provider:'groq',key:'fixture-key',model:'fresh-model'}),e=>e.status===403);const result=await testAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});assert.equal(result.success,true);assert.equal(result.testedScope,'json-generation');assert.equal(generations,1);assert(!JSON.stringify(result).includes('fixture-key'));globalThis.fetch=async()=>new Response('private-key-in-upstream-error',{status:500});const failure=await testAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});assert.equal(failure.providerStatus,500);assert(!JSON.stringify(failure).includes('private-key'));
 }finally{db.close();globalThis.fetch=original;}
});
test('provider rate limits cool down a model for 30 seconds and expired cooldowns allow retry',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let busy=true,generations=0,catalogs=0;globalThis.fetch=async(url)=>{if(String(url).endsWith('/models')){catalogs++;return Response.json(catalog());}generations++;return busy?new Response('private quota detail',{status:429}):Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});};
 try{await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});await assert.rejects(generateAI(env,student,{systemPrompt:'S',userPrompt:'U'}));const before=catalogs;await assert.rejects(generateAI(env,student,{systemPrompt:'S',userPrompt:'U'}));assert.equal(generations,1);assert.equal(catalogs,before);const metadata=(await listAIConfigs(env,owner)).items[0];assert.equal(metadata.cooldown.status,429);assert(metadata.cooldown.until>Date.now());assert(!JSON.stringify(metadata).includes('private quota detail'));const row=db.prepare("SELECT key,value FROM ee_config WHERE key GLOB 'sprach:ai-cooldown:*'").get(),value=JSON.parse(row.value);value.until=Date.now()-1;db.prepare('UPDATE ee_config SET value=? WHERE key=?').run(JSON.stringify(value),row.key);busy=false;assert.equal((await generateAI(env,student,{systemPrompt:'S',userPrompt:'U'})).value.ok,true);assert.equal(generations,2);
 }finally{db.close();globalThis.fetch=original;}
});

test('Live diagnostics persist safe results and distinguish missing models, quota and prompt-only JSON',async()=>{
 const {testAIConfig}=await import('../src/core/elio/ai.js');
 const {db,env}=fixture(),original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>Response.json(catalog());
  const {config}=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});
  for(const [status,code] of [[401,'authentication'],[403,'forbidden'],[404,'model_not_found'],[429,'rate_limit']]){
   globalThis.fetch=async()=>new Response('upstream secret', {status});
   const result=await testAIConfig(env,owner,{id:config.id});
   assert.equal(result.code,code);
   assert.deepEqual((await listAIConfigs(env,owner)).items[0].testResult,result);
   assert(!JSON.stringify(result).includes('upstream secret'));
  }
  globalThis.fetch=async(url,options)=>String(url).endsWith('/models')?Response.json(catalog()):
   JSON.parse(options.body).response_format?new Response('',{status:400}):Response.json({choices:[{message:{content:'{"ok":true}'}}]});
  const result=await testAIConfig(env,owner,{id:config.id});
  assert.equal(result.code,'prompt_json_only');
  assert.equal(result.jsonMode,false);
  globalThis.fetch=async(url,options)=>String(url).endsWith('/models')?Response.json(catalog()):
   Response.json({choices:[{message:{content:JSON.parse(options.body).response_format?'invalid JSON':'{"ok":true}'}}]});
  assert.equal((await testAIConfig(env,owner,{id:config.id})).code,'prompt_json_only');
 }finally{db.close();globalThis.fetch=original;}
});

test('automatic routing rotates equal priorities and a quota failure skips all models on that key',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,calls=[];
 let limited=false;
 globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/models'))return Response.json({data:[{id:'primary'},{id:'backup'}]});
  const auth=options.headers.Authorization;
  calls.push([auth,JSON.parse(options.body).model]);
  if(limited&&auth==='Bearer key-one')return new Response('',{status:429});
  return Response.json({choices:[{message:{content:'{"ok":true}'}}]});
 };
 try{
  for(const key of ['key-one','key-two'])await addAIConfig(env,owner,{provider:'groq',key,model:'primary',backupModel:'backup',priority:1});
  const input={systemPrompt:'S',userPrompt:'U'};
  await generateAI(env,student,input);
  await generateAI(env,student,input);
  assert.equal(new Set(calls.map(([auth])=>auth)).size,2);
  limited=true;
  calls.length=0;
  await generateAI(env,student,input);
  await generateAI(env,student,input);
  await generateAI(env,student,input);
  assert.deepEqual(calls.filter(([auth])=>auth==='Bearer key-one'),[['Bearer key-one','primary']]);
 }finally{db.close();globalThis.fetch=original;}
});

test('text JSON connection remains successful when configured vision fails, with one shared catalog',async()=>{
 const {testAIConfig}=await import('../src/core/elio/ai.js');
 const {db,env}=fixture(),original=globalThis.fetch;
 let discoveries=0;
 globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/models')){
   discoveries++;
   return Response.json({data:[{id:'fresh-model',architecture:{input_modalities:['text']}}]});
  }
  assert.equal(typeof JSON.parse(options.body).messages[1].content,'string');
  return Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});
 };
 try{
  const {config}=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model',hasVision:true});
  discoveries=0;
  const result=await testAIConfig(env,owner,{id:config.id,vision:true});
  assert.equal(result.success,true);
  assert.equal(result.json,true);
  assert.equal(result.vision,false);
  assert.equal(result.visionStatus,'vision_unsupported');
  assert.equal(discoveries,1);
  assert.deepEqual((await listAIConfigs(env,owner)).items[0].testResult,result);
 }finally{db.close();globalThis.fetch=original;}
});

test('OpenRouter missing routes and billing are not reported as invalid keys or JSON',async()=>{
 const {testAIConfig}=await import('../src/core/elio/ai.js');
 const {db,env}=fixture(),original=globalThis.fetch;
 try{
  for(const [status,message,code] of [
   [404,'No endpoints found supporting your data policy. private-token','no_endpoint'],
   [403,'Privacy and data collection settings block this request. private-token','provider_policy'],
   [402,'Insufficient credits: private-token','payment_required'],
  ]){
   globalThis.fetch=async(url)=>String(url).endsWith('/models')
    ?Response.json({data:[{id:'free-model',pricing:{prompt:'0',completion:'0'}}]})
    :Response.json({error:{message}},{status});
   const result=await testAIConfig(env,owner,{provider:'openrouter',key:'fixture-key',model:'free-model'});
   assert.equal(result.code,code);
   assert.equal(result.providerStatus,status);
   assert(!JSON.stringify(result).includes('private-token'));
   assert(!JSON.stringify(result).includes('fixture-key'));
  }
 }finally{db.close();globalThis.fetch=original;}
});

test('provider response-body timeouts are classified and slow-model budget exceeds fifteen seconds',async()=>{
 const {testAIConfig}=await import('../src/core/elio/ai.js');
 const {db,env}=fixture(),original=globalThis.fetch,originalTimeout=AbortSignal.timeout;
 const budgets=[];
 AbortSignal.timeout=ms=>(budgets.push(ms),originalTimeout(ms));
 globalThis.fetch=async url=>String(url).endsWith('/models')?Response.json(catalog()):{
  ok:true,
  text:async()=>{throw new DOMException('fixture deadline','TimeoutError');},
 };
 try{
  const result=await testAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});
  assert.equal(result.code,'timeout');
  assert(budgets.some(ms=>ms>15000));
 }finally{db.close();globalThis.fetch=original;AbortSignal.timeout=originalTimeout;}
});

test('normal generation retries rejected native JSON once and retains actual JSON output validation',async()=>{
 const original=globalThis.fetch;
 const bodies=[];
 globalThis.fetch=async(url,options)=>{
  const body=JSON.parse(options.body);bodies.push(body);
  return bodies.length===1?Response.json({error:{message:'unsupported format'}},{status:400}):
   Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});
 };
 try{
  const result=await providerGenerate('openrouter','fixture-key',{id:'free-fixture',jsonMode:true},{systemPrompt:'Return JSON',userPrompt:'Confirm',jsonMode:true,freeOnly:true});
  assert.equal(bodies.length,2);
  assert.deepEqual(bodies[0].response_format,{type:'json_object'});
  assert.equal(bodies[1].response_format,undefined);
  assert.equal(bodies[1].provider.max_price.prompt,0);
  assert.equal(result.jsonModeUsed,false);
  assert.equal(JSON.parse(result.text).ok,true);
 }finally{globalThis.fetch=original;}
});
