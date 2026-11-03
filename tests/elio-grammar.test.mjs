import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import book from '../src/core/elio/data/grammar-book-a1-b2.json' with {type:'json'};
import { validateGrammarCollection, gradeGrammarExercise, visibleExercises, grammarMindmap } from '../src/core/elio/grammar-content.js';
import { listGrammar, readGrammarLesson, importGrammar, submitGrammar, GRAMMAR_ATTEMPT_KEY } from '../src/core/elio/grammar.js';
function fixture() {
  const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE ee_records(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,title TEXT,level TEXT,public INTEGER,data TEXT,updated_at TEXT);
    CREATE TABLE ee_state(owner TEXT,key TEXT,value TEXT,revision INTEGER,PRIMARY KEY(owner,key));`);
  const env={TEST_CORE_DB:async(sql,args=[])=>{
    const stmt=db.prepare(sql);if(/^SELECT/i.test(sql.trim())||/\bRETURNING\b/i.test(sql))return {rows:stmt.all(...args),changes:0};
    const r=stmt.run(...args);return {rows:[],changes:Number(r.changes)};
  }};
  return {db,env};
}
const alice={id:'alice',role:'user'},bob={id:'bob',role:'user'},admin={id:'admin',role:'super_admin'};
const collection=()=>({id:'fixture-collection',name:'Fixture',type:'grammar',items:[{id:'fixture-lesson',title:'Perfekt',level:'B1',content:'## Quy tắc\nĐộng từ cuối câu.\n\n## Ví dụ\nIch habe gelernt.',exercises:[{id:'fixture-exercise',type:'fill',question:'Ich habe ___.',answers:['gelernt'],explanation:'lernen → gelernt.'}]}]});
test('verified source pack contains 64 A1-B2 lessons and all 494 source answer keys grade correctly',()=>{
  assert.equal(validateGrammarCollection(book),book);assert.equal(book.items.length,64);
  const count={};let exercises=0;
  for(const lesson of book.items){count[lesson.level]=(count[lesson.level]||0)+1;for(const ex of visibleExercises(lesson)){
    exercises++;for(const answer of ex.answers)assert.equal(gradeGrammarExercise(ex,answer).correct,true);
  }}
  assert.equal(exercises,494);assert.deepEqual(count,{A1:12,A2:13,B1:17,B2:22});
});
test('Elio grading normalizes whitespace, NFC, case and terminal punctuation without accepting wrong words',()=>{
  const ex={answers:['für dich'],explanation:'Dativ.'};assert.equal(gradeGrammarExercise(ex,'  FU\u0308R   dich! ').correct,true);
  assert.equal(gradeGrammarExercise(ex,'fur dich').correct,false);assert.equal(gradeGrammarExercise(ex,'für mich').correct,false);
  assert.throws(()=>gradeGrammarExercise(ex,''));assert.throws(()=>gradeGrammarExercise({answers:[]},'invented'));
});
test('mindmap groups only saved source sections and excludes invented content',()=>{
  const lesson=collection().items[0],map=grammarMindmap(lesson);
  assert.equal(map.groups[1][0].title,'Quy tắc');assert.equal(map.groups[2][0].body,'Ich habe gelernt.');
  assert.equal(map.derivedFromSourceOnly,true);assert.equal(map.groups.flat().length,2);
});
test('AI-origin exercises stay outside the verified answer-key queue and malformed imports fail',()=>{
  const c=collection();c.items[0].exercises.push({id:'ai',origin:'ai',answerSource:'ai',question:'not verified'});
  assert.equal(visibleExercises(c.items[0]).length,1);assert.doesNotThrow(()=>validateGrammarCollection(c));
  const bad=collection();bad.items[0].exercises[0].answers=[];assert.throws(()=>validateGrammarCollection(bad));
  const duplicate=collection();duplicate.items.push({...duplicate.items[0]});assert.throws(()=>validateGrammarCollection(duplicate));
});
test('catalog level filter never mixes A2 into B1; lesson API hides keys and gives a source fingerprint',async()=>{
  const {db,env}=fixture();try{
    const list=await listGrammar(env,alice,new URL('https://local.invalid/?level=B1&limit=200'));assert.equal(list.total,17);assert(list.lessons.every(x=>x.level==='B1'));
    const lesson=await readGrammarLesson(env,alice,book.id,book.items[0].id);assert.equal(lesson.content,book.items[0].content);
    assert.equal(lesson.exercises[0].answers,undefined);assert.equal(lesson.exercises[0].explanation,undefined);assert.match(lesson.exercises[0].revision,/^[a-f0-9]{64}$/);
  }finally{db.close();}
});
test('private imports are account-scoped; Admin defaults to public and cannot overwrite an existing record',async()=>{
  const {db,env}=fixture();try{
    const c=collection();const first=await importGrammar(env,alice,{collection:c});assert.equal(first.visibility,'private');
    assert.equal((await listGrammar(env,bob,new URL('https://local.invalid/?q=Fixture'))).total,0);
    await assert.rejects(importGrammar(env,alice,{collection:c,visibility:'public'}),e=>e.status===403);
    await assert.rejects(readGrammarLesson(env,bob,c.id,c.items[0].id),e=>e.status===404);
    const before=db.prepare('SELECT * FROM ee_records WHERE id=?').get(first.recordId);
    const shared=await importGrammar(env,admin,{collection:c});assert.equal(shared.visibility,'public');assert.notEqual(shared.recordId,first.recordId);
    assert.equal((await listGrammar(env,bob,new URL('https://local.invalid/?q=Fixture'))).total,1);
    assert.deepEqual(db.prepare('SELECT * FROM ee_records WHERE id=?').get(first.recordId),before);
  }finally{db.close();}
});
test('an accessible stored copy overrides the bundled pack without duplicating its lesson IDs',async()=>{
  const {db,env}=fixture();try{
    await importGrammar(env,admin,{collection:book});const list=await listGrammar(env,alice,new URL('https://local.invalid/?limit=200'));
    assert.equal(list.total,64);assert.equal(new Set(list.lessons.map(x=>x.collectionId+':'+x.id)).size,64);
  }finally{db.close();}
});
test('server grading, explanations and append-only progress are isolated and stale retries do not double count',async()=>{
  const {db,env}=fixture();try{
    const c=collection();await importGrammar(env,admin,{collection:c});const lesson=await readGrammarLesson(env,alice,c.id,c.items[0].id);
    const data={collectionId:c.id,lessonId:lesson.id,exerciseId:lesson.exercises[0].id,revision:lesson.exercises[0].revision,answer:'falsch',version:0};
    const wrong=await submitGrammar(env,alice,data,1000);assert.equal(wrong.feedback.correct,false);assert.equal(wrong.feedback.explanation,'lernen → gelernt.');
    assert.equal((await submitGrammar(env,alice,data,1001)).conflict,true);
    const right=await submitGrammar(env,alice,{...data,answer:'gelernt',version:1},1002);assert.equal(right.feedback.correct,true);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state WHERE owner=?').get('bob').n,0);
    const own=await submitGrammar(env,bob,{...data,answer:'gelernt'},1003);assert.equal(own.version,1);
    const history=JSON.parse(db.prepare('SELECT value FROM ee_state WHERE owner=? AND key=?').get('alice',GRAMMAR_ATTEMPT_KEY).value);
    assert.equal(history.attempts.length,2);assert.equal(history.attempts[0].answer,'falsch');
  }finally{db.close();}
});
test('changed answer keys and client-supplied correctness/owner are rejected without changing history',async()=>{
  const {db,env}=fixture();try{
    const c=collection();const imported=await importGrammar(env,admin,{collection:c});const lesson=await readGrammarLesson(env,alice,c.id,c.items[0].id);
    const data={collectionId:c.id,lessonId:lesson.id,exerciseId:lesson.exercises[0].id,revision:lesson.exercises[0].revision,answer:'gelernt',version:0};
    await assert.rejects(submitGrammar(env,alice,{...data,correct:true}),e=>e.status===400);
    await assert.rejects(submitGrammar(env,alice,{...data,owner:'bob'}),e=>e.status===400);
    c.items[0].exercises[0].answers=['studiert'];db.prepare('UPDATE ee_records SET data=? WHERE id=?').run(JSON.stringify(c),imported.recordId);
    await assert.rejects(submitGrammar(env,alice,data),e=>e.code==='EXERCISE_CHANGED');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ee_state').get().n,0);
  }finally{db.close();}
});
test('create-only grammar imports reject the same source ID without changing existing content',async()=>{
 const {db,env}=fixture();try{const c=collection();const first=await importGrammar(env,alice,{collection:c,visibility:'private'});const before=db.prepare('SELECT data FROM ee_records WHERE id=?').get(first.recordId).data;const changed=structuredClone(c);changed.items[0].content='Different body';await assert.rejects(importGrammar(env,alice,{collection:changed,visibility:'private'}),e=>e.code==='IMPORT_EXISTS');assert.equal(db.prepare('SELECT data FROM ee_records WHERE id=?').get(first.recordId).data,before);const other=await importGrammar(env,bob,{collection:c,visibility:'private'});assert.notEqual(other.recordId,first.recordId);}finally{db.close();}
});
