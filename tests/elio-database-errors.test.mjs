import test from 'node:test';
import assert from 'node:assert/strict';
import {query,APPROVED_HOST} from '../src/core/elio/database.js';
test('Turso errors distinguish credentials, missing schema and write permissions without leaking upstream text',async()=>{
 const original=globalThis.fetch;const env={TURSO_DATABASE_URL:'libsql://'+APPROVED_HOST,TURSO_AUTH_TOKEN:'private-test-token'};
 try {
  for(const [status,payload,code] of [[401,{},'DATABASE_AUTH'],[200,{results:[{type:'error',error:{message:'no such table: private_table'}}]},'DATABASE_SCHEMA'],[200,{results:[{type:'error',error:{message:'attempt to write a readonly database'}}]},'DATABASE_WRITE_ACCESS']]){
   let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify(payload),{status});};
   await assert.rejects(query(env,'SELECT 1'),e=>e.code===code&&!e.message.includes('private'));assert.equal(calls,1);
  }
 }finally{globalThis.fetch=original;}
});

test('Worker transport uses manual redirects and rejects redirects without resending credentials',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async(url,init)=>{calls++;assert.equal(init.redirect,'manual');return new Response('',{status:302,headers:{Location:'https://other.invalid'}});};
 try{await assert.rejects(query({TURSO_DATABASE_URL:'libsql://'+APPROVED_HOST,TURSO_AUTH_TOKEN:'fixture'},'SELECT 1'),e=>e.code==='DATABASE_HTTP');assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
