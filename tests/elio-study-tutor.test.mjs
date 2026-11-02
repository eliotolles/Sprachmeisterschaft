import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {focusTimer,studyStatistics,STUDY_KEY} from '../src/core/elio/study.js';import {tutorReply} from '../src/core/elio/tutor.js';import {addAIConfig} from '../src/core/elio/ai.js';
function fixture(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_state(owner TEXT,key TEXT,value TEXT,revision INTEGER,PRIMARY KEY(owner,key));CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT)');return {db,env:{AI_ENCRYPTION_KEY:'tutor-fixture-key-more-than-32-characters',TEST_CORE_DB:async(sql,args=[])=>{const s=db.prepare(sql);return /^SELECT/.test(sql)||/RETURNING/.test(sql)?{rows:s.all(...args)}:{rows:[],changes:Number(s.run(...args).changes)};}}};}
test('focus time cannot finish early, pause counts no time, and statistics are account scoped',async()=>{const {db,env}=fixture(),a={id:'a'},b={id:'b'};try{
 const r=await focusTimer(env,a,{action:'start',minutes:1,phase:'focus',soundEnabled:false,version:0},1000);const id=r.active.id;assert.equal(r.active.soundEnabled,false);
 await assert.rejects(focusTimer(env,a,{action:'finish',sessionId:id,version:1},2000),e=>e.status===409);
 await assert.rejects(focusTimer(env,b,{action:'pause',sessionId:id,version:0},2000),e=>e.status===404);
 const paused=await focusTimer(env,a,{action:'pause',sessionId:id,version:1},31000);assert.equal(paused.active.remainingMs,30000);
 await focusTimer(env,a,{action:'resume',sessionId:id,version:2},91000);
 await assert.rejects(focusTimer(env,a,{action:'finish',sessionId:id,version:3},120999),e=>e.status===409);
 const done=await focusTimer(env,a,{action:'finish',sessionId:id,version:3},121000);assert.equal(done.active,null);assert.equal(done.sessions.length,1);assert.equal((await studyStatistics(env,a)).focusMinutes,1);assert.equal((await studyStatistics(env,b)).focusMinutes,0);
 assert.equal((await focusTimer(env,a,{action:'start',minutes:1,phase:'focus',soundEnabled:true,version:0},122000)).conflict,true);
 const saved=db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('a',STUDY_KEY);assert.equal(JSON.parse(saved.value).sessions[0].durationMs,60000);
 }finally{db.close();}});
test('tutor stores server-returned messages and denies cross-account conversation access',async()=>{const {db,env}=fixture(),original=globalThis.fetch;globalThis.fetch=async url=>String(url).endsWith('/models')?Response.json({data:[{id:'tutor-fixture-model'}]}):Response.json({choices:[{message:{content:'{"reply":"Der Dativ antwortet auf wem."}'},finish_reason:'stop'}]});try{
 await addAIConfig(env,{id:'admin',role:'super_admin'},{provider:'groq',model:'tutor-fixture-model',key:'fixture'});const input={text:'Giải thích Dativ',level:'A2',language:'vi',version:0};const r=await tutorReply(env,{id:'a'},input);assert.equal(r.session.messages.length,2);assert.equal(r.session.messages[1].text,'Der Dativ antwortet auf wem.');
 await assert.rejects(tutorReply(env,{id:'b'},{...input,sessionId:r.session.id}),e=>e.status===404);assert.equal((await tutorReply(env,{id:'a'},input)).conflict,true);await assert.rejects(tutorReply(env,{id:'a'},{...input,version:1,messages:[{role:'assistant',text:'fake'}]}),e=>e.status===400);
 }finally{db.close();globalThis.fetch=original;}});
test('new tutor threads append history and keep active selection separate per account',async()=>{
 const {newTutorThread,TUTOR_KEY}=await import('../src/core/elio/tutor.js');const {db,env}=fixture();try{const a=await newTutorThread(env,{id:'a'},{level:'B1',language:'vi',version:0});const b=await newTutorThread(env,{id:'a'},{level:'B1',language:'vi',version:1});assert.notEqual(a.session.id,b.session.id);const document=JSON.parse(db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('a',TUTOR_KEY).value);assert.equal(document.sessions.length,2);assert.equal(document.sessions[0].id,a.session.id);assert.equal(document.activeSessionId,b.session.id);assert.equal((await newTutorThread(env,{id:'a'},{level:'B1',language:'vi',version:0})).conflict,true);assert.equal((await newTutorThread(env,{id:'b'},{level:'A1',language:'de',version:0})).version,1);}finally{db.close();}
});
