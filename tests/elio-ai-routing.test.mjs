import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {getAIRouting,updateAIRouting,demotePoolConfig,maybeRestoreDemoted} from '../src/core/elio/ai-routing.js';import {addAIConfig,generateAI} from '../src/core/elio/ai.js';
const admin={id:'owner',role:'super_admin'},user={id:'learner',role:'user'};
function seedRouting(db,routing){db.prepare("INSERT INTO ee_config(key,value) VALUES('sprach:ai-routing',?)").run(JSON.stringify(routing));}
function setRouting(db,routing){db.prepare("UPDATE ee_config SET value=? WHERE key='sprach:ai-routing'").run(JSON.stringify(routing));}
function readRouting(db){return JSON.parse(db.prepare("SELECT value FROM ee_config WHERE key='sprach:ai-routing'").get().value);}
test('quota demote moves the exhausted config to the end of the pool and records when it happened',async()=>{
 const {db,env}=fixture();
 try{seedRouting(db,{rules:{elio_chat:{pool:['a','b','c']}},policies:{}});
  assert.equal(await demotePoolConfig(env,'elio_chat','a'),true);
  let after=readRouting(db);assert.deepEqual(after.rules.elio_chat.pool,['b','c','a']);assert.equal(after.rules.elio_chat.demoted.configId,'a');assert(after.rules.elio_chat.demoted.at<=Date.now()&&after.rules.elio_chat.demoted.at>Date.now()-5000);
  assert.equal(await demotePoolConfig(env,'elio_chat','a'),false);assert.deepEqual(readRouting(db).rules.elio_chat.pool,['b','c','a']);
  assert.equal(await demotePoolConfig(env,'elio_chat','missing'),false);
  assert.equal(await demotePoolConfig(env,'grammar_deep','a'),false);
  assert.equal(await demotePoolConfig(env,'not_a_purpose','a'),false);
  const {db:emptyDb,env:emptyEnv}=fixture();
  try{assert.equal(await demotePoolConfig(emptyEnv,'elio_chat','a'),false);}finally{emptyDb.close();}
 }finally{db.close();}
});
test('demoted config returns to the front after one hour once its cooldown expired',async()=>{
 const {db,env}=fixture();
 try{const old=Date.now()-61*60*1000,recent=Date.now()-30*60*1000;
  seedRouting(db,{rules:{elio_chat:{pool:['b','c','a'],demoted:{configId:'a',at:old}}},policies:{}});
  assert.equal(await maybeRestoreDemoted(env,'elio_chat',new Map()),true);
  let after=readRouting(db);assert.deepEqual(after.rules.elio_chat.pool,['a','b','c']);assert.equal(after.rules.elio_chat.demoted,undefined);
  setRouting(db,{rules:{elio_chat:{pool:['b','c','a'],demoted:{configId:'a',at:recent}}},policies:{}});
  assert.equal(await maybeRestoreDemoted(env,'elio_chat',new Map()),false);assert.deepEqual(readRouting(db).rules.elio_chat.pool,['b','c','a']);assert.equal(readRouting(db).rules.elio_chat.demoted.configId,'a');
  setRouting(db,{rules:{elio_chat:{pool:['b','c','a'],demoted:{configId:'a',at:old}}},policies:{}});
  const cooling=new Map([['sprach:ai-cooldown:a:',{until:Date.now()+600000,status:429}]]);
  assert.equal(await maybeRestoreDemoted(env,'elio_chat',cooling),false);assert.deepEqual(readRouting(db).rules.elio_chat.pool,['b','c','a']);
  const expired=new Map([['sprach:ai-cooldown:a:',{until:Date.now()-1000,status:429}]]);
  assert.equal(await maybeRestoreDemoted(env,'elio_chat',expired),true);assert.deepEqual(readRouting(db).rules.elio_chat.pool,['a','b','c']);
  setRouting(db,{rules:{elio_chat:{pool:['b','c'],demoted:{configId:'a',at:old}}},policies:{}});
  assert.equal(await maybeRestoreDemoted(env,'elio_chat',new Map()),true);assert.deepEqual(readRouting(db).rules.elio_chat.pool,['b','c']);assert.equal(readRouting(db).rules.elio_chat.demoted,undefined);
 }finally{db.close();}
});
function fixture(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT NOT NULL)');return {db,env:{AI_ENCRYPTION_KEY:'routing-fixture-encryption-not-a-live-secret',TEST_CORE_DB:async(sql,args=[])=>{const s=db.prepare(sql);return /^SELECT/.test(sql)||/RETURNING/.test(sql)?{rows:s.all(...args)}:{rows:[],changes:Number(s.run(...args).changes)};}}};}
test('routing is Admin-only, versioned and constrains the actual key fallback pool per engine purpose',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,calls=[];globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/models'))return Response.json({data:[{id:'routing-live-model'}]});calls.push(options.headers.Authorization);return Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});};
 try{const a=await addAIConfig(env,admin,{provider:'groq',key:'fixture-key-a',model:'routing-live-model',priority:1}),b=await addAIConfig(env,admin,{provider:'groq',key:'fixture-key-b',model:'routing-live-model',priority:2});await assert.rejects(getAIRouting(env,user),e=>e.status===403);const route=await updateAIRouting(env,admin,{revision:null,taskId:'elio_chat',pool:[b.config.id]});await generateAI(env,user,{systemPrompt:'S',userPrompt:'U',purpose:'elio_chat'});assert.deepEqual(calls,['Bearer fixture-key-b']);await assert.rejects(updateAIRouting(env,admin,{revision:null,policies:{FREE_ONLY:false}}),e=>e.code==='AI_ROUTING_CONFLICT');const policies=await updateAIRouting(env,admin,{revision:route.revision,policies:{FREE_ONLY:false,ALLOW_PAID_MODELS:true}});assert.deepEqual(policies.rules.elio_chat.pool,[b.config.id]);await assert.rejects(updateAIRouting(env,admin,{revision:policies.revision,taskId:'elio_chat',pool:['missing-config']}),e=>e.code==='AI_POOL');assert.deepEqual((await getAIRouting(env,admin)).rules.elio_chat.pool,[b.config.id]);assert.equal(db.prepare("SELECT count(*) n FROM ee_config WHERE key GLOB 'sprach:ai:*'").get().n,2);assert(a.config.id!==b.config.id);
 }finally{db.close();globalThis.fetch=original;}
});
test('paid fallback is never automatic unless the stored Admin policy explicitly enables it',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,calls=[];globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/models'))return Response.json({data:[{id:'free-primary',pricing:{prompt:'0',completion:'0'}},{id:'paid-backup',pricing:{prompt:'1',completion:'1'}}]});const model=JSON.parse(options.body).model;calls.push(model);return model==='free-primary'?new Response('',{status:503}):Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});};
 try{let routing=await updateAIRouting(env,admin,{revision:null,policies:{FREE_ONLY:false,ALLOW_PAID_MODELS:true}});await addAIConfig(env,admin,{provider:'openrouter',key:'fixture-key',model:'free-primary',backupModel:'paid-backup',freeOnly:false});await assert.rejects(generateAI(env,user,{systemPrompt:'S',userPrompt:'U'}),e=>e.code==='AI_UNAVAILABLE');assert.deepEqual(calls,['free-primary']);calls.length=0;await assert.rejects(generateAI(env,user,{systemPrompt:'S',userPrompt:'U'}));assert.deepEqual(calls,[]);routing=await updateAIRouting(env,admin,{revision:routing.revision,policies:{AUTO_PAID_FALLBACK:true}});calls.length=0;assert.equal((await generateAI(env,user,{systemPrompt:'S',userPrompt:'U'})).value.ok,true);assert.deepEqual(calls,['paid-backup']);await updateAIRouting(env,admin,{revision:routing.revision,policies:{FREE_ONLY:true}});calls.length=0;await assert.rejects(generateAI(env,user,{systemPrompt:'S',userPrompt:'U'}));assert.deepEqual(calls,[]);
 }finally{db.close();globalThis.fetch=original;}
});
