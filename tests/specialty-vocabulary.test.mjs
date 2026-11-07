import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceSpecialtyWords} from '../src/lib/specialty-vocabulary.js';

test('specialty pages use all source words and retain their real levels and IDs',()=>{
 const words=Array.from({length:300},(_,i)=>({id:String(i),is_shared:true,topic:'Đầu bếp · Koch/Köchin',german:'Wort '+i,level:i%2?'B1':'A1'}));
 const result=sourceSpecialtyWords([...words,words[0],{id:'personal',german:'privat',topic:'Đầu bếp'}],{vi:'Đầu bếp'});
 assert.equal(result.length,300);
 assert.equal(result[299].id,'299');
 assert.equal(result[299].level,'B1');
 assert.deepEqual(sourceSpecialtyWords(words,{vi:'Điều dưỡng'}),[]);
});
