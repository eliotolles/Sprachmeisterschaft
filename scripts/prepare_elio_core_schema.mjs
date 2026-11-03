// Explicit additive preparation; never seeds, resets, drops or updates existing data.
import {createClient} from '@libsql/client';
import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {databaseEndpoint,APPROVED_HOST} from '../src/core/elio/database.js';
import {decryptBackup} from './decrypt_elio_backup.mjs';
const expected={sprach_core_sessions:['token_hash','user_id','expires','created_at'],sprach_core_limits:['name','count','until_at'],sprach_core_google_flows:['state_hash','nonce','verifier','expires','link_user']};
export async function prepareSchema({env,backup,backupSha256,expectedHost,apply=false}){
 if(expectedHost!==APPROVED_HOST)throw Error('EXPECTED_HOST_REQUIRED');databaseEndpoint(env.TURSO_DATABASE_URL,expectedHost);
 if(!env.TURSO_AUTH_TOKEN||!env.AI_ENCRYPTION_KEY)throw Error('CONFIG_REQUIRED');
 const encrypted=await readFile(backup);if(createHash('sha256').update(encrypted).digest('hex')!==backupSha256)throw Error('BACKUP_DIGEST_MISMATCH');
 const schema=await readFile(new URL('../db/elio-core-additive.sql',import.meta.url),'utf8'),statements=schema.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean);
 if(statements.length!==4||statements.some(s=>!/^CREATE TABLE IF NOT EXISTS sprach_core_(?:sessions|limits|google_flows)\s*\(/.test(s)&&!/^CREATE INDEX IF NOT EXISTS sprach_core_sessions_user ON sprach_core_sessions\(user_id\)$/.test(s))||/\b(?:DROP|ALTER|INSERT|UPDATE|DELETE|REPLACE|TRIGGER)\b/i.test(statements.join('\n')))throw Error('ADDITIVE_SCHEMA_ONLY');
 const temporary=await mkdtemp(join(tmpdir(),'elio-schema-'));let local,client;
 try{
  const file=join(temporary,'backup.sqlite');await decryptBackup(backup,file,env.AI_ENCRYPTION_KEY);local=new DatabaseSync(file);if(local.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('BACKUP_INTEGRITY');
  const tables=local.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>r.name);if(tables.some(n=>!/^\w+$/.test(n)))throw Error('BACKUP_TABLE_NAME');
  const counts=db=>Object.fromEntries(tables.filter(t=>!Object.hasOwn(expected,t)).map(t=>[t,Number(db.prepare('SELECT count(*) AS n FROM "'+t+'"').get().n)]));
  const before=counts(local);local.exec(schema);if(JSON.stringify(counts(local))!==JSON.stringify(before)||local.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('LOCAL_REHEARSAL_FAILED');
  for(const [name,columns] of Object.entries(expected))if(JSON.stringify(local.prepare('PRAGMA table_info('+name+')').all().map(r=>r.name))!==JSON.stringify(columns))throw Error('LOCAL_SCHEMA_MISMATCH');
  client=createClient({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN});
  const names=Object.keys(before),beforeResults=await client.batch(names.map(table=>'SELECT count(*) AS n FROM "'+table+'"'),'read');
  for(const [i,table] of names.entries())if(Number(beforeResults[i].rows[0].n)!==before[table])throw Error('BACKUP_COUNTS_STALE');
  const existing=(await client.execute("SELECT name FROM sqlite_master WHERE type='table'")).rows.map(r=>r.name);
  for(const [name,columns] of Object.entries(expected))if(existing.includes(name)&&JSON.stringify((await client.execute('PRAGMA table_info('+name+')')).rows.map(r=>r.name))!==JSON.stringify(columns))throw Error('REMOTE_SCHEMA_CONFLICT');
  if(apply)await client.batch(statements,'write');
  const missing=[],schemaResults=await client.batch(Object.keys(expected).map(name=>'PRAGMA table_info('+name+')'),'read');for(const [i,[name,columns]] of Object.entries(expected).entries()){const actual=schemaResults[i].rows.map(r=>r.name);if(JSON.stringify(actual)!==JSON.stringify(columns))missing.push(name);}
  const after={},afterResults=await client.batch(names.map(table=>'SELECT count(*) AS n FROM "'+table+'"'),'read');for(const [i,table] of names.entries())after[table]=Number(afterResults[i].rows[0].n);
  return {approvedHost:APPROVED_HOST,backupVerified:true,localRehearsalPassed:true,applied:apply,missingTables:missing,existingTableCountsUnchanged:JSON.stringify(before)===JSON.stringify(after),counts:after,oldTablesWritten:false,passwordsReset:false,productionActivated:false};
 }finally{local?.close();client?.close();await rm(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 const arg=name=>{const at=process.argv.indexOf(name);return at>=0?process.argv[at+1]:undefined;};
 try{console.log(JSON.stringify(await prepareSchema({env:process.env,backup:arg('--backup'),backupSha256:arg('--backup-sha256'),expectedHost:arg('--expected-host'),apply:process.argv.includes('--apply')})));}
 catch(e){console.log(JSON.stringify({applied:false,errorCode:/^[A-Z_]+$/.test(e.message)?e.message:'SCHEMA_PREPARATION_FAILED'}));process.exitCode=1;}
}
