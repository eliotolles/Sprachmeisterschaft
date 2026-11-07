import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLessonMarkdown,inlineLesson} from '../src/lib/lesson-markdown.js';
import {buildLevelDecks} from '../src/lib/level-deck-adapter.js';
import {recommendLiveModels} from '../src/core/elio/model-suggestions.js';
import {discoverModels,providerGenerate,PROVIDERS} from '../src/core/elio/ai-providers.js';
test('grammar Markdown preserves paragraphs and formats tables, headings, strong text and lists without HTML execution',()=>{
 const result=parseLessonMarkdown('## Chia động từ\n\n| ich | du |\n| --- | --- |\n| lerne | lernst |\n\n- **Du** lernst.\n\n<script>alert(1)</script>');
 assert.deepEqual(result.map(x=>x.type),['heading','table','ul','paragraph']);
 assert.deepEqual(result[1].rows,[['lerne','lernst']]);
 assert.deepEqual(inlineLesson('**Du** lernst.')[0],{type:'strong',text:'Du'});
 assert.equal(result[3].text,'<script>alert(1)</script>');
});
test('level decks use shared server cards, preserve IDs, exclude other personal cards and do not mutate source',()=>{
 const rows=[{id:'source-1',source_id:'original',german:'lernen',is_shared:true,level:'b1',topic:'Netzwerk',source_deck_id:'book'}, {id:'private',german:'privat',level:'B1'}, {id:'source-2',german:'Haus',is_shared:true,level:'A1',topic:'Goethe'}];
 const before=JSON.stringify(rows),decks=buildLevelDecks([...rows,rows[0]]);
 assert.equal(decks.length,2);assert.equal(decks.reduce((n,d)=>n+d.cardsCount,0),2);
 assert.equal(decks[1].words[0].source_id,'original');assert.equal(decks[1].words[0].id,'source-1');assert.equal(JSON.stringify(rows),before);
 assert.deepEqual(buildLevelDecks([]),[]);
});
test('Elio recommendations never manufacture missing models and prefer actual release metadata over hints',()=>{
 const models=[{provider:'gemini',id:'gemini-3.8-flash',name:'old hint'}, {provider:'gemini',id:'future-model',name:'new model',releaseDate:'2027-01-01'}];
 assert.equal(recommendLiveModels(models)[0].id,'future-model');assert.equal(recommendLiveModels(models).length,2);assert.deepEqual(recommendLiveModels([]),[]);
});
test('all nine official providers have server catalogs; custom URLs remain disallowed',()=>{
 assert.equal(PROVIDERS.length,9);assert(!PROVIDERS.includes('custom'));
});
test('Anthropic discovery paginates with server headers and generation uses Messages',async()=>{
 const original=globalThis.fetch;let pages=0;
 globalThis.fetch=async(url,opts)=>{
  assert.equal(opts.headers['x-api-key'],'fixture-key');assert.equal(opts.redirect,'manual');
  if(String(url).includes('/models')){pages++;return Response.json({data:[{id:'model-'+pages,display_name:'Live '+pages,created_at:'2026-10-01'}],has_more:pages===1,last_id:'model-'+pages});}
  const b=JSON.parse(opts.body);assert.equal(b.system,'system');assert.equal(b.messages[0].content[0].text,'user');return Response.json({content:[{type:'text',text:'{"ok":true}'}],stop_reason:'end_turn'});
 };
 try{const c=await discoverModels('anthropic','fixture-key');assert.equal(c.items.length,2);assert(c.items.every(m=>m.free===false));assert.equal((await providerGenerate('anthropic','fixture-key',c.items[0],{systemPrompt:'system',userPrompt:'user'})).text,'{"ok":true}');}
 finally{globalThis.fetch=original;}
});
test('new provider catalogs preserve live IDs and never label commercial APIs free',async()=>{
 const original=globalThis.fetch;
 try{for(const provider of ['openai','deepseek','mistral','cerebras','together']){
  globalThis.fetch=async()=>Response.json(provider==='together'?[{id:'live-model'}]:{data:[{id:'live-model'}]});
  const c=await discoverModels(provider,'fixture-key');assert.equal(c.items[0].id,'live-model');assert.notEqual(c.items[0].free,true);
  if(['openai','deepseek','together'].includes(provider))assert.equal((await discoverModels(provider,'fixture-key',{freeOnly:true})).items.length,0);
 }}finally{globalThis.fetch=original;}
});
test('OpenAI generation uses completion-token budget without unsupported fixed temperature',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async(url,opts)=>{assert.equal(String(url),'https://api.openai.com/v1/chat/completions');const b=JSON.parse(opts.body);assert.equal(b.max_tokens,undefined);assert.equal(b.temperature,undefined);assert(b.max_completion_tokens);return Response.json({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]});};
 try{assert.equal((await providerGenerate('openai','fixture',{id:'available-model'},{systemPrompt:'s',userPrompt:'u'})).truncated,false);}finally{globalThis.fetch=original;}
});

test('uncategorized and range-level source words remain visible without inventing a CEFR level',()=>{
 const rows=[{id:'unknown',german:'Wort',is_shared:true,level:''},{id:'range',german:'lernen',is_shared:true,level:'A2–B1'}];
 const decks=buildLevelDecks(rows);assert.equal(decks.reduce((n,d)=>n+d.cardsCount,0),2);
 assert.deepEqual(decks.find(d=>d.words[0].id==='range').levels,['A2','B1']);
 assert.deepEqual(decks.find(d=>d.words[0].id==='unknown').levels,[]);
 assert.equal(rows[0].level,'');
});

import {readFileSync} from 'node:fs';
test('deploy retains owner-managed Dashboard variables',()=>{const config=JSON.parse(readFileSync(new URL('../wrangler.json',import.meta.url),'utf8'));assert.equal(config.keep_vars,true);});

test('a 300-word source deck stays complete when its words span different CEFR levels',()=>{
 const rows=Array.from({length:300},(_,index)=>({
  id:'word-'+index,german:'Wort '+index,is_shared:true,
  source_deck_id:'one-source-file',topic:'Đầu bếp',level:['A1','A2','B1','B2'][index%4],
 }));
 const decks=buildLevelDecks(rows);
 assert.equal(decks.length,1);
 assert.equal(decks[0].cardsCount,300);
 assert.equal(decks[0].words.length,300);
 assert.deepEqual(decks[0].levels,['A1','A2','B1','B2']);
 assert.equal(new Set(decks[0].words.map(word=>word.id)).size,300);
});
