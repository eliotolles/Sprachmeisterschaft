import test from 'node:test';import assert from 'node:assert/strict';import {comparePixels} from '../scripts/qa/pixel-compare.mjs';
test('visual comparison tolerates only bounded Chromium channel rounding, never dimensions or layout',()=>{
 const a={width:10,height:10,data:new Uint8Array(400).fill(128)},b={...a,data:a.data.slice()};assert.equal(comparePixels(a,b).equal,true);b.data[0]=130;assert.equal(comparePixels(a,b).equal,true);b.data[0]=131;assert.equal(comparePixels(a,b).equal,false);b.data[0]=128;for(let i=0;i<21;i++)b.data[i*4]=129;assert.equal(comparePixels(a,b).equal,false);assert.equal(comparePixels(a,{...b,width:9}).equal,false);
});
test('presentation comparison requires exact DOM and bounds compositor-only noise',async()=>{
 const {comparePresentation}=await import('../scripts/qa/pixel-compare.mjs');const a={width:20,height:20,data:new Uint8Array(1600).fill(128)},b={...a,data:a.data.slice()};b.data[0]=144;assert.equal(comparePresentation(a,b,true).equal,true);assert.equal(comparePresentation(a,b,false).equal,false);b.data[0]=145;assert.equal(comparePresentation(a,b,true).equal,false);b.data.fill(128);for(let i=0;i<101;i++)b.data[i*4]=129;assert.equal(comparePresentation(a,b,true).equal,false);assert.equal(comparePresentation(a,{...b,width:19},true).equal,false);
});
