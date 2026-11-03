import test from 'node:test';import assert from 'node:assert/strict';
import {createGrammarBinding} from '../src/core/elio/grammar-binding.js';
import {reviewedGrammar,reviewedExams} from '../src/core/elio/reviewed-import.js';
import {createImportBinding} from '../src/core/elio/import-binding.js';
import {createWritingBinding} from '../src/core/elio/writing-binding.js';
const collection={id:'source-set',name:'Source exam',items:[{id:'source-task',level:'B1',title:'Lesen',exam:'telc',skill:'reading',content:'Source text',questions:[{id:'source-q',prompt:'Was?',options:['A','B'],answer:'B',answerSource:'document'}]}]};
test('grammar binding preserves source identities and revisions; late lessons are discarded',async()=>{
 let id='alice',finish;const sent=[];const client={getUser:()=>({id}),grammar:async()=>({lessons:[{id:'l/1',collectionId:'c/1',title:'Quelle',level:'B1'}]}),grammarLesson:()=>new Promise(r=>finish=r),submitGrammar:async d=>{sent.push(d);return {lessonId:d.lessonId,exerciseId:d.exerciseId,feedback:{correct:true,acceptedAnswers:['ist'],explanation:'Source'}};}};
 const b=createGrammarBinding({client,isActive:()=>true}),rows=await b.catalog();assert.equal(rows[0].key,'c%2F1/l%2F1');const pending=b.lesson(rows[0]);id='bob';finish({id:'l/1',collectionId:'c/1',content:'private',exercises:[],mindmap:{groups:[]}});await assert.rejects(pending,{code:'ACCOUNT_CHANGED'});
 await b.submit({collectionId:'source',id:'lesson'},{id:'exercise',revision:'fingerprint'},'ist');assert.equal(sent[0].revision,'fingerprint');assert.equal(sent[0].correct,undefined);
});
test('reviewed grammar requires real answer keys and preserves canonical IDs',async()=>{
 const c={id:'book-id',name:'Book',items:[{id:'lesson-id',title:'Grammatik',level:'A1',content:'Source lesson',exercises:[{id:'exercise-id',type:'fill',question:'Er ___ hier.',answer:'ist'}]}]};
 const draft=await reviewedGrammar(JSON.stringify(c),'',{title:'New title',level:'B1'});assert.equal(draft._collection.id,'book-id');assert.equal(draft.exercises[0].id,'exercise-id');
 await assert.rejects(reviewedGrammar('Source','[{"type":"quiz","question":"Was?","answer":"A"}]',{title:'T',level:'B1'}));
 await assert.rejects(reviewedGrammar(JSON.stringify({...c,items:[...c.items,...c.items]}),'',{title:'T',level:'B1'}));
});
test('exam previews never add missing sections or answers, and saved source IDs survive title edits',async()=>{
 const previews=reviewedExams(JSON.stringify(collection));assert.equal(previews[0].writingTasks.length,0);assert.equal(previews[0].speakingTasks.length,0);assert.equal(previews[0].reading[0].questions[0].answer,'B');
 const bad=structuredClone(collection);delete bad.items[0].questions[0].answer;assert.throws(()=>reviewedExams(JSON.stringify(bad)));assert.throws(()=>reviewedExams('PDF text with no verified structure'));
 const calls=[];const b=createImportBinding({client:{getUser:()=>({id:'alice',role:'user'}),importCollection:async(k,c)=>{calls.push({k,c});return {recordId:'r',count:c.items.length};}},isActive:()=>true});
 previews[0].title='Reviewed title';await b.save({contentType:'exam',scope:'private',exams:previews});assert.equal(calls[0].c.id,'source-set');assert.equal(calls[0].c.name,'Reviewed title');assert.equal(calls[0].c.items[0].questions[0].id,'source-q');await assert.rejects(b.save({contentType:'exam',scope:'private',exams:[...previews,...previews]}));
});
test('canonical exam writing tasks appear in writing studio without invented tasks',async()=>{
 const client={getUser:()=>({id:'a'}),records:async kind=>kind==='writing'?[]:[{id:'r',level:'B1',data:JSON.stringify({items:[{id:'w',title:'Schreiben',skill:'writing',content:'Schreiben Sie Ihrem Freund.',exam:'telc',level:'B1'},collection.items[0]]})}]};
 const tasks=await createWritingBinding({client,isActive:()=>true}).loadTasks();assert.equal(tasks.length,1);assert.equal(tasks[0].id,'r:w');assert.equal(tasks[0].provider,'telc');
});
