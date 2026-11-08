import test from 'node:test';import assert from 'node:assert/strict';
import {fetchPlaylist} from '../src/core/elio/playlist-backend.js';
import {createImportBinding} from '../src/core/elio/import-binding.js';
const url='https://www.youtube.com/playlist?list=PLfixturePlaylist123',env={TRANSCRIPT_BACKEND_URL:'https://backend.example/',TRANSCRIPT_BACKEND_TOKEN:'fixture-private-token'},data={available:true,complete:true,playlistId:'PLfixturePlaylist123',title:'Fixture playlist',unavailable:1,total:3,items:[{id:'abcdefghijk',title:'Video one'},{id:'12345678901',title:'Video two'}]};
test('playlist calls authenticated Python with a header token and accepts only complete matching metadata',async()=>{
 const result=await fetchPlaylist(env,{url},async(endpoint,options)=>{assert.equal(String(endpoint),'https://backend.example/v1/playlist');assert(!String(endpoint).includes(env.TRANSCRIPT_BACKEND_TOKEN));assert.equal(options.headers.Authorization,'Bearer '+env.TRANSCRIPT_BACKEND_TOKEN);assert.equal(options.redirect,'manual');return Response.json(data);});assert.equal(result.items.length,2);assert.equal(result.unavailable,1);assert(!JSON.stringify(result).includes('fixture-private-token'));
 for(const bad of [{...data,complete:false},{...data,playlistId:'wrong'},{...data,total:4},{...data,items:[data.items[0],data.items[0]]}])await assert.rejects(fetchPlaylist(env,{url},async()=>Response.json(bad)),e=>e.code==='PLAYLIST_DATA');
});
test('playlist rejects missing backend, malformed links, auth errors and missing deployed endpoint',async()=>{
 await assert.rejects(fetchPlaylist({}, {url}),e=>e.code==='PLAYLIST_NOT_CONFIGURED');await assert.rejects(fetchPlaylist(env,{url:'https://other.example/playlist?list=PLfixturePlaylist123'}),e=>e.code==='PLAYLIST_URL');
 for(const [status,code]of [[401,'PLAYLIST_BACKEND_AUTH'],[403,'PLAYLIST_BACKEND_AUTH'],[404,'PLAYLIST_BACKEND_VERSION'],[429,'PLAYLIST_RATE_LIMIT']])await assert.rejects(fetchPlaylist(env,{url},async()=>new Response('',{status})),e=>e.code===code&&!e.message.includes('fixture-private-token'));
});
test('playlist save is one atomic collection import, preserves scope and level, and never invents captions',async()=>{
 let stored,calls=0;const user={id:'u',role:'user'},binding=createImportBinding({isActive:()=>true,client:{getUser:()=>user,importCollection:async(kind,c,scope,folder)=>{calls++;stored={kind,c,scope,folder};return {recordId:'r',count:c.items.length};}}});
 const input={contentType:'listening',title:'My set',level:'A2',scope:'private',rows:[],youtubeUrl:url,playlistItems:data.items,organizerId:'my-folder'};const saved=await binding.save(input);assert.equal(saved.savedCount,2);assert.equal(saved.captionsPending,true);assert.equal(stored.scope,'private');assert.equal(stored.folder,'my-folder');assert.equal(stored.c.items[0].level,'A2');assert.deepEqual(stored.c.items[0].cues,[]);assert.equal(stored.c.items[0].transcriptComplete,false);
 await assert.rejects(binding.save({...input,playlistItems:[data.items[0],data.items[0]]}));await assert.rejects(binding.save({...input,scope:'public'}));assert.equal(calls,1);
});
