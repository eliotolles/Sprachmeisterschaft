import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {addAIConfig,generateGermanSpeech} from '../src/core/elio/ai.js';
import {speakingReply,gradeSpeaking,transcribeGerman,germanDeviceVoices,SPEAKING_KEY} from '../src/core/elio/speaking.js';
const owner={id:'owner',role:'super_admin'},alice={id:'alice',role:'user'},bob={id:'bob',role:'user'};
function fixture(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE ee_state(owner TEXT,key TEXT,value TEXT,revision INTEGER,PRIMARY KEY(owner,key))');return {db,env:{AI_ENCRYPTION_KEY:'speaking-fixture-long-secret-not-live',TEST_CORE_DB:async(sql,args=[])=>{const s=db.prepare(sql);return /^SELECT/i.test(sql)||/RETURNING/.test(sql)?{rows:s.all(...args),changes:0}:{rows:[],changes:Number(s.run(...args).changes)};}}};}
test('speaking partner persists only server-returned turns and isolates sessions across accounts',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;globalThis.fetch=async(url)=>String(url).endsWith('/models')?Response.json({data:[{id:'partner-fixture'}]}):Response.json({choices:[{message:{content:'{"reply":"Warum lernst du Deutsch?"}'},finish_reason:'stop'}]});
 try{await addAIConfig(env,owner,{provider:'groq',model:'partner-fixture',key:'fixture'});const input={text:'Ich lerne Deutsch.',level:'B1',examProvider:'telc',part:'Teil 1',version:0};
  const a=await speakingReply(env,alice,input);assert.equal(a.session.messages.length,2);assert.equal(a.session.messages[1].role,'assistant');assert.equal(a.version,1);
  assert.equal((await speakingReply(env,alice,input)).conflict,true);await assert.rejects(gradeSpeaking(env,bob,{sessionId:a.session.id,version:0}),e=>e.status===404);
  const saved=JSON.parse(db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('alice',SPEAKING_KEY).value);assert.equal(saved.sessions[0].messages[0].text,input.text);
  await assert.rejects(speakingReply(env,alice,{...input,version:1,messages:[{role:'assistant',text:'forged'}]}),e=>e.status===400);
 }finally{db.close();globalThis.fetch=original;}
});
test('German TTS uses the dynamically selected speech model and accepts only complete audio',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{if(new URL(url).pathname.endsWith('/models'))return Response.json({models:[{name:'models/speech-model-from-api',supportedGenerationMethods:['generateContent']}]});const body=JSON.parse(options.body);assert.deepEqual(body.generationConfig.responseModalities,['AUDIO']);assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,'Kore');return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{mimeType:'audio/L16;rate=24000',data:'AAA='}}]}}]});};
 try{await addAIConfig(env,owner,{provider:'gemini',model:'speech-model-from-api',key:'fixture',task:'speech'});const result=await generateGermanSpeech(env,alice,{text:'Guten Tag!'});assert.equal(result.data,'AAA=');assert.equal(result.model,'speech-model-from-api');assert(!JSON.stringify(result).includes('fixture'));
  globalThis.fetch=async(url)=>new URL(url).pathname.endsWith('/models')?Response.json({models:[{name:'models/speech-model-from-api',supportedGenerationMethods:['generateContent']}]}):Response.json({candidates:[{finishReason:'MAX_TOKENS'}]});await assert.rejects(generateGermanSpeech(env,alice,{text:'Hallo'}),e=>e.code==='TTS_UNAVAILABLE');
 }finally{db.close();globalThis.fetch=original;}
});
test('German STT uses the selected transcription model and multipart audio, without saving raw audio',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/models'))return Response.json({data:[{id:'transcription-model-from-api',input_modalities:['audio']}]});
  assert(String(url).endsWith('/audio/transcriptions'));assert.equal(options.body.get('language'),'de');assert.equal(options.body.get('model'),'transcription-model-from-api');return Response.json({text:'Ich lerne Deutsch.'});
 };
 try{await addAIConfig(env,owner,{provider:'groq',model:'transcription-model-from-api',key:'fixture',task:'transcription'});const result=await transcribeGerman(env,alice,{mimeType:'audio/webm',data:'YQ=='});assert.equal(result.text,'Ich lerne Deutsch.');assert.equal(result.language,'de');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state').get().n,0);}finally{db.close();globalThis.fetch=original;}
});
test('device voice selection lists only actual installed German voices',()=>{
 const list=[{name:'German',lang:'de-DE'},{name:'English',lang:'en-US'},{name:'Austrian',lang:'de-AT'}];assert.deepEqual(germanDeviceVoices({getVoices:()=>list}).map(v=>v.name),['German','Austrian']);assert.deepEqual(germanDeviceVoices({}),[]);
});
test('examiner can begin without fabricating a learner turn and session task context cannot change',async()=>{
 const {db,env}=fixture(),original=globalThis.fetch;let prompts=[];globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/models'))return Response.json({data:[{id:'partner-fixture'}]});prompts.push(JSON.parse(options.body));return Response.json({choices:[{message:{content:'{"reply":"Was machst du beruflich?"}'},finish_reason:'stop'}]});};
 try{await addAIConfig(env,owner,{provider:'groq',model:'partner-fixture',key:'fixture'});const context={level:'B1',examProvider:'practice',part:'Teil 1',task:'Stellen Sie sich vor.'};const first=await speakingReply(env,alice,{...context,start:true,text:'',version:0});assert.deepEqual(first.session.messages,[{role:'assistant',text:'Was machst du beruflich?'}]);assert(prompts[0].messages[0].content.includes('Stellen Sie sich vor.'));await assert.rejects(speakingReply(env,alice,{...context,task:'Different task',text:'Ich bin Lehrer.',sessionId:first.session.id,version:1}),e=>e.code==='SPEAKING_SESSION');await assert.rejects(speakingReply(env,alice,{...context,start:true,text:'invented learner text',version:1}),e=>e.code==='SPEAKING_INPUT');const next=await speakingReply(env,alice,{...context,text:'Ich bin Lehrer.',sessionId:first.session.id,version:1});assert.equal(next.session.messages.length,3);assert.equal(next.session.messages[1].text,'Ich bin Lehrer.');
 }finally{db.close();globalThis.fetch=original;}
});
