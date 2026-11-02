import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {getTranscript,submitDictation,LISTENING_KEY} from '../src/core/elio/listening.js';
import {ListeningV2Core as core} from '../src/core/elio/listening-content.js';
test('source dictation algorithm preserves umlauts, strict case, insertions and cue boundaries',()=>{
 assert.equal(core.compare('Grün ist schön!','grün ist schön').exact,true);assert.equal(core.compare('grun','grün').exact,false);assert.equal(core.compare('Hallo','hallo',true).exact,false);
 assert.equal(core.compare('Ich lerne','Ich lerne Deutsch').ops.at(-1).type,'missing');assert.equal(core.cueAt([{start:0,end:1},{start:2,end:3}],1),-1);assert.equal(core.cueAt([{start:0,end:1}],0),0);
 assert.equal(core.id('https://evil.example/watch?v=abcdefghijk'),null);
});
test('transcripts fail closed when unconfigured and reject wrong video, language or leaked errors',async()=>{
 assert.equal((await getTranscript({}, {videoId:'abcdefghijk'})).code,'CAPTIONS_NOT_CONFIGURED');
 const result=async data=>getTranscript({TRANSCRIPT_NATIVE_FETCH:async()=>Response.json(data)},{videoId:'abcdefghijk'});
 assert.equal((await result({available:false,reason:'private-token',code:'secret'})).reason.includes('private-token'),false);
 const valid={available:true,videoId:'abcdefghijk',timeUnit:'seconds',language:'de',cues:[{start:0,end:1,text:'Hallo'}]};assert.equal((await result(valid)).available,true);
 for(const bad of [{...valid,videoId:'bbbbbbbbbbb'},{...valid,language:'en'},{...valid,timeUnit:'ms'},{...valid,cues:[{start:1,end:0,text:'Hallo'}]}])assert.equal((await result(bad)).available,false);
});
test('dictation resolves stored captions, rejects other accounts, and uses optimistic history',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_records(id TEXT,kind TEXT,owner TEXT,public INTEGER,data TEXT);CREATE TABLE ee_state(owner TEXT,key TEXT,value TEXT,revision INTEGER,PRIMARY KEY(owner,key))');
 db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?)').run('lesson','listening','alice',0,JSON.stringify({cues:[{text:'Ich lerne Deutsch.'}]}));
 const env={TEST_CORE_DB:async(sql,args)=>{const s=db.prepare(sql);return /^SELECT/.test(sql)||/RETURNING/.test(sql)?{rows:s.all(...args)}:{rows:[],changes:Number(s.run(...args).changes)};}};
 try{const input={recordId:'lesson',cueIndex:0,answer:'Ich lerne Deutsch',expected:'forged',version:0};
 await assert.rejects(submitDictation(env,{id:'bob'},input),e=>e.status===404);
 const result=await submitDictation(env,{id:'alice'},input);assert.equal(result.attempt.score,100);assert.equal(result.attempt.expected,'Ich lerne Deutsch.');assert.equal(result.version,1);
 assert.equal((await submitDictation(env,{id:'alice'},input)).conflict,true);assert.equal(db.prepare('SELECT count(*) n FROM ee_state WHERE key=?').get(LISTENING_KEY).n,1);
 }finally{db.close();}
});
