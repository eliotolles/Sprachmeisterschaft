import test from 'node:test';import assert from 'node:assert/strict';import {projectProgress,progressStreak,createProgressBinding} from '../src/core/elio/progress-binding.js';import {createElioClient} from '../src/core/elio/client.js';
const time=new Date('2026-11-03T12:00:00').getTime(),row=value=>({value,version:1});
test('progress derives only persisted grades and actual focus duration; never fabricates XP or practice minutes',()=>{
 const data=projectProgress({
 sprach_vocabulary_reviews:row({history:[{time},{time}],cards:{}}),
 sprach_grammar_attempts:row({attempts:[{correct:true,time,exerciseId:'e'}]}),
 sprach_writing_results:row({results:[{id:'w',time,feedback:{total:16}}]}),
 sprach_speaking_results:row({sessions:[{id:'ungraded',messages:[]},{id:'s',feedback:{total:12}}]}),
 sprach_listening_results:row({attempts:[{id:'l',at:time,score:75}]}),
 sprach_core_focus_sessions:row({sessions:[{status:'completed',phase:'focus',durationMs:1500000,completedAt:time},{status:'cancelled',phase:'focus',durationMs:1500000,completedAt:time}]}),
 sprach_notes:row([{id:'note',content:'Private note must not enter projection'}])
 },[{id:'exam',recordId:'r',status:'submitted',percent:100,submittedAt:time}]);
 assert.equal(data.logs.length,1);assert.equal(data.logs[0].cards_reviewed,2);assert.equal(data.logs[0].xp,0);assert.equal(data.logs[0].minutes,25);assert.equal(data.sessions.length,4);assert.equal(data.sessions.find(s=>s.id==='w').score,80);assert.equal(data.sessions.find(s=>s.id==='s').created_at,'');assert(data.sessions.every(s=>s.duration_seconds===0));assert(!JSON.stringify(data).includes('Private note'));assert.equal(data.exams[0].officialScore,false);assert.equal(progressStreak(data.logs,'2026-11-03'),1);
});
test('malformed history and null grades fail closed instead of becoming fabricated zeros',()=>{
 assert.throws(()=>projectProgress({sprach_writing_results:row({results:[{id:'w',feedback:{total:null}}]})},[]));
 assert.throws(()=>projectProgress({sprach_grammar_attempts:row({attempts:{}})},[]));
 assert.throws(()=>projectProgress({sprach_core_focus_sessions:row({sessions:[{status:'completed',phase:'focus',durationMs:-1,completedAt:time}]})},[]));
 assert.equal(progressStreak([{date:'2026-11-01',activity_count:1}], '2026-11-03'),0);
});
test('progress discards late responses after an account change or a newer load',async()=>{
 let user={id:'a'},resolve;const b=createProgressBinding({isActive:()=>true,client:{getUser:()=>user,stateSnapshot:()=>new Promise(r=>resolve=r),examAttempts:async()=>({userId:'a',attempts:[]})}});
 const pending=b.load();user={id:'b'};resolve({});await assert.rejects(pending,e=>e.code==='ACCOUNT_CHANGED');
 user={id:'a'};const next=b.load();b.reset();resolve({});await assert.rejects(next,e=>e.code==='ACCOUNT_CHANGED');
});
test('read-only progress snapshots do not rewind the revision used by pending journal writes',async()=>{
 let gets=0,putVersion;const user={id:'a',email:'fixture@example.invalid',role:'user'};const client=createElioClient({fetcher:async(url,options)=>{
 if(url.endsWith('/auth/login'))return Response.json({user});
 if(options.method==='GET')return Response.json({userId:'a',records:{sprach_notes:{value:[],version:++gets===1?5:1}}});
 const data=JSON.parse(options.body);putVersion=data.version;return Response.json({userId:'a',version:6});
 }});await client.login(user.email,'fixture-password');await client.loadState(['sprach_notes']);await client.stateSnapshot(['sprach_notes']);await client.saveState('sprach_notes',[]);assert.equal(putVersion,5);
});

test('account changes while JSON is decoding invalidate a read-only snapshot before returning data',async()=>{
 let resolveJSON;const a={id:'a',email:'a@example.invalid',role:'user'},b={id:'b',email:'b@example.invalid',role:'user'};
 const client=createElioClient({fetcher:async(url,options)=>url.endsWith('/auth/login')?Response.json({user:JSON.parse(options.body).email===a.email?a:b}):{ok:true,json:()=>new Promise(r=>resolveJSON=r)}});
 await client.login(a.email,'fixture-password');const pending=client.stateSnapshot(['sprach_notes']);await new Promise(r=>setTimeout(r,0));await client.login(b.email,'fixture-password');resolveJSON({userId:'a',records:{}});await assert.rejects(pending,e=>e.code==='ACCOUNT_CHANGED');assert.equal(client.getUser().id,'b');
});
