import test from 'node:test';import assert from 'node:assert/strict';import {createTutorBinding} from '../src/core/elio/tutor-binding.js';
test('tutor UI uses private server turns, keeps more than 20 messages and starts a fresh retained thread',async()=>{
 let id='alice';const calls=[],saved={id:'thread',level:'B1',language:'vi',messages:Array.from({length:42},(_,i)=>({role:i%2?'assistant':'user',text:'turn-'+i}))};
 const client={getUser:()=>({id}),loadState:async()=>({sprach_core_tutor_sessions:{value:{sessions:id==='alice'?[saved]:[],activeSessionId:'thread'},version:1}}),tutorReply:async data=>{calls.push(data);return {session:{...saved,messages:[...saved.messages,{role:'user',text:data.text},{role:'assistant',text:'Server answer'}]}};},newTutorThread:async data=>({session:{id:'new-thread',...data,messages:[]}})};
 const binding=createTutorBinding({client,isActive:()=>true});assert.equal((await binding.load()).length,42);const result=await binding.reply('Neue Frage','B1');assert.equal(result.length,44);assert.equal(result.at(-1).content,'Server answer');assert.deepEqual(Object.keys(calls[0]).sort(),['language','level','sessionId','text']);assert.equal(calls[0].sessionId,'thread');assert.deepEqual(await binding.startNew('B1'),[]);assert.equal(saved.messages.length,42);
 id='bob';assert.deepEqual(await binding.load(),[]);
});
test('late tutor response cannot cross accounts',async()=>{
 let id='alice',resolve;const client={getUser:()=>({id}),loadState:async()=>({}),tutorReply:()=>new Promise(r=>resolve=r)};const binding=createTutorBinding({client,isActive:()=>true});await binding.load();const pending=binding.reply('A','A1');id='bob';resolve({session:{id:'a',messages:[{role:'assistant',text:'private-alice'}]}});await assert.rejects(pending,e=>e.code==='ACCOUNT_CHANGED');assert.deepEqual(await binding.load(),[]);
});
