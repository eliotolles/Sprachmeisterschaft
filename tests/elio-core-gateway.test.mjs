import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleElioCore } from '../src/core/elio/gateway.js';
import { passwordHash, passwordMatches } from '../src/core/elio/passwords.js';
import { databaseEndpoint, APPROVED_HOST } from '../src/core/elio/database.js';
import worker from '../worker.js';
const hash = await passwordHash('Existing-user-493!');
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE ee_users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,blocked INTEGER NOT NULL DEFAULT 0,role TEXT NOT NULL DEFAULT 'user');
    CREATE TABLE ee_state(owner TEXT NOT NULL,key TEXT NOT NULL,value TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(owner,key));
    CREATE TABLE ee_records(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,title TEXT,level TEXT,public INTEGER,data TEXT);
    CREATE TABLE ee_sessions(token TEXT PRIMARY KEY,user_id TEXT,expires INTEGER);
    INSERT INTO ee_sessions VALUES('untouched-old-session','owner',9999999999999);
    CREATE TABLE elio_shared_vocabulary(source_id TEXT PRIMARY KEY,german TEXT,article TEXT,word_type TEXT,vietnamese TEXT,example_de TEXT,example_vi TEXT,topic TEXT,level TEXT,source_deck_id TEXT,extra_json TEXT);
    INSERT INTO elio_shared_vocabulary VALUES('existing-source','Haus','das','noun','nhà','','','Elio','A1','deck','{}');`);
  db.exec(readFileSync(new URL('../db/elio-core-additive.sql',import.meta.url),'utf8'));
  for(const [id,email,role,password] of [['owner','owner@example.invalid','super_admin',hash],['alice','alice@example.invalid','user',hash],['bob','bob@example.invalid','user',hash],['legacy','legacy@example.invalid','user','unsupported:existing-format']]) {
    db.prepare('INSERT INTO ee_users(id,email,name,password,role) VALUES(?,?,?,?,?)').run(id,email,id,password,role);
  }
  const env={ELIO_CORE_ENABLED:'true',TEST_CORE_DB:async(sql,args=[])=>{
    const statement=db.prepare(sql);
    if(/^SELECT/i.test(sql.trim())||/\bRETURNING\b/i.test(sql))return {rows:statement.all(...args),changes:0};
    const result=statement.run(...args);return {rows:[],changes:Number(result.changes)};
  }};
  const call=async(path,method='GET',data,session,extra={})=>{
    const headers={Origin:'https://migration.test',...(data?{'Content-Type':'application/json'}:{}),...(session?{Cookie:session.cookie,'X-Elio-User':session.user.id}:{}),...extra};
    const response=await handleElioCore(new Request('https://migration.test/api/core'+path,{method,headers,body:data?JSON.stringify(data):undefined}),env);
    const payload=await response.json();return {status:response.status,body:payload,cookie:response.headers.get('Set-Cookie')?.split(';')[0],cookieHeader:response.headers.get('Set-Cookie'),user:payload.user};
  };
  return {db,env,call,login:email=>call('/auth/login','POST',{email,password:'Existing-user-493!'})};
}
test('core is disabled by default before database or assets are accessed',async()=>{
  let calls=0;const response=await worker.fetch(new Request('https://migration.test/api/core/auth/login',{method:'POST'}),{TEST_CORE_DB:()=>{calls++;throw Error('not allowed');}});
  assert.equal(response.status,503);assert.equal(calls,0);
  const config=await worker.fetch(new Request('https://migration.test/api/core/config'),{});assert.equal((await config.json()).enabled,false);
});
test('Turso endpoint is pinned to the approved database',()=>{
  assert.equal(databaseEndpoint('libsql://'+APPROVED_HOST),'https://'+APPROVED_HOST+'/v2/pipeline');
  for(const raw of ['libsql://other.turso.io','https://'+APPROVED_HOST+'/other','https://'+APPROVED_HOST+'?secret=x','http://'+APPROVED_HOST])assert.throws(()=>databaseEndpoint(raw));
});
test('existing PBKDF2 account keeps ID, password hash and legacy session',async()=>{
  const {db,login}=fixture();try{const before=db.prepare('SELECT * FROM ee_users').all();const alice=await login('alice@example.invalid');assert.equal(alice.status,200);assert.equal(alice.user.id,'alice');assert.equal(alice.user.role,'user');
    assert.match(alice.cookieHeader,/HttpOnly; Secure; SameSite=Strict/);assert(!JSON.stringify(alice.body).includes(hash));assert.deepEqual(db.prepare('SELECT * FROM ee_users').all(),before);
    assert.equal(db.prepare('SELECT token FROM ee_sessions').get().token,'untouched-old-session');assert(!db.prepare('SELECT token_hash FROM sprach_core_sessions').get().token_hash.includes(alice.cookie.split('=')[1]));
  }finally{db.close();}
});
test('passwords, blocked users and unsupported legacy hashes fail closed',async()=>{
  const {db,call,login}=fixture();try{
    assert.equal((await call('/auth/login','POST',{email:'owner@example.invalid',password:'wrong'})).status,401);
    assert.equal((await call('/auth/login','POST',{email:'alice@example.invalid',password:''})).status,400);
    assert.equal((await login('legacy@example.invalid')).status,401);
    assert.equal(db.prepare('SELECT password FROM ee_users WHERE id=?').get('legacy').password,'unsupported:existing-format');
    db.prepare('UPDATE ee_users SET blocked=1 WHERE id=?').run('bob');assert.equal((await login('bob@example.invalid')).status,403);
  }finally{db.close();}
});
test('registration ignores client roles and duplicate registration preserves existing account',async()=>{
  const {db,call}=fixture();try{
    const result=await call('/auth/register','POST',{email:'admin-word@example.invalid',name:'Learner',password:'Fixture-493!',role:'super_admin'});assert.equal(result.status,200);assert.equal(result.user.role,'user');
    const before=db.prepare('SELECT * FROM ee_users WHERE id=?').get('owner');assert.equal((await call('/auth/register','POST',{email:before.email,password:'Fixture-493!'})).status,409);assert.deepEqual(db.prepare('SELECT * FROM ee_users WHERE id=?').get('owner'),before);
  }finally{db.close();}
});
test('authentication is server-side and admin routes enforce the stored role',async()=>{
  const {db,call,login}=fixture();try{
    assert.equal((await call('/state')).status,401);const alice=await login('alice@example.invalid'),owner=await login('owner@example.invalid');
    assert.equal((await call('/admin/users','GET',undefined,alice)).status,403);assert.equal((await call('/admin/users','GET',undefined,owner)).status,200);
    db.prepare('UPDATE ee_users SET blocked=1 WHERE id=?').run('alice');assert.equal((await call('/auth/me','GET',undefined,alice)).status,403);
  }finally{db.close();}
});
test('progress is isolated, survives another session, and rejects stale device writes',async()=>{
  const {db,call,login}=fixture();try{
    const alice=await login('alice@example.invalid'),bob=await login('bob@example.invalid');
    assert.equal((await call('/state','PUT',{name:'srs',value:{word:{repetitions:2}},version:0},alice)).status,200);
    assert.equal((await call('/state?keys=srs','GET',undefined,bob)).body.records.srs,undefined);
    const anotherDevice=await login('alice@example.invalid');assert.equal((await call('/state?keys=srs','GET',undefined,anotherDevice)).body.records.srs.value.word.repetitions,2);
    const stale=await call('/state','PUT',{name:'srs',value:{},version:0},anotherDevice);assert.equal(stale.status,409);assert.equal(stale.body.latest.version,1);
    assert.equal((await call('/state','PUT',{name:'srs',value:{word:{repetitions:3}},version:1},alice)).body.version,2);
    assert.equal((await call('/state','PUT',{name:'srs',value:{},version:2,owner:'bob'},alice)).status,400);
  }finally{db.close();}
});
test('CSRF, stale-account writes, invalid state keys and invalid pagination are rejected',async()=>{
  const {db,call,login}=fixture();try{const alice=await login('alice@example.invalid');
    assert.equal((await call('/state','PUT',{name:'srs',value:{},version:0},alice,{Origin:'https://evil.invalid'})).status,403);
    assert.equal((await call('/state','PUT',{name:'srs',value:{},version:0},alice,{'X-Elio-User':'bob'})).status,409);
    assert.equal((await call('/state','PUT',{name:'srs',value:{},version:0},alice,{'X-Elio-User':''})).status,409);
    assert.equal((await call('/state?keys=password','GET',undefined,alice)).status,400);
    assert.equal((await call('/vocabulary?limit=201','GET',undefined,alice)).status,400);
    assert.equal((await call('/vocabulary','GET',undefined,alice)).body.cards[0].source_id,'existing-source');
  }finally{db.close();}
});
test('logout revokes only the current new session and rate limiting is enforced',async()=>{
  const {db,call,login}=fixture();try{const a=await login('alice@example.invalid'),b=await login('alice@example.invalid');
    assert.equal((await call('/auth/logout','POST',{},a)).status,200);assert.equal((await call('/auth/me','GET',undefined,a)).status,401);assert.equal((await call('/auth/me','GET',undefined,b)).status,200);
    let result;for(let i=0;i<12;i++)result=await call('/auth/login','POST',{email:'spray@example.invalid',password:'Wrong-493!'});assert.equal(result.status,429);
  }finally{db.close();}
});
test('shared and personal legacy records retain backend visibility boundaries',async()=>{
  const {db,call,login}=fixture();try{
    db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?,?,?)').run('private-a','alice','grammar','A','B1',0,'{}');
    db.prepare('INSERT INTO ee_records VALUES(?,?,?,?,?,?,?)').run('shared','owner','grammar','Public','B1',1,'{}');
    const alice=await login('alice@example.invalid'),bob=await login('bob@example.invalid');
    assert.deepEqual((await call('/records?kind=grammar','GET',undefined,alice)).body.items.map(x=>x.id),['private-a','shared']);
    assert.deepEqual((await call('/records?kind=grammar','GET',undefined,bob)).body.items.map(x=>x.id),['shared']);
  }finally{db.close();}
});
test('review API requires auth, computes server schedule and cannot be bypassed by a generic state write',async()=>{
  const {db,call,login}=fixture();try{
    const data={sourceId:'existing-source',rating:'good',version:0};
    assert.equal((await call('/vocabulary/review','POST',data)).status,401);
    const alice=await login('alice@example.invalid');
    const result=await call('/vocabulary/review','POST',data,alice);
    assert.equal(result.status,200);assert.equal(result.body.review.repetitions,1);assert.equal(result.body.version,1);
    assert.equal((await call('/vocabulary/review','POST',data,alice)).status,409);
    assert.equal((await call('/state','PUT',{name:'sprach_vocabulary_reviews',value:{},version:1},alice)).status,400);
    assert.equal((await call('/vocabulary/review','POST',{...data,version:1,rating:'invalid'},alice)).status,400);
    const state=await call('/state?keys=sprach_vocabulary_reviews','GET',undefined,alice);
    assert.equal(state.body.records.sprach_vocabulary_reviews.value.history.length,1);
  }finally{db.close();}
});
test('grammar gateway authenticates imports, returns source lessons and protects server-graded progress',async()=>{
  const {db,call,login}=fixture();try{
    db.exec('ALTER TABLE ee_records ADD COLUMN updated_at TEXT');
    assert.equal((await call('/grammar')).status,401);
    const alice=await login('alice@example.invalid'),owner=await login('owner@example.invalid');
    const catalog=await call('/grammar?level=B1','GET',undefined,alice);assert.equal(catalog.status,200);assert.equal(catalog.body.total,17);
    const first=catalog.body.lessons[0];const lesson=await call('/grammar/lesson?'+new URLSearchParams({collection:first.collectionId,id:first.id}),'GET',undefined,alice);
    assert.equal(lesson.status,200);assert.equal(lesson.body.exercises[0].answers,undefined);
    const exercise=lesson.body.exercises[0];
    const submission={collectionId:first.collectionId,lessonId:first.id,exerciseId:exercise.id,revision:exercise.revision,answer:'definitely not the answer',version:0};
    const result=await call('/grammar/submit','POST',submission,alice);assert.equal(result.status,200);assert.equal(result.body.feedback.correct,false);
    assert.equal((await call('/grammar/submit','POST',submission,alice)).status,409);
    assert.equal((await call('/state','PUT',{name:'sprach_grammar_attempts',value:{attempts:[]},version:1},alice)).status,400);
    const collection={id:'gateway-grammar',name:'Import',items:[{id:'lesson',title:'Import',level:'A1',content:'A real rule.',exercises:[]}]};
    assert.equal((await call('/grammar/import','POST',{collection,visibility:'public'},alice)).status,403);
    const shared=await call('/grammar/import','POST',{collection},owner);assert.equal(shared.status,200);assert.equal(shared.body.visibility,'public');
  }finally{db.close();}
});
