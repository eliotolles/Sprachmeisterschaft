// Danh sách 600 cụm từ telc B2 theo thứ tự học chuẩn + hằng số Leitner.
// Tách riêng khỏi VocabTab.jsx để node:test có thể import trực tiếp (không JSX).
import { VOCAB_TOPICS } from './data-plan.js';
import { B1_GROUPS, B2_TELC_TOPICS } from './data-vocab-rich.js';
import { TOPIC_PLUS } from './data-vocab-plus.js';

export const DAILY_NEW = 28; // 25-30 từ mới mỗi ngày theo lộ trình
export const LEITNER_INTERVALS = [1, 2, 4, 7, 14, 30];

export const entryKey = (e) => `${e.topicId}:${e.itemIndex}`;

/** Thứ tự học: 200 nền B1 → 180 chủ đề gốc → 60 nâng cao theo chủ đề → 160 B2 telc = 600 cụm. */
export const ALL_ENTRIES = [
  ...B1_GROUPS.flatMap((g) => g.items.map((it, i) => ({ topicId: g.id, itemIndex: i, de: it.de, vi: it.vi, rich: it }))),
  ...VOCAB_TOPICS.flatMap((t) => t.items.map((it, i) => ({ topicId: t.id, itemIndex: i, de: it.de, vi: it.vi }))),
  ...VOCAB_TOPICS.flatMap((t) => (TOPIC_PLUS[t.id] ?? []).map((it, i) => ({ topicId: t.id + 10, itemIndex: i, de: it.de, vi: it.vi }))),
  ...B2_TELC_TOPICS.flatMap((g) => g.items.map((it, i) => ({ topicId: g.id, itemIndex: i, de: it.de, vi: it.vi, rich: it }))),
];
