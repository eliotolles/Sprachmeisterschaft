import test from 'node:test';import assert from 'node:assert/strict';
import {previewModelSuggestions,PREVIEW_SOURCES} from '../src/lib/model-previews.js';
test('all nine official providers have visible pre-key suggestions with source references',()=>{
 for(const provider of Object.keys(PREVIEW_SOURCES)){const rows=previewModelSuggestions(provider);assert(rows.length>=2);assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);assert(rows.every(x=>x.preview&&x.verified===false&&x.source.startsWith('https://')));}
 assert.equal(Object.keys(PREVIEW_SOURCES).length,9);assert.deepEqual(previewModelSuggestions('custom'),[]);
});
test('pre-key suggestions never claim verified free quota, token limits or key access',()=>{
 for(const provider of Object.keys(PREVIEW_SOURCES))for(const row of previewModelSuggestions(provider)){assert.equal(row.pricing.isFree,false);assert(['PAID','UNKNOWN'].includes(row.pricing.tier));assert.equal(row.contextWindow,'Chưa xác minh context');assert.equal(row.capabilities.vision,undefined);}
 assert(previewModelSuggestions('gemini').some(x=>x.id==='gemini-3.8-flash'));
 assert(previewModelSuggestions('openai').some(x=>x.id==='gpt-6.1-sol'));
});
