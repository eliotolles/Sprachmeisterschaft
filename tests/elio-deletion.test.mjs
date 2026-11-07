import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {deleteRecord} from '../src/core/elio/record-deletion.js';
import {editVocabulary,readVocabularyDeck} from '../src/core/elio/personal-vocabulary.js';
import {createVocabularyBinding} from '../src/core/elio/vocabulary-binding.js';
import {readVocabulary} from '../src/core/elio/vocabulary.js';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE ee_records(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,title TEXT,level TEXT,public INTEGER,data TEXT,updated_at TEXT);
 CREATE TABLE ee_state(owner TEXT,key TEXT,value TEXT,revision INTEGER,PRIMARY KEY(owner,key));
 CREATE TABLE elio_shared_vocabulary(source_id TEXT PRIMARY KEY,german TEXT,article TEXT,word_type TEXT,vietnamese TEXT,example_de TEXT,example_vi TEXT,topic TEXT,level TEXT,source_deck_id TEXT,extra_json TEXT);`);
 const env={TEST_CORE_DB:async(sql,args=[])=>{
  const statement=db.prepare(sql);
  return /^(SELECT|WITH)/.test(sql)||/RETURNING/.test(sql)?{rows:statement.all(...args)}:{rows:[],changes:Number(statement.run(...args).changes)};
 }};
 return {db,env};
}
const admin={id:'alice',role:'admin'},bob={id:'bob',role:'user'};

test('Admin vocabulary deletion survives reloading across shared, private and legacy sources',async()=>{
 const {db,env}=fixture();
 const record={id:'pack',words:[{id:'personal',de:'Haus',vi:'nhà'}],items:[{id:'personal',de:'Haus',vi:'nhà'}],preserved:'metadata'};
 db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?,?,?,?)').run('private','alice','vocab','Private','A1',0,JSON.stringify(record),'before');
 db.prepare('INSERT INTO ee_state VALUES(?,?,?,?)').run('alice','vocab',JSON.stringify([{id:'legacy',de:'alt',vi:'cũ'}]),7);
 db.prepare('INSERT INTO ee_state VALUES(?,?,?,?)').run('bob','sprach_vocabulary_reviews','{"cards":{"preserve":true},"history":[]}',3);
 db.prepare('INSERT INTO elio_shared_vocabulary(source_id,german,vietnamese,extra_json) VALUES(?,?,?,?)').run('shared','grün','xanh','{}');
 const client={
  getUser:()=>admin,
  vocabulary:async()=> (await readVocabulary(env,new URL('https://fixture/vocabulary?limit=200'))).cards,
  records:async()=> (await env.TEST_CORE_DB("SELECT * FROM ee_records WHERE kind='vocab' AND (owner=? OR public=1)",[admin.id])).rows,
  loadState:async()=>Object.fromEntries((await env.TEST_CORE_DB('SELECT key,value,revision FROM ee_state WHERE owner=?',[admin.id])).rows.map(row=>[row.key,{value:JSON.parse(row.value),version:row.revision}])),
  vocabularyDeck:id=>readVocabularyDeck(env,admin,id),
  editVocabulary:input=>editVocabulary(env,admin,input),
 };
 try{
  const binding=createVocabularyBinding({client,legacy:{},isActive:()=>true});
  await binding.hydrate();
  assert.equal(binding.api.findMany().length,3);
  const shared=binding.api.findMany().find(card=>!card.coreDeckId);
  await binding.api.delete(shared.id);
  assert.equal(binding.api.findById(shared.id),null);
  assert.equal(db.prepare('SELECT count(*) n FROM elio_shared_vocabulary').get().n,0);
  await binding.api.clearAll();
  assert.equal(binding.api.findMany().length,0);
  const reloaded=createVocabularyBinding({client,legacy:{},isActive:()=>true});
  await reloaded.hydrate();
  assert.equal(reloaded.api.findMany().length,0);
  const data=JSON.parse(db.prepare("SELECT data FROM ee_records WHERE id='private'").get().data);
  assert.deepEqual(data.words,[]);
  assert.deepEqual(data.items,[]);
  assert.equal(data.preserved,'metadata');
  assert.equal(db.prepare("SELECT revision FROM ee_state WHERE owner='alice' AND key='vocab'").get().revision,8);
  assert.equal(db.prepare("SELECT value FROM ee_state WHERE owner='bob'").get().value,'{"cards":{"preserve":true},"history":[]}');
 }finally{db.close();}
});

test('vocabulary deletion rejects other accounts and stale revisions without removing anything',async()=>{
 const {db,env}=fixture();
 db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?,?,?,?)').run('deck','alice','vocab','Deck','A1',0,JSON.stringify({words:[{id:'word',de:'Haus',vi:'nhà'}]}),'before');
 try{
  const deck=await readVocabularyDeck(env,admin,'deck');
  await assert.rejects(editVocabulary(env,bob,{action:'deleteShared',wordIds:['source']}),e=>e.status===403);
  await assert.rejects(editVocabulary(env,bob,{action:'delete',deckId:'deck',wordIds:['word'],revision:deck.revision}),e=>e.status===404);
  await assert.rejects(editVocabulary(env,admin,{action:'delete',deckId:'deck',wordIds:['word'],revision:'stale'}),e=>e.code==='DECK_CONFLICT');
  assert.equal((await readVocabularyDeck(env,admin,'deck')).collection.words.length,1);
 }finally{db.close();}
});

test('record deletion is scoped, idempotent and protects concurrent updates and remaining listening episodes',async()=>{
 const {db,env}=fixture();
 const insert=(id,owner)=>db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?,?,?,?)').run(id,owner,'listening','Videos','A1',1,JSON.stringify({items:[{id:'one',cues:[]},{id:'two',cues:[]}],metadata:'keep'}),'before');
 insert('videos','alice');
 try{
  await assert.rejects(deleteRecord(env,bob,{recordId:'videos'}),e=>e.status===403);
  await deleteRecord(env,admin,{recordId:'videos',itemId:'one'});
  const remaining=JSON.parse(db.prepare('SELECT data FROM ee_records WHERE id=?').get('videos').data);
  assert.deepEqual(remaining.items.map(item=>item.id),['two']);
  assert.equal(remaining.metadata,'keep');
  assert.equal((await deleteRecord(env,admin,{recordId:'videos',itemId:'one'})).deleted,false);
  const concurrent={...env,TEST_CORE_DB:async(sql,args)=>{
   if(sql.startsWith('DELETE'))db.prepare('UPDATE ee_records SET data=? WHERE id=?').run('{"items":[],"newer":true}','videos');
   return env.TEST_CORE_DB(sql,args);
  }};
  await assert.rejects(deleteRecord(concurrent,admin,{recordId:'videos'}),e=>e.code==='CONTENT_CHANGED');
  assert.equal(db.prepare("SELECT count(*) n FROM ee_records WHERE id='videos'").get().n,1);
  assert.equal((await deleteRecord(env,admin,{recordId:'videos'})).deleted,true);
  assert.equal((await deleteRecord(env,admin,{recordId:'videos'})).deleted,false);
 }finally{db.close();}
});
