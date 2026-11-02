import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {validateImport,importCollection,extractDocument} from '../src/core/elio/importer.js';
const collection={id:'original-pack',name:'Wörter',items:[{id:'original-word-id',level:'A1',de:'grün',vi:'xanh'}]};
test('structured import validates required fields, duplicate IDs and unsafe media URLs',()=>{
 assert.equal(validateImport('vocab',collection),collection);for(const c of [{...collection,items:[...collection.items,...collection.items]},{...collection,items:[{...collection.items[0],de:''}]}])assert.throws(()=>validateImport('vocab',c));
 assert.throws(()=>validateImport('listening',{...collection,items:[{id:'l',level:'A1',title:'Hören',url:'http://example.com'}]}));
});
test('imports preserve IDs, isolate owners, restrict shared writes and never overwrite records',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_records(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,title TEXT,level TEXT,public INTEGER,data TEXT,updated_at TEXT)');const env={TEST_CORE_DB:async(sql,args)=>{const s=db.prepare(sql);return /^SELECT/.test(sql)||/RETURNING/.test(sql)?{rows:s.all(...args)}:{rows:[],changes:Number(s.run(...args).changes)};}};
 try{await assert.rejects(importCollection(env,{id:'a',role:'user'},{kind:'vocab',collection,visibility:'public'}),e=>e.status===403);
 const a=await importCollection(env,{id:'a',role:'user'},{kind:'vocab',collection});const row=db.prepare('SELECT * FROM ee_records WHERE id=?').get(a.recordId);assert.equal(row.public,0);assert.equal(JSON.parse(row.data).words[0].id,'original-word-id');
 await assert.rejects(importCollection(env,{id:'a',role:'user'},{kind:'vocab',collection}),e=>e.status===409);const b=await importCollection(env,{id:'b',role:'user'},{kind:'vocab',collection});assert.notEqual(a.recordId,b.recordId);
 const admin=await importCollection(env,{id:'admin',role:'super_admin'},{kind:'vocab',collection,visibility:'public'});assert.equal(admin.visibility,'public');assert.equal(db.prepare('SELECT count(*) n FROM ee_records').get().n,3);
 }finally{db.close();}
});
test('document extraction needs a configured vision provider and does not save a fake OCR result',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT)');let writes=0;const env={TEST_CORE_DB:async(sql,args=[])=>{if(!/^SELECT/.test(sql))writes++;return {rows:db.prepare(sql).all(...args)};}};
 try{await assert.rejects(extractDocument(env,{id:'a'},{filename:'scan.pdf',attachments:[{mimeType:'application/pdf',data:'YQ=='}]}),e=>e.code==='AI_NOT_CONFIGURED');assert.equal(writes,0);}finally{db.close();}
});
