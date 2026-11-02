import test from 'node:test';import assert from 'node:assert/strict';import {comparePixels} from '../scripts/qa/pixel-compare.mjs';
test('visual comparison tolerates only bounded Chromium channel rounding, never dimensions or layout',()=>{
 const a={width:10,height:10,data:new Uint8Array(400).fill(128)},b={...a,data:a.data.slice()};assert.equal(comparePixels(a,b).equal,true);b.data[0]=130;assert.equal(comparePixels(a,b).equal,true);b.data[0]=131;assert.equal(comparePixels(a,b).equal,false);b.data[0]=128;for(let i=0;i<21;i++)b.data[i*4]=129;assert.equal(comparePixels(a,b).equal,false);assert.equal(comparePixels(a,{...b,width:9}).equal,false);
});
