import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleReview, toSprachReview } from '../src/core/elio/srs.js';
const now = Date.UTC(2026, 10, 2, 12);
test('Elio ratings preserve 10-minute Again and distinct Hard/Good/Easy schedules', () => {
  const expected = { again: 10 * 60000, hard: 86400000, good: 86400000, easy: 4 * 86400000 };
  for (const [rating, delay] of Object.entries(expected)) {
    const result = scheduleReview(null, rating, now);
    assert.equal(result.dueAt, now + delay); assert.equal(result.lastReviewedAt, now);
    assert.equal(result.repetitions, rating === 'again' ? 0 : 1);
    assert.equal(result.lapses, rating === 'again' ? 1 : 0);
  }
});
test('later reviews follow Elio intervals without mutating previous progress', () => {
  const old = { repetitions: 2, intervalDays: 10, ease: 2.5, lapses: 3 };
  const copy = structuredClone(old);
  assert.equal(scheduleReview(old, 'hard', now).intervalDays, 12);
  assert.equal(scheduleReview(old, 'good', now).intervalDays, 25);
  assert.equal(scheduleReview(old, 'easy', now).intervalDays, 33);
  assert.equal(scheduleReview(old, 'again', now).lapses, 4);
  assert.deepEqual(old, copy);
  assert.equal(scheduleReview({ ...old, repetitions: 1 }, 'good', now).intervalDays, 3);
});
test('ease bounds and validation prevent corrupt schedules from being saved', () => {
  assert.equal(scheduleReview({ ease: 1.3 }, 'again', now).ease, 1.3);
  assert.equal(scheduleReview({ ease: 3 }, 'easy', now).ease, 3);
  for (const input of [{ ease: NaN }, { ease: 0 }, { repetitions: -1 }, { intervalDays: Infinity }, { lapses: -1 }]) assert.throws(() => scheduleReview(input, 'good', now));
  assert.throws(() => scheduleReview(null, 'invented', now));
  assert.throws(() => scheduleReview(null, 'good', -1));
});
test('existing card adapter preserves timestamp precision and field names', () => {
  const result = toSprachReview(scheduleReview(null, 'again', now));
  assert.equal(result.due_at, now + 600000); assert.equal(result.status, 'learning'); assert.equal(result.interval_days, 0);
  assert.equal(toSprachReview(scheduleReview({ repetitions: 2, intervalDays: 10 }, 'good', now)).status, 'mastered');
});
