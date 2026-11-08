import test from 'node:test';import assert from 'node:assert/strict';
import {listeningNavigationGroups,listeningModeMatches} from '../src/lib/listening-navigation.js';
import {GAME_TYPES,STARTER_WORDS,buildGameDeck,gameWords,normalizeGameAnswer} from '../src/lib/learning-games.js';
test('listening sources group first, preserve level children and never merge an explicitly imported folder',()=>{
 const collections=[{id:'a1',title:'Nicos Weg A1',scope:'public',level:'A1'},{id:'a2',title:'Nicos Weg A2',scope:'public',level:'A2'},{id:'mine',title:'Nicos Weg riêng',organizerId:'own',scope:'private',created_by:'u'},{id:'pod',title:'Postcard',scope:'public'}];
 const groups=listeningNavigationGroups(collections,id=>id==='mine'?[]:[{id,level:id==='a2'?'A2':'A1'}]);assert.equal(groups.length,3);const nico=groups.find(g=>g.title==='Nicos Weg');assert.deepEqual(nico.episodes.map(e=>e.level),['A1','A2']);assert.equal(nico.episodes[1].collectionId,'a2');assert.equal(groups.find(g=>g.id==='mine').episodes.length,0);assert.equal(listeningModeMatches(groups.find(g=>g.title==='Podcast'),'youtube'),false);
});
test('all ten games have usable source-backed rounds; personal mode never silently adds foundation content',()=>{
 assert.equal(GAME_TYPES.length,10);for(const [type]of GAME_TYPES){const deck=buildGameDeck(type,gameWords(STARTER_WORDS));assert(deck.length>0,type);for(const q of deck){assert(q.answer);if(q.options)assert(q.options.includes(q.answer));}}
 for(const type of ['participle','auxiliary','structure','order'])assert.deepEqual(buildGameDeck(type,[],{personal:true}),[]);
 assert.equal(gameWords([{german:'die Tür',vietnamese:'cửa'},{de:'Tür',vi:'cửa'}]).length,1);assert.equal(normalizeGameAnswer('  Straße! '),'straße');assert.notEqual(normalizeGameAnswer('schon'),normalizeGameAnswer('schön'));
});
import {listeningLevels,filterListeningEpisodes} from '../src/lib/listening-navigation.js';
test('each listening set filters by its own available levels, including all, without borrowing another set',()=>{
 const one=[{id:'a',level:'A1',title:'Hallo'},{id:'b',level:'B1',title:'Arbeit'}],two=[{id:'c',level:'C1',title:'Arbeit'}];assert.deepEqual(listeningLevels(one),['A1','B1']);assert.equal(filterListeningEpisodes(one,'ALL').length,2);assert.deepEqual(filterListeningEpisodes(one,'B1','arbeit').map(e=>e.id),['b']);assert.equal(filterListeningEpisodes(one,'C1').length,0);assert.deepEqual(listeningLevels(two),['C1']);
});
