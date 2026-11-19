// SITUATIONS-GAME — Mẫu câu giao tiếp thực tế cho trò chơi.
// Nguồn: situations-game-a/b/c.js (10 chủ đề, 60 mẫu câu).
// Mỗi mẫu = 1 formula + 6 examples + 4 exercises + 2 dialogue
//   + 1 câu hỏi MCQ + 4 lựa chọn MCQ = 18 câu Đức.
import {SITUATION_TOPICS_A} from './situations-game-a.js';
import {SITUATION_TOPICS_B} from './situations-game-b.js';
import {SITUATION_TOPICS_C} from './situations-game-c.js';

export const SITUATION_TOPICS = [...SITUATION_TOPICS_A, ...SITUATION_TOPICS_B, ...SITUATION_TOPICS_C];

export const SITUATION_PATTERNS = SITUATION_TOPICS.flatMap((t) =>
  t.patterns.map((p) => ({...p, topic: t.id, topicTitle: t.title})),
);

// Mọi câu Đức dùng cho trò Dịch câu + Xếp câu (mỗi câu 1 lần —
// hai mẫu ở hai chủ đề có thể trùng câu, chỉ giữ lại một).
const _allSentences = SITUATION_PATTERNS.flatMap((p) => [
  {
    de: p.formula,
    vi: p.vi,
    hint: (p.vocab || []).map((v) => v[0]).join(' • '),
    topic: p.topic,
    topicTitle: p.topicTitle,
    pattern: p.formula,
    patternVi: p.vi,
    note: p.note,
    kind: 'formula',
  },
  ...p.examples.map((e) => ({
    de: e.de,
    vi: e.vi,
    hint: '',
    topic: p.topic,
    topicTitle: p.topicTitle,
    pattern: p.formula,
    patternVi: p.vi,
    note: p.note,
    kind: 'example',
  })),
  ...p.exercises.map((e) => ({
    de: e.de,
    vi: e.vi,
    hint: e.hint || '',
    topic: p.topic,
    topicTitle: p.topicTitle,
    pattern: p.formula,
    patternVi: p.vi,
    note: p.note,
    kind: 'exercise',
  })),
  ...p.dialogue.map((d) => ({
    de: d.de,
    vi: d.vi,
    hint: '',
    topic: p.topic,
    topicTitle: p.topicTitle,
    pattern: p.formula,
    patternVi: p.vi,
    note: p.note,
    kind: 'dialogue',
  })),
]);

const _seenSentences = new Set();
export const SITUATION_SENTENCES = _allSentences.filter((s) => {
  if (_seenSentences.has(s.de)) return false;
  _seenSentences.add(s.de);
  return true;
});

export const SITUATION_MCQS = SITUATION_PATTERNS.map((p) => ({
  ...p.mcq,
  topic: p.topic,
  topicTitle: p.topicTitle,
  pattern: p.formula,
}));

export const SITUATION_STATS = {
  topics: SITUATION_TOPICS.length,
  patterns: SITUATION_PATTERNS.length,
  // Tổng số câu Đức: câu trong kho luyện + câu hỏi và lựa chọn MCQ.
  sentences: SITUATION_SENTENCES.length + SITUATION_MCQS.length * 5,
};
