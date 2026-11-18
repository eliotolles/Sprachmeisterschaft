import test from 'node:test';import assert from 'node:assert/strict';
import {wordTypeAbbr} from '../src/lib/word-type.js';
test('word type abbreviations shown next to the word in the lookup popup',()=>{
  assert.equal(wordTypeAbbr({word_type:'Adjektiv'}),'adj.');
  assert.equal(wordTypeAbbr({word_type:'adjective'}),'adj.');
  assert.equal(wordTypeAbbr({word_type:'Substantiv'},'der'),'n.');
  assert.equal(wordTypeAbbr({word_type:'noun'}),'n.');
  assert.equal(wordTypeAbbr({word_type:'Verb'}),'v.');
  assert.equal(wordTypeAbbr({word_type:'verb'}),'v.');
  assert.equal(wordTypeAbbr({word_type:'Adverb'}),'adv.');
  assert.equal(wordTypeAbbr({word_type:'Präposition'}),'prep.');
  assert.equal(wordTypeAbbr({word_type:'Konjunktion'}),'konj.');
  assert.equal(wordTypeAbbr({word_type:'Artikel'}),'art.');
  // Không bịa: từ loại lạ hiện nguyên, trống thì suy ra từ mạo từ, còn không thì để trống.
  assert.equal(wordTypeAbbr({word_type:'phrase'}),'phrase');
  assert.equal(wordTypeAbbr({},'der'),'n.');
  assert.equal(wordTypeAbbr({},'die'),'n.');
  assert.equal(wordTypeAbbr({},''),'');
  assert.equal(wordTypeAbbr(null),'');
});
