import test from 'node:test';import assert from 'node:assert/strict';import {createImportBinding,importVocabularyJSON} from '../src/core/elio/import-binding.js';
test('reviewed vocabulary preserves source IDs and optional fields; repeat import has deterministic collection identity',async()=>{
 const calls=[],user={id:'a',role:'user'},b=createImportBinding({isActive:()=>true,client:{getUser:()=>user,importCollection:async(kind,c,scope)=>{calls.push({kind,c,scope});return {recordId:'new',count:c.items.length};}}});const rows=importVocabularyJSON(JSON.stringify({words:[{id:'source-1',de:'grün',vi:'xanh',english:'green'}]}));const input={contentType:'vocabulary',title:'New deck',level:'B1',scope:'private',rows,duplicateMode:'skip'};await b.save(input);await b.save(input);assert.equal(calls[0].c.items[0].id,'source-1');assert.equal(calls[0].c.items[0].english,'green');assert.equal(calls[0].c.id,calls[1].c.id);assert.equal(calls[0].scope,'private');await assert.rejects(b.save({...input,duplicateMode:'overwrite'}));await assert.rejects(b.save({...input,scope:'public'}));await assert.rejects(b.save({...input,rows:rows.concat(rows)}));assert.equal(calls.length,2);
});
test('OCR is a server review draft, not an automatic database write; unavailable transcripts never become demo captions',async()=>{
 let writes=0;const b=createImportBinding({isActive:()=>true,client:{getUser:()=>({id:'a',role:'user'}),extractDocument:async()=>({requiresReview:true,saved:false,draft:{pages:[{text:'grün | xanh'}],warnings:['Review scan']}}),listeningTranscript:async()=>({available:false,reason:'Unavailable'}),importCollection:async()=>writes++}});const result=await b.extractFile({name:'scan.pdf',type:'application/pdf',size:2,arrayBuffer:async()=>new Uint8Array([1,2]).buffer});assert.equal(result.text,'grün | xanh');assert.equal(writes,0);await assert.rejects(b.transcript('https://www.youtube.com/watch?v=abcdefghijk'),/Unavailable/);await assert.rejects(b.transcript('https://evil.example/watch?v=abcdefghijk'));
});
test('late OCR drafts cannot be shown or saved as another account',async()=>{
 let user={id:'a',role:'user'},resolve;const b=createImportBinding({isActive:()=>true,client:{getUser:()=>user,extractDocument:()=>new Promise(r=>resolve=r)}});const pending=b.extractFile({name:'scan.pdf',type:'application/pdf',size:1,arrayBuffer:async()=>new Uint8Array([1]).buffer});await new Promise(r=>setTimeout(r,0));user={id:'b',role:'user'};resolve({requiresReview:true,saved:false,draft:{pages:[{text:'private draft'}]}});await assert.rejects(pending,/Tài khoản đã thay đổi/);assert.throws(()=>importVocabularyJSON('[{"id":"a","source_id":"b","de":"gut","vi":"tốt"}]'),/mâu thuẫn/);
});

test('text skill imports retain raw content and selected destination',async()=>{
 const {createImportBinding}=await import('../src/core/elio/import-binding.js');
 const sent=[];
 const binding=createImportBinding({client:{getUser:()=>({id:'owner',role:'admin'}),importCollection:async(...args)=>(sent.push(args),{recordId:'record',count:1})},isActive:()=>true});
 for(const contentType of ['reading','writing','speaking']){
  const result=await binding.save({contentType,title:'Source',level:'B1',scope:'private',rows:[],rawText:'German source text.',organizerId:'folder'});
  assert.equal(result.savedCount,1);
  const args=sent.at(-1);
  assert.equal(args[0],contentType);
  assert.equal(args[1].items[0].content,'German source text.');
  assert.equal(args[3],'folder');
 }
});
