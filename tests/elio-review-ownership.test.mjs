import test from 'node:test';
import assert from 'node:assert/strict';
import { keepOtherAccountElioReview } from '../src/lib/elio-review-ownership.js';

const alice = { id: 'elio_shared_abc', user_id: 'alice', status: 'learned', repetitions: 9 };
const bob = { id: 'elio_shared_abc', user_id: 'bob', status: 'learning', repetitions: 2 };
const legacy = { id: 'elio_shared_abc', user_id: 'usr_student', status: 'new' };

test('same source ID keeps other account review fork intact', () => {
  const records = [alice, bob, legacy];
  const remaining = records.filter(c => keepOtherAccountElioReview(c, 'alice'));
  assert.deepEqual(remaining, [bob, legacy]);
  assert.equal(bob.repetitions, 2);
  assert.equal(alice.repetitions, 9);
});

test('admin bulk deletion cannot remove another user Elio review fork', () => {
  const records = [alice, bob, { id: 'custom_1', user_id: 'bob' }];
  const after = records.filter(c => keepOtherAccountElioReview(c, 'alice') || c.id === 'custom_1');
  assert.equal(after.some(c => c.user_id === 'bob' && c.id === 'elio_shared_abc'), true);
});

test('legacy unauthenticated clearing keeps signed-in Elio reviews', () => {
  assert.equal(keepOtherAccountElioReview(alice, null), true);
  assert.equal(keepOtherAccountElioReview(legacy, null), false);
});

test('ordinary vocabulary cards are outside the shared-review ownership rule', () => {
  assert.equal(keepOtherAccountElioReview({ id: 'card_1', user_id: 'bob' }, 'alice'), false);
});
