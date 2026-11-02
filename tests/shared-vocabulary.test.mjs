import test from 'node:test';
import assert from 'node:assert/strict';
import { mapSharedElioCard, mergePersonalAndSharedVocabulary } from '../src/lib/shared-vocabulary.js';

const row = {
  source_id: 'abc',
  german: 'Haus',
  vietnamese: 'nhà',
  extra_json: JSON.stringify({ english: 'house', synonyms: ['Gebäude'] }),
};

test('shared records preserve extra fields without inheriting personal progress', () => {
  const mapped = mapSharedElioCard(row);
  assert.equal(mapped.id, 'elio_shared_abc');
  assert.equal(mapped.english, 'house');
  assert.equal(mapped.is_shared, true);
  for (const field of ['user_id', 'status', 'due_date', 'repetitions']) {
    assert.equal(Object.hasOwn(mapped, field), false);
  }
});

test('merge does not mutate or overwrite personal records', () => {
  const personal = [{ id: 'mine', german: 'Baum', user_id: 'user1', status: 'learned' }];
  const merged = mergePersonalAndSharedVocabulary(personal, [row, row]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0], personal[0]);
  assert.equal(personal.length, 1);
});

test('invalid records fail closed', () => {
  assert.throws(() => mapSharedElioCard({ german: 'Haus' }));
  assert.throws(() => mapSharedElioCard({
    source_id: 'a', german: 'Haus', extra_json: '{',
  }));
});

test('two accounts can fork the same shared ID without sharing review state', () => {
  const shared = { ...row };
  const alice = { id: 'elio_shared_abc', user_id: 'alice', german: 'Haus', status: 'learned', repetitions: 9 };
  const bob = { id: 'elio_shared_abc', user_id: 'bob', german: 'Haus', status: 'learning', repetitions: 2 };
  const forAlice = mergePersonalAndSharedVocabulary([alice], [shared]);
  const forBob = mergePersonalAndSharedVocabulary([bob], [shared]);
  const forNewUser = mergePersonalAndSharedVocabulary([], [shared]);
  assert.equal(forAlice.length, 1);
  assert.equal(forBob.length, 1);
  assert.equal(forNewUser.length, 1);
  assert.equal(forAlice[0].repetitions, 9);
  assert.equal(forBob[0].repetitions, 2);
  assert.equal(Object.hasOwn(forNewUser[0], 'repetitions'), false);
  assert.equal(forNewUser[0].is_shared, true);
});
