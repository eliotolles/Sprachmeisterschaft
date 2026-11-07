import test from 'node:test';
import assert from 'node:assert/strict';
import {createElioClient} from '../src/core/elio/client.js';

test('client exposes fetch and response-body timeouts as visible localized failures',async()=>{
 for(const phase of ['fetch','body']){
  const client=createElioClient({fetcher:async url=>{
   if(url.endsWith('/auth/login'))return Response.json({user:{id:'owner',role:'admin'}});
   const timeout=()=>{throw new DOMException('internal timeout','TimeoutError');};
   return phase==='fetch'?timeout():{ok:true,status:200,json:async()=>timeout()};
  }});
  await client.login('fixture@example.com','fixture');
  await assert.rejects(client.testAIConfig({id:'cfg'}),error=>error.code==='REQUEST_TIMEOUT'&&error.message.includes('hết thời gian chờ'));
 }
});
