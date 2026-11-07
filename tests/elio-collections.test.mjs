import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createCollection,listCollections,readCollection,moveCollectionRecord} from '../src/core/elio/collections.js';
import {importCollection} from '../src/core/elio/importer.js';
import {listGrammar} from '../src/core/elio/grammar.js';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE ee_config(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE ee_records(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,title TEXT,level TEXT,public INTEGER,data TEXT,updated_at TEXT);');
 const env={TEST_CORE_DB:async(sql,args=[])=>{
  const statement=db.prepare(sql);
  return /^SELECT/.test(sql)||/RETURNING/.test(sql)?{rows:statement.all(...args)}:{rows:[],changes:Number(statement.run(...args).changes)};
 }};
 return {db,env};
}
const alice={id:'alice',role:'admin'},bob={id:'bob',role:'user'};
const vocabulary={id:'source-file',name:'Original',items:[{id:'original-word',de:'Haus',vi:'nhà',level:'A1'}]};

test('collections are idempotent, private by owner and enforce public-write permissions',async()=>{
 const {db,env}=fixture();
 try{
  const input={name:'B1 của tôi',skill:'all',visibility:'private',requestId:'one-request'};
  const a=await createCollection(env,alice,input);
  assert.equal((await createCollection(env,alice,input)).collection.id,a.collection.id);
  assert.equal(db.prepare('SELECT count(*) n FROM ee_config').get().n,1);
  await assert.rejects(createCollection(env,alice,{...input,name:'Other'}),e=>e.code==='COLLECTION_CONFLICT');
  await assert.rejects(readCollection(env,bob,a.collection.id),e=>e.status===403);
  assert.equal((await listCollections(env,bob)).items.length,0);
  await assert.rejects(createCollection(env,bob,{...input,visibility:'public'}),e=>e.status===403);
  const publicSet=(await createCollection(env,alice,{...input,visibility:'public',requestId:'public'})).collection;
  assert.equal((await listCollections(env,bob)).items[0].canEdit,false);
  await assert.rejects(readCollection(env,bob,publicSet.id,{write:true}),e=>e.status===403);
 }finally{db.close();}
});

test('import destinations persist with the source and moving records preserves IDs and content',async()=>{
 const {db,env}=fixture();
 try{
  const make=requestId=>createCollection(env,alice,{name:requestId,skill:'vocabulary',visibility:'private',requestId});
  const first=(await make('first')).collection,second=(await make('second')).collection;
  const result=await importCollection(env,alice,{kind:'vocab',collection:vocabulary,visibility:'private',organizerId:first.id});
  const row=()=>db.prepare('SELECT * FROM ee_records WHERE id=?').get(result.recordId);
  assert.equal(JSON.parse(row().data).organizerId,first.id);
  assert.equal(JSON.parse(row().data).words[0].id,'original-word');
  await assert.rejects(importCollection(env,bob,{kind:'vocab',collection:vocabulary,visibility:'private',organizerId:first.id}),e=>e.status===403);
  await moveCollectionRecord(env,alice,{recordId:result.recordId,collectionId:second.id});
  assert.equal(JSON.parse(row().data).organizerId,second.id);
  assert.equal(row().id,result.recordId);
  assert.equal(JSON.parse(row().data).items[0].de,'Haus');
  await moveCollectionRecord(env,alice,{recordId:result.recordId,collectionId:null});
  assert.equal(JSON.parse(row().data).organizerId,undefined);
  const direct=await importCollection(env,alice,{kind:'vocab',collection:{...vocabulary,id:'direct',organizerId:first.id},visibility:'private'});
  assert.equal(JSON.parse(db.prepare('SELECT data FROM ee_records WHERE id=?').get(direct.recordId).data).organizerId,undefined);
 }finally{db.close();}
});

test('wrong skills and mismatched visibility fail before importing records',async()=>{
 const {db,env}=fixture();
 try{
  const folder=(await createCollection(env,alice,{name:'Grammar',skill:'grammar',visibility:'public',requestId:'g'})).collection;
  await assert.rejects(importCollection(env,alice,{kind:'vocab',collection:vocabulary,visibility:'public',organizerId:folder.id}),e=>e.code==='COLLECTION_KIND');
  await assert.rejects(importCollection(env,alice,{kind:'grammar',collection:{},visibility:'private',organizerId:folder.id}),e=>e.code==='COLLECTION_VISIBILITY');
  assert.equal(db.prepare('SELECT count(*) n FROM ee_records').get().n,0);
 }finally{db.close();}
});

test('grammar imports keep collection membership and scope the actual lesson catalog',async()=>{
 const {db,env}=fixture();
 try{
  const target=(await createCollection(env,alice,{name:'Grammar',skill:'grammar',visibility:'private',requestId:'grammar'})).collection;
  const collection={id:'source-grammar',name:'Grammar source',items:[{id:'lesson',title:'Test lesson',level:'B1',content:'Source explanation.',exercises:[{id:'q',type:'quiz',question:'Test?',options:['A','B'],answer:'A'}]}]};
  const result=await importCollection(env,alice,{kind:'grammar',collection,visibility:'private',organizerId:target.id});
  assert.equal(JSON.parse(db.prepare('SELECT data FROM ee_records WHERE id=?').get(result.recordId).data).organizerId,target.id);
  const listed=await listGrammar(env,alice,new URL('https://fixture/grammar?organizer='+target.id));
  assert.equal(listed.lessons.length,1);
  assert.equal(listed.lessons[0].id,'lesson');
 }finally{db.close();}
});

test('new words added while studying a collection stay in that collection',async()=>{
 const {editVocabulary}=await import('../src/core/elio/personal-vocabulary.js');
 const {db,env}=fixture();
 try{
  const target=(await createCollection(env,alice,{name:'Words',skill:'vocabulary',visibility:'private',requestId:'words'})).collection;
  const result=await editVocabulary(env,alice,{action:'create',organizerId:target.id,words:[{id:'new-word',german:'Haus',vietnamese:'nhà'}]});
  const source=JSON.parse(db.prepare('SELECT data FROM ee_records WHERE id=?').get(result.deckId).data);
  assert.equal(source.organizerId,target.id);
  assert.equal(source.words[0].id,'new-word');
  await assert.rejects(editVocabulary(env,bob,{action:'create',organizerId:target.id,words:[{german:'Test',vietnamese:'thử'}]}),e=>e.status===403);
 }finally{db.close();}
});

test('collection names can be changed only by the owner or public-content admin with a matching revision',async()=>{const {renameCollection}=await import('../src/core/elio/collections.js');const {db,env}=fixture();try{const folder=(await createCollection(env,bob,{name:'My listening',skill:'listening',visibility:'private',requestId:'rename-one'})).collection;const renamed=await renameCollection(env,bob,{id:folder.id,revision:folder.revision,name:'New listening name'});assert.equal(renamed.collection.name,'New listening name');assert.equal(renamed.collection.id,folder.id);await assert.rejects(renameCollection(env,alice,{id:folder.id,revision:renamed.collection.revision,name:'No access'}),e=>e.status===403);await assert.rejects(renameCollection(env,bob,{id:folder.id,revision:folder.revision,name:'Stale'}),e=>e.status===409);}finally{db.close();}});
