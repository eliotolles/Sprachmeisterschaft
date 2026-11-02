// Business logic extracted from ElioEinfachlernen- public/js/srs.js,
// cloudflare-return bd5179107363ebcc19764454b08d7c94acd1a289. No DOM or storage access.
export const RATINGS = Object.freeze(['again', 'hard', 'good', 'easy']);
export function scheduleReview(previous, rating, now = Date.now()) {
  if (!RATINGS.includes(rating)) throw new TypeError('Invalid SRS rating');
  if (!Number.isSafeInteger(now) || now < 0) throw new TypeError('Invalid review timestamp');
  const p = { repetitions: 0, intervalDays: 0, ease: 2.5, lapses: 0, ...(previous || {}) };
  if (!Number.isSafeInteger(p.repetitions) || p.repetitions < 0 || !Number.isSafeInteger(p.lapses) || p.lapses < 0 ||
      !Number.isSafeInteger(p.intervalDays) || p.intervalDays < 0 || !Number.isFinite(p.ease) || p.ease < 1.3 || p.ease > 3) {
    throw new TypeError('Invalid stored SRS state');
  }
  const next = { ...p };
  if (rating === 'again') {
    next.repetitions = 0;
    next.intervalDays = 0;
    next.lapses++;
    next.ease = Math.max(1.3, p.ease - 0.2);
    next.dueAt = now + 10 * 60000;
  } else {
    next.repetitions++;
    if (rating === 'hard') {
      next.intervalDays = Math.max(1, Math.round((p.intervalDays || 1) * 1.2));
      next.ease = Math.max(1.3, p.ease - 0.15);
    } else if (rating === 'easy') {
      next.intervalDays = p.intervalDays ? Math.max(p.intervalDays + 1, Math.round(p.intervalDays * p.ease * 1.3)) : 4;
      next.ease = Math.min(3, p.ease + 0.15);
    } else {
      next.intervalDays = p.repetitions === 0 ? 1 : p.repetitions === 1 ? 3 : Math.max(p.intervalDays + 1, Math.round(p.intervalDays * p.ease));
    }
    next.dueAt = now + next.intervalDays * 86400000;
  }
  next.lastReviewedAt = now;
  if (!Number.isSafeInteger(next.dueAt)) throw new TypeError('SRS interval exceeds supported range');
  return next;
}

// Adapter for the existing Sprachmeisterschaft card field names. Rendering is unchanged.
export function toSprachReview(state) {
  if (!state || !Number.isSafeInteger(state.dueAt)) throw new TypeError('Invalid SRS state');
  const date = new Date(state.dueAt);
  const dueDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return {
    ease_factor: Number(state.ease.toFixed(2)), interval_days: state.intervalDays,
    repetitions: state.repetitions, lapses: state.lapses, due_at: state.dueAt, due_date: dueDate,
    status: state.intervalDays >= 21 ? 'mastered' : state.repetitions === 0 ? 'learning' : 'review',
  };
}
