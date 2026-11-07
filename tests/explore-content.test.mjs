import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPLORE_LESSONS} from '../src/data/explore-lessons.js';
import {COLLECTION_SKILLS,collectionAccepts,collectionRoute} from '../src/lib/collection-types.js';

test('exploration includes every requested topic with real lesson bodies or working application routes',()=>{
 assert.equal(EXPLORE_LESSONS.length,13);
 assert.equal(new Set(EXPLORE_LESSONS.map(item=>item.id)).size,13);
 for(const lesson of EXPLORE_LESSONS){
  if(lesson.route){assert(lesson.route.startsWith('/'));assert(lesson.action);continue;}
  assert(lesson.cards.length>=3);
  assert(lesson.sources.length>0);
  for(const card of lesson.cards){assert(card.rule.trim());assert(card.examples.length>0);assert(card.examples.every(pair=>pair.length===2&&pair.every(value=>value.trim())));}
  assert(Number.isInteger(lesson.quiz.answer));
  assert(lesson.quiz.options[lesson.quiz.answer]);
  assert(lesson.quiz.explanation.trim());
 }
});
test('collection routes retain their scope and skill acceptance rejects incompatible sources',()=>{
 for(const skill of Object.keys(COLLECTION_SKILLS))assert(collectionRoute(skill,'source-id').includes('collection=source-id'));
 assert(collectionAccepts('vocabulary','vocab'));
 assert(collectionAccepts('reading','exam'));
 assert(collectionAccepts('pronunciation','speaking'));
 assert(!collectionAccepts('grammar','vocab'));
});
