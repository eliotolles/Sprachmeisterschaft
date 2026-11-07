import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {readEditableRecord,editRecord} from '../src/core/elio/record-editing.js';import {deleteRecord} from '../src/core/elio/record-deletion.js';
function fixture(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_records(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,title TEXT,level TEXT,public INTEGER,data TEXT,updated_at TEXT)');const data={id:'source',name:'Original',organizerId:'folder',words:[{id:'word',de:'Haus',vi:'nhà',level:'A1',synonyms:'Heim',chunks:'zu Hause'}]};db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?,?,?,?)').run('r','alice','vocab','Original','A1',0,JSON.stringify(data),'now');return {db,env:{TEST_CORE_DB:async(sql,args=[])=>({rows:db.prepare(sql).all(...args)})}};}
const alice={id:'alice',role:'user'},bob={id:'bob',role:'user'},admin={id:'admin',role:'admin'};
test('content owner edits preserve original IDs, organizer and lexical fields; stale writes fail',async()=>{const {db,env}=fixture();try{const original=await readEditableRecord(env,alice,'r');const words=JSON.parse(original.record.data).words;words[0].vi='căn nhà';await editRecord(env,alice,{recordId:'r',revision:original.revision,title:'Edited',items:words});const data=JSON.parse(db.prepare('SELECT data FROM ee_records').get().data);assert.equal(data.organizerId,'folder');assert.equal(data.words[0].synonyms,'Heim');assert.equal(data.words[0].chunks,'zu Hause');assert.equal(data.words[0].id,'word');await assert.rejects(editRecord(env,alice,{recordId:'r',revision:original.revision,title:'Stale',items:words}),e=>e.status===409);await assert.rejects(deleteRecord(env,alice,{recordId:'r',revision:original.revision}),e=>e.status===409);}finally{db.close();}});
test('user cannot edit or delete others; admin edits common content without reading private content',async()=>{const {db,env}=fixture();try{await assert.rejects(readEditableRecord(env,bob,'r'),e=>e.status===403);await assert.rejects(readEditableRecord(env,admin,'r'),e=>e.status===403);await assert.rejects(deleteRecord(env,bob,{recordId:'r'}),e=>e.status===403);await assert.rejects(deleteRecord(env,admin,{recordId:'r'}),e=>e.status===403);db.exec('UPDATE ee_records SET public=1');assert.equal((await readEditableRecord(env,admin,'r')).record.id,'r');assert.equal((await deleteRecord(env,admin,{recordId:'r'})).deleted,true);}finally{db.close();}});
test('unsafe ID changes and invalid source payloads do not overwrite content',async()=>{const {db,env}=fixture();try{const original=await readEditableRecord(env,alice,'r');await assert.rejects(editRecord(env,alice,{recordId:'r',revision:original.revision,title:'Bad',items:[{id:'changed',de:'x',vi:'y',level:'A1'}]}),e=>e.code==='RECORD_IDS');assert.equal(db.prepare('SELECT data FROM ee_records').get().data,original.record.data);}finally{db.close();}});
test('all imported skill kinds support validated edits and confirmed deletes',async()=>{
 const {db,env}=fixture();try{
 const samples={
 grammar:{id:'g',name:'G',items:[{id:'g1',title:'G',level:'A1',content:'Regel',exercises:[]}]},
 reading:{id:'r',name:'R',items:[{id:'r1',title:'R',level:'A1',content:'Text'}]},
 writing:{id:'w',name:'W',items:[{id:'w1',title:'W',level:'A1',content:'Brief'}]},
 speaking:{id:'s',name:'S',items:[{id:'s1',title:'S',level:'A1',content:'Sprechen'}]},
 situation:{id:'d',name:'D',items:[{id:'d1',title:'D',level:'A1',content:'Dialog'}]},
 listening:{id:'l',name:'L',items:[{id:'l1',title:'L',level:'A1',url:'https://youtube.com/watch?v=abcdefghijk',cues:[{start:0,end:1,text:'Hallo'}]}]},
 exam:{id:'e',name:'E',items:[{id:'e1',title:'E',level:'B1',skill:'writing',exam:'telc',content:'Brief'}]}
 };
 for(const [kind,data] of Object.entries(samples)){
 db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?,?,?,?)').run(kind,'alice',kind,kind,'A1',0,JSON.stringify(data),'now');
 const original=await readEditableRecord(env,alice,kind);
 await editRecord(env,alice,{recordId:kind,revision:original.revision,title:'Edited '+kind,items:data.items});
 const updated=await readEditableRecord(env,alice,kind);
 assert.equal(updated.record.title,'Edited '+kind);
 assert.equal((await deleteRecord(env,alice,{recordId:kind,revision:updated.revision})).deleted,true);
 }
 }finally{db.close();}
});
