import test from 'node:test';import assert from 'node:assert/strict';import {speechBlob,createSpeechPlayer,createGermanRecorder} from '../src/core/elio/browser-audio.js';
const turn=()=>new Promise(r=>setImmediate(r));
test('Gemini little-endian PCM is wrapped with a valid WAV header; unknown audio is rejected',async()=>{
 const blob=speechBlob({mimeType:'audio/L16;codec=pcm;rate=24000',data:btoa('\x01\x02\x03\x04')});const bytes=await blob.arrayBuffer(),view=new DataView(bytes);assert.equal(blob.type,'audio/wav');assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(view.getUint32(24,true),24000);assert.equal(view.getUint32(40,true),4);assert.deepEqual([...new Uint8Array(bytes.slice(44))],[1,2,3,4]);assert.throws(()=>speechBlob({mimeType:'audio/L16',data:btoa('x')}));assert.throws(()=>speechBlob({mimeType:'text/html',data:btoa('html')}));
});
test('TTS playback releases URLs and propagates playback failure; previous accounts never play',async()=>{
 let id='a',audio,finish;const urls={createObjectURL:()=> 'blob:fixture',revokeObjectURL:()=>{urls.released++;},released:0};const client={getUser:()=>({id}),speakGerman:async()=>({mimeType:'audio/wav',data:btoa('fixture')})};
 const player=createSpeechPlayer({client,urls,makeAudio:()=>audio={play:async()=>{},pause:()=>{}}});const p=player.play('Deutsch');await turn();audio.onended();await p;assert.equal(urls.released,1);
 const failure=player.play('Deutsch');await turn();audio.onerror();await assert.rejects(failure,/chưa phát/);assert.equal(urls.released,2);
 client.speakGerman=()=>new Promise(r=>finish=r);const late=player.play('private');id='b';finish({mimeType:'audio/wav',data:btoa('x')});await assert.rejects(late,{code:'ACCOUNT_CHANGED'});
});
test('microphone permission races close tracks and do not transcribe for the next account',async()=>{
 let id='a',grant,stopped=0,calls=0;const record=createGermanRecorder({client:{getUser:()=>({id}),transcribeGerman:async()=>calls++},media:()=>({getUserMedia:()=>new Promise(r=>grant=r)}),Recorder:class {}});
 const p=record.start({onText:()=>assert.fail('late transcript'),onState:()=>{},onError:()=>{}});id='b';record.cancel();grant({getTracks:()=>[{stop:()=>stopped++}]});await p;assert.equal(stopped,1);assert.equal(calls,0);
});
test('microphone sends real captured bytes once and returns a transcript for review',async()=>{
 let instance,stopped=0;class Recorder{static isTypeSupported(){return true;}constructor(){instance=this;this.state='inactive';}start(){this.state='recording';}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable({data:new Blob(['actual audio'])});this.onstop();});}}
 const sent=[],states=[],texts=[];const recorder=createGermanRecorder({client:{getUser:()=>({id:'a'}),transcribeGerman:async d=>{sent.push(d);return {language:'de',text:'Ich lerne Deutsch.'};}},media:()=>({getUserMedia:async()=>({getTracks:()=>[{stop:()=>stopped++}]})}),Recorder});
 await recorder.start({onText:t=>texts.push(t),onState:s=>states.push(s),onError:e=>assert.fail(e.message)});recorder.stop();await turn();await turn();assert.equal(sent.length,1);assert.equal(atob(sent[0].data),'actual audio');assert.deepEqual(texts,['Ich lerne Deutsch.']);assert.deepEqual(states,['recording','transcribing','idle']);assert(stopped>0);recorder.cancel();
});
