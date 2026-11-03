import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersonalBinding} from '../src/core/elio/personal-binding.js';
function fixture(){
 let user={id:'alice',name:'Alice'},writes=[],records={sprach_profile:{value:{target_level:'A2',custom:'preserve'},version:2},sprach_notes:{value:{custom:'preserve',notes:[{id:'source/note',title:'Old',content:'Private',type:'note',created_at:'2026-01-01',extra:42}]},version:3}};
 const client={getUser:()=>user,loadState:async()=>structuredClone(records),saveState:async(name,value)=>{writes.push({name,value:structuredClone(value)});records[name]={value:structuredClone(value),version:4};}};
 const binding=createPersonalBinding({client,legacy:{},isActive:()=>true,uuid:()=> 'new-note',now:()=> '2026-11-03T00:00:00Z'});
 return {binding,client,writes,setUser:u=>user=u};
}
test('private note CRUD preserves source IDs, timestamps, envelope and unrelated fields',async()=>{
 const {binding:b,writes}=fixture();await b.hydrate();
 await b.api.notes.update('source/note',{title:'Edited',content:'Text',type:'draft'});
 assert.equal(writes[0].value.custom,'preserve');assert.equal(writes[0].value.notes[0].extra,42);assert.equal(writes[0].value.notes[0].created_at,'2026-01-01');
 await Promise.all([b.api.notes.create({title:'New',content:'',type:'note'}),b.api.notes.delete('source/note')]);
 assert.deepEqual(b.api.notes.findMany().map(n=>n.id),['new-note']);assert.equal(writes[2].value.notes.length,1);
 const copy=b.api.notes.findMany();copy[0].title='mutated';assert.equal(b.api.notes.findMany()[0].title,'New');
 await assert.rejects(b.api.notes.update('not-owned',{title:'No',content:'',type:'note'}),{code:'NOTE_NOT_FOUND'});
});
test('failed CAS preserves cache and draft; no retries or success before acknowledgement',async()=>{
 const {binding:b,client,writes}=fixture();await b.hydrate();let finish;
 client.saveState=()=>new Promise((_,reject)=>finish=reject);
 const pending=b.api.notes.update('source/note',{title:'Unsent',content:'Kept',type:'note'});
 await new Promise(r=>setImmediate(r));assert.equal(b.api.notes.findMany()[0].title,'Old');
 finish(Object.assign(Error('Newer device'),{code:'VERSION_CONFLICT'}));await assert.rejects(pending,{code:'VERSION_CONFLICT'});assert.equal(b.api.notes.findMany()[0].title,'Old');assert.equal(writes.length,0);
});
test('account switch clears cache and blocks late load and queued writes',async()=>{
 const {binding:b,client,setUser,writes}=fixture();await b.hydrate();let finish;
 client.loadState=()=>new Promise(resolve=>finish=resolve);const pending=b.hydrate();await new Promise(r=>setImmediate(r));
 const queued=b.api.notes.create({title:'Alice only',content:'secret',type:'note'});
 setUser({id:'bob',name:'Bob'});assert.deepEqual(b.api.notes.findMany(),[]);assert.equal(b.api.learnerProfile.get().display_name,'Bob');
 finish({sprach_notes:{value:[{id:'private-alice'}],version:9}});await assert.rejects(pending,{code:'ACCOUNT_CHANGED'});await assert.rejects(queued,{code:'ACCOUNT_CHANGED'});assert.equal(writes.length,0);assert.deepEqual(b.api.notes.findMany(),[]);
});
test('profile writes preserve unknown fields, validate learning controls, and never accept role/owner',async()=>{
 const {binding:b,writes}=fixture();await b.hydrate();
 const patch={display_name:'Learner',target_level:'B2',exam_date:'2026-12-01',daily_goal:30};
 await b.api.learnerProfile.update(patch);assert.equal(writes[0].value.custom,'preserve');assert.equal(b.api.learnerProfile.get().target_level,'B2');
 await assert.rejects(b.api.learnerProfile.update({...patch,role:'admin'}),{code:'PROFILE_INPUT'});
 await assert.rejects(b.api.learnerProfile.update({...patch,daily_goal:999}),{code:'PROFILE_INPUT'});
});
test('missing state requires successful hydration; malformed notes fail closed and old storage stays untouched',async()=>{
 const {binding:b,client}=fixture();await assert.rejects(b.api.notes.create({title:'First',content:'',type:'note'}),{code:'PERSONAL_NOT_LOADED'});
 client.loadState=async()=>({sprach_notes:{value:[{id:'dup'},{id:'dup'}]}});await assert.rejects(b.hydrate(),{code:'PERSONAL_INVALID'});assert.deepEqual(b.api.notes.findMany(),[]);
 client.loadState=async()=>({});await b.hydrate();assert.equal(b.api.learnerProfile.get().exam_date,'');await b.api.notes.create({title:'First',content:'',type:'note'});assert.equal(b.api.notes.findMany().length,1);
});
test('disabled personal flag delegates legacy storage',async()=>{
 const calls=[];const legacy={learnerProfile:{get:()=>({display_name:'Legacy'}),update:p=>{calls.push(p);return p;}},notes:{findMany:()=>[{id:'legacy'}],create:d=>d,update:(id,d)=>d,delete:()=>true}};
 const b=createPersonalBinding({client:{getUser:()=>null},legacy,isActive:()=>false});await b.hydrate();assert.equal(b.api.learnerProfile.get().display_name,'Legacy');assert.equal(b.api.notes.findMany()[0].id,'legacy');assert.equal(await b.api.notes.delete('legacy'),true);
});
