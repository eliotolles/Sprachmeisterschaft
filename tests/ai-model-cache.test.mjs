import test from 'node:test';import assert from 'node:assert/strict';
import {createModelCatalogCache} from '../src/core/elio/ai-model-cache.js';
test('warm requests reuse successful catalogs for five minutes, isolated by key, provider, policy and environment',async()=>{
 let calls=0,time=0;const cache=createModelCatalogCache({now:()=>time,discover:async(p,k,options)=>{calls++;assert(options.deadlineAt<=time+8000);return {items:[{id:'model',free:options.freeOnly}]};}}),env={};
 const one=await cache.read(env,'groq','fixture-a');one.items[0].id='changed';assert.equal((await cache.read(env,'groq','fixture-a')).items[0].id,'model');assert.equal(calls,1);
 await cache.read(env,'groq','fixture-b');await cache.read(env,'gemini','fixture-a');await cache.read(env,'groq','fixture-a',{freeOnly:true});await cache.read({},'groq','fixture-a');assert.equal(calls,5);
 time=300001;await cache.read(env,'groq','fixture-a');assert.equal(calls,6);await cache.invalidate(env,'groq','fixture-a');await cache.read(env,'groq','fixture-a');assert.equal(calls,7);
});
test('concurrent catalog requests share one fetch; failures are never cached',async()=>{
 let calls=0,release;const gate=new Promise(r=>release=r),env={},cache=createModelCatalogCache({discover:async()=>{calls++;await gate;return {items:[]};}});
 const a=cache.read(env,'groq','fixture'),b=cache.read(env,'groq','fixture');release();await Promise.all([a,b]);assert.equal(calls,1);
 let fails=0;const broken=createModelCatalogCache({discover:async()=>{fails++;throw Error('network unavailable');}});await assert.rejects(broken.read(env,'groq','fixture'));await assert.rejects(broken.read(env,'groq','fixture'));assert.equal(fails,2);
});
