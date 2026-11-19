import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {addAIConfig,updateAIConfig,listAIConfigs,runAIHealthCheck} from '../src/core/elio/ai.js';
const owner={id:'owner',role:'super_admin'},student={id:'student',role:'user'};
function fixture(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
 const env={AI_ENCRYPTION_KEY:'only-a-long-test-fixture-not-a-live-secret',TEST_CORE_DB:async(sql,args=[])=>{const s=db.prepare(sql);if(/^SELECT/i.test(sql)||/RETURNING/.test(sql))return {rows:s.all(...args),changes:0};return {rows:[],changes:Number(s.run(...args).changes)};}};return {db,env};}
function readConfig(db,id){return JSON.parse(db.prepare('SELECT value FROM ee_config WHERE key=?').get('sprach:ai:'+id).value);}
function readHealth(db,id){const row=db.prepare('SELECT value FROM ee_config WHERE key=?').get('sprach:ai-health:'+id);return row?JSON.parse(row.value):null;}
// Mock fetch: /models trả catalog hiện tại, còn generate thì thành công hay
// 429 tùy cờ failGenerate. Đếm số lần generate để biết config nào bị thử.
function mockFetch(state){return async(url)=>{
  if(String(url).endsWith('/models'))return Response.json({data:state.catalog.map(id=>({id}))});
  state.generations++;
  return state.failGenerate?new Response('private quota detail',{status:429}):Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});
};}
test('main model failing three times in a row auto-disables, then re-enables when healthy again',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,state={catalog:['fresh-model'],failGenerate:true,generations:0};
 globalThis.fetch=mockFetch(state);
 try{
  const {config}=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});
  let summary=await runAIHealthCheck(env);
  assert.equal(summary.checked,1);assert.deepEqual(summary.disabled,[]);assert.equal(readConfig(db,config.id).enabled,true);assert.equal(readHealth(db,config.id).failures,1);
  state.failGenerate=false;summary=await runAIHealthCheck(env);
  assert.equal(readHealth(db,config.id).failures,0);assert.equal(readConfig(db,config.id).enabled,true);
  state.failGenerate=true;
  await runAIHealthCheck(env);await runAIHealthCheck(env);
  assert.equal(readHealth(db,config.id).failures,2);assert.equal(readConfig(db,config.id).enabled,true);
  summary=await runAIHealthCheck(env);
  assert.deepEqual(summary.disabled,[config.id]);assert.equal(readConfig(db,config.id).enabled,false);
  const health=readHealth(db,config.id);assert.equal(health.failures,3);assert(Number.isFinite(health.autoDisabledAt));assert.equal(health.lastCode,'rate_limit');
  // Config đang bị tự tắt vẫn được thử ở lần kiểm tra sau.
  const before=state.generations;summary=await runAIHealthCheck(env);
  assert.equal(summary.checked,1);assert(state.generations>before);assert.equal(readHealth(db,config.id).failures,4);assert.equal(readConfig(db,config.id).enabled,false);
  state.failGenerate=false;summary=await runAIHealthCheck(env);
  assert.deepEqual(summary.reEnabled,[config.id]);assert.equal(readConfig(db,config.id).enabled,true);
  const healed=readHealth(db,config.id);assert.equal(healed.failures,0);assert.equal(healed.autoDisabledAt,undefined);
 }finally{db.close();globalThis.fetch=original;}
});
test('a dead backup alone never disables the config',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,state={catalog:['fresh-model','backup-fixture'],failGenerate:false,generations:0};
 globalThis.fetch=mockFetch(state);
 try{
  const {config}=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model',backupModel:'backup-fixture'});
  // Từ giờ catalog không còn backup nữa: backup thử ra model_not_found.
  state.catalog=['fresh-model'];
  for(let i=0;i<3;i++){const summary=await runAIHealthCheck(env);assert.equal(summary.checked,1);assert.deepEqual(summary.disabled,[]);}
  assert.equal(readConfig(db,config.id).enabled,true);assert.equal(readHealth(db,config.id).failures,0);
  assert.equal(readConfig(db,config.id).testResult.success,true);assert.equal(readConfig(db,config.id).backupTestResult.code,'model_not_found');
 }finally{db.close();globalThis.fetch=original;}
});
test('a config disabled by hand is never probed and never re-enabled by the check',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,state={catalog:['fresh-model'],failGenerate:false,generations:0};
 globalThis.fetch=mockFetch(state);
 try{
  const {config}=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fresh-model'});
  await updateAIConfig(env,owner,{id:config.id,enabled:false});
  const summary=await runAIHealthCheck(env);
  assert.equal(summary.checked,0);assert.equal(state.generations,0);assert.equal(readConfig(db,config.id).enabled,false);assert.equal(readHealth(db,config.id),null);
 }finally{db.close();globalThis.fetch=original;}
});
test('health check probes enabled configs in small batches and saves the same test results as the manual test',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch,state={catalog:['fresh-model'],failGenerate:false,generations:0};
 globalThis.fetch=mockFetch(state);
 try{
  const ids=[];
  for(let i=0;i<5;i++){const {config}=await addAIConfig(env,owner,{provider:'groq',key:'fixture-key-'+i,model:'fresh-model'});ids.push(config.id);}
  const summary=await runAIHealthCheck(env);
  assert.equal(summary.checked,5);assert.equal(state.generations,5);assert.deepEqual(summary.failed,[]);
  for(const id of ids){const row=readConfig(db,id);assert.equal(row.testResult.success,true);assert.equal(row.testResult.testedScope,'json-generation');assert(Number.isFinite(row.testResult.checkedAt));assert.equal(readHealth(db,id).failures,0);}
  assert.equal((await listAIConfigs(env,owner)).items.length,5);
 }finally{db.close();globalThis.fetch=original;}
});
