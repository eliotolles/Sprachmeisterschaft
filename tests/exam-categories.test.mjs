import test from 'node:test';import assert from 'node:assert/strict';
import {recordExamCategory,recordMatchesSkill,examCategory} from '../src/lib/exam-categories.js';
test('exam grouping respects explicit metadata and never guesses from the passage',()=>{
 assert.equal(recordExamCategory({title:'Goethe B1',data:{examBoard:'telc'}}),'telc');
 assert.equal(recordExamCategory({title:'Petra',data:JSON.stringify({sourceBundle:'reading-screenshots-20261107'})}),'telc');
 assert.equal(recordExamCategory({title:'Bài đọc',data:{items:[{content:'Goethe telc'}]}}),'unclassified');
 assert.equal(recordExamCategory({title:'ÖSD B1'}),'ÖSD');
 assert.equal(recordExamCategory({data:{items:[{exam:'Goethe'},{exam:'telc'}]}}),'unclassified');
 assert.equal(recordExamCategory({data:{examBoard:'general'}}),'general');
 assert.equal(examCategory('unknown'),null);
});
test('task filtering separates the skills inside a combined exam',()=>{
 const row={kind:'exam',data:JSON.stringify({items:[{skill:'reading'},{skill:'sprachbausteine'}]})};
 assert.equal(recordMatchesSkill(row,'reading'),true);assert.equal(recordMatchesSkill(row,'sprachbausteine'),true);assert.equal(recordMatchesSkill(row,'listening'),false);
 assert.equal(recordMatchesSkill({kind:'speaking'},'speaking'),true);
});
import {createImportBinding} from '../src/core/elio/import-binding.js';
test('import saves the selected exam separately from the unchanged source content',async()=>{
 let saved;const b=createImportBinding({isActive:()=>true,client:{getUser:()=>({id:'u',role:'user'}),importCollection:async(kind,collection)=>{saved=collection;return {recordId:'r',count:collection.items.length};}}});
 const input={contentType:'reading',title:'My reading',level:'B1',scope:'private',rawText:'Original passage',examBoard:'telc'};
 await b.save(input);assert.equal(saved.examBoard,'telc');assert.equal(saved.items[0].content,'Original passage');
 await assert.rejects(b.save({...input,examBoard:'made-up'}));
});
