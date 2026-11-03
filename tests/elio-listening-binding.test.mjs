import test from 'node:test';import assert from 'node:assert/strict';import {createListeningBinding,mapDictationAttempt,listeningRouteIds} from '../src/core/elio/listening-binding.js';import {ListeningV2Core} from '../src/core/elio/listening-content.js';
test('dictation adapter fingerprints actual stored cues and sends no answer key',async()=>{
 let payload;const cue={text:'Ich lerne Deutsch.'},client={getUser:()=>({id:'a'}),records:async()=>[{id:'r',level:'B1',data:JSON.stringify({items:[{id:'item',cues:[cue]}]})}],submitDictation:async p=>{payload=p;return {attempt:{...p,expected:cue.text,...ListeningV2Core.compare(p.answer,cue.text)}};}};const b=createListeningBinding({client,isActive:()=>true}),{items}=await b.load();assert.equal(items.length,1);assert.equal(items[0].cueRevision.length,64);const r=await b.submit(items[0],'ich lerne deutsch');assert.equal(payload.expected,undefined);assert.equal(payload.itemId,'item');assert.equal(r.score,100);assert.equal(r.audit.stats.capitalizationCount,2);assert(r.audit.acousticTip.includes('không xác định'));
});
test('dictation rejects responses arriving after account or practice changes',async()=>{
 let user={id:'a'},resolve;const b=createListeningBinding({isActive:()=>true,client:{getUser:()=>user,records:()=>new Promise(r=>resolve=r)}});const load=b.load();b.reset();resolve([]);await assert.rejects(load,e=>e.code==='ACCOUNT_CHANGED');const second=b.load();user={id:'b'};resolve([]);await assert.rejects(second,e=>e.code==='ACCOUNT_CHANGED');assert.throws(()=>mapDictationAttempt({score:NaN,ops:[],answer:'x',expected:'x'}));
});

test('listening route aliases preserve source identity without slash or numeric-string collisions',()=>{
 const source={recordId:'folder/Deutsch B1',itemId:'Teil/ö?1'},routes=listeningRouteIds(source);assert(!routes.collectionId.includes('/'));assert(!routes.episodeId.includes('/'));assert.equal(source.itemId,'Teil/ö?1');assert.notEqual(listeningRouteIds({recordId:'r',itemId:1}).episodeId,listeningRouteIds({recordId:'r',itemId:'1'}).episodeId);assert.equal(listeningRouteIds({recordId:'r'}).episodeId,'r:video');
});

test('authorized videos without captions stay in the library without fabricated cues',async()=>{
 const client={getUser:()=>({id:'a'}),records:async()=>[{id:'empty-video',public:1,data:JSON.stringify({youtubeId:'abcdefghijk',cues:[]})},{id:'no-video',data:'{}'}]};const b=createListeningBinding({client,isActive:()=>true}),result=await b.load();assert.equal(result.videos.length,1);assert.deepEqual(result.videos[0].subtitles,[]);assert.equal(result.items.length,0);assert.equal(result.videos[0].transcriptComplete,false);
});
