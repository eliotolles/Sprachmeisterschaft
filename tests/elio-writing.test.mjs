import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {CRITERIA,validateFeedback,validateFeedbackTranslation} from '../src/core/elio/feedback.js';
import {addAIConfig} from '../src/core/elio/ai.js';import {gradeWriting,translateWriting,WRITING_KEY} from '../src/core/elio/writing.js';
const owner={id:'owner',role:'super_admin'},alice={id:'alice',role:'user'},bob={id:'bob',role:'user'};
const text='Ich lerne Deutsch.';
function feedback(){return {scores:Object.fromEntries(CRITERIA.map(k=>[k,{score:3,comment:'Evidence from the response.',improve:'Add more detail.'}])),summary:'A short response.',formatReview:[],examReview:[],priorities:['Add detail'],writingPlan:[{title:'Plan',explanation:'Develop your idea.',examples:['Ich lerne jeden Tag.']}],errors:[],sentences:[{original:text,comment:'Valid sentence.',corrected:text,status:'good',alternatives:[{de:'Ich übe Deutsch.',usage:'Alternative'}]}],corrected:text,model:'Ich lerne jeden Tag Deutsch.',alternatives:[]};}
function fixture(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE ee_state(owner TEXT,key TEXT,value TEXT,revision INTEGER,PRIMARY KEY(owner,key))');
 const env={AI_ENCRYPTION_KEY:'long-isolated-fixture-not-a-provider-secret',TEST_CORE_DB:async(sql,args=[])=>{const s=db.prepare(sql);if(/^SELECT/i.test(sql)||/RETURNING/.test(sql))return {rows:s.all(...args),changes:0};return {rows:[],changes:Number(s.run(...args).changes)};}};return {db,env};}
const input=()=>({task:'Write about learning German.',text,level:'B1',examProvider:'telc',language:'en',version:0});
const models=()=>Response.json({data:[{id:'fixture-model'}]});
async function configure(env){await addAIConfig(env,owner,{provider:'groq',key:'fixture-key',model:'fixture-model'});}
test('DetailedFeedback validates four evidence-based practice criteria and calculates /20 on server',()=>{
 const result=validateFeedback(feedback(),text);assert.equal(result.total,12);assert.equal(result.maxTotal,20);assert.equal(result.officialScore,false);assert.equal(result.wordCount,3);
 const bad=feedback();bad.scores.Strukturen.score=99;assert.throws(()=>validateFeedback(bad,text));
 const missing=feedback();missing.sentences=[];assert.throws(()=>validateFeedback(missing,text));
 assert.throws(()=>validateFeedback(feedback(),text+' Eine weitere Aussage.'));
});
test('error explanations require exact learner quotes, corrections, rules and prevention',()=>{
 const f=feedback();f.errors=[{category:'grammar',location:'sentence 1',original:'lerne',correction:'lerne',reason:'Illustrative source rule',avoid:'Check the subject.',alternatives:[]}];
 const result=validateFeedback(f,text);assert.deepEqual(result.errors[0].spans,[{start:4,end:9}]);
 f.errors[0].original='invented text';assert.throws(()=>validateFeedback(f,text));
});
test('writing result is provider-backed, account-scoped and survives another reader without modifying source text',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;globalThis.fetch=async(url)=>String(url).endsWith('/models')?models():Response.json({choices:[{message:{content:JSON.stringify(feedback())},finish_reason:'stop'}]});
 try{await configure(env);const result=await gradeWriting(env,alice,input());assert.equal(result.result.feedback.total,12);assert.equal(result.result.text,text);assert.equal(result.version,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state WHERE owner=?').get('bob').n,0);
  const saved=JSON.parse(db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('alice',WRITING_KEY).value);assert.equal(saved.results[0].id,result.result.id);
 }finally{db.close();globalThis.fetch=original;}
});
test('stale versions are rejected before another paid/free provider request and bad outputs never create fake scores',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url)=>String(url).endsWith('/models')?models():(calls++,Response.json({choices:[{message:{content:JSON.stringify(feedback())},finish_reason:'stop'}]}));
 try{await configure(env);await gradeWriting(env,alice,input());assert.equal((await gradeWriting(env,alice,input())).conflict,true);assert.equal(calls,1);
  globalThis.fetch=async(url)=>String(url).endsWith('/models')?models():Response.json({choices:[{message:{content:'{"scores":{}}'},finish_reason:'stop'}]});
  await assert.rejects(gradeWriting(env,bob,input()),e=>e.code==='AI_UNAVAILABLE');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state WHERE owner=?').get('bob').n,0);
 }finally{db.close();globalThis.fetch=original;}
});
test('truncated grading preserves all received content and stores only the complete validated feedback',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;const output=JSON.stringify(feedback()),prefix=output.slice(0,60);let calls=0;
 globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/models'))return models();calls++;if(calls===1)return Response.json({choices:[{message:{content:prefix},finish_reason:'length'}]});assert.equal(JSON.parse(options.body).messages[2].content,prefix);return Response.json({choices:[{message:{content:output.slice(60)},finish_reason:'stop'}]});};
 try{await configure(env);const partial=await gradeWriting(env,alice,input());assert.equal(partial.partial,true);assert.equal(partial.text,prefix);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state').get().n,0);
  const complete=await gradeWriting(env,alice,{...input(),continuation:partial.continuation});assert.equal(complete.result.feedback.total,12);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state').get().n,1);
 }finally{db.close();globalThis.fetch=original;}
});
test('Vietnamese translation preserves original scores, German text and the original saved feedback',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let translated=false;const source=feedback(),vi=feedback();vi.summary='Một câu trả lời ngắn.';vi.sentences[0].comment='Câu này đúng.';
 globalThis.fetch=async(url)=>String(url).endsWith('/models')?models():Response.json({choices:[{message:{content:JSON.stringify(translated?vi:source)},finish_reason:'stop'}]});
 try{await configure(env);const graded=await gradeWriting(env,alice,input());translated=true;
  const result=await translateWriting(env,alice,{resultId:graded.result.id,language:'vi',version:1});assert.equal(result.feedback.summary,vi.summary);assert.equal(result.version,2);
  const saved=JSON.parse(db.prepare('SELECT value FROM ee_state WHERE owner=?').get('alice').value);assert.equal(saved.results[0].feedback.summary,source.summary);assert.equal(saved.results[0].translations.vi.summary,vi.summary);
  await assert.rejects(translateWriting(env,bob,{resultId:graded.result.id,language:'vi',version:0}),e=>e.status===404);
  const changed=feedback();changed.model='Changed German answer';assert.throws(()=>validateFeedbackTranslation(changed,source,text));
 }finally{db.close();globalThis.fetch=original;}
});
