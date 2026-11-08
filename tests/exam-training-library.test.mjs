import test from 'node:test';import assert from 'node:assert/strict';
import {examTrainingSets,filterExamTrainingSets} from '../src/lib/exam-training-library.js';
const row=(id,kind,examBoard,level,organizerId,extra={})=>({id,kind,title:id,level,data:JSON.stringify({examBoard,organizerId,items:[{id:'part',title:id+' Teil 1',skill:kind==='exam'?'reading':kind,questionCount:5}],...extra})});
test('exam training joins only explicit common folders, preserving exam and level boundaries',()=>{
 const sets=examTrainingSets([row('r','reading','telc','B1','folder'),row('w','writing','telc','B1','folder'),row('g','reading','Goethe','B1','folder'),row('b','reading','telc','B2','folder'),row('u','reading','telc','B1',null)],[{id:'folder',name:'My source set'}]);
 assert.equal(sets.length,4);const grouped=sets.find(s=>s.records.length===2);assert.equal(grouped.title,'My source set');assert.equal(grouped.parts.length,2);assert.equal(grouped.parts[0].questions,5);assert.equal(grouped.parts[0].recordId,'r');assert.equal(grouped.parts[0].sectionId,'part');
});
test('exam filters combine provider, level, skill, status and search without deleting missing parts',()=>{
 const sets=examTrainingSets([row('PETRA','reading','telc','B1',null,{progress:{startedAt:1,answeredIds:['part:1']}}),row('EVA','exam','Goethe','B1',null,{progress:{submitted:true}}),row('SOPHIE','reading','telc','B2',null)]);
 const result=filterExamTrainingSets(sets,{exam:'telc',level:'B1',skill:'reading',status:'progress',query:'petra'});assert.equal(result.length,1);assert.equal(result[0].parts[0].answered,1);assert.equal(result[0].parts.length,1);assert.equal(filterExamTrainingSets(sets,{exam:'telc',skill:'speaking'}).length,0);
});
