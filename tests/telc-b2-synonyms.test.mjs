// Kiểm chứng dữ liệu telc B2 đã port: đủ nội dung gốc và mọi mục từ vựng
// đều có từ đồng nghĩa (yêu cầu của Elio 2026-11-17).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_ENTRIES } from '../src/data/telc-b2/entries.js';
import { getVocabSynonym, TELC_B2_SYNONYMS } from '../src/data/telc-b2/synonyms.js';
import { DIAG_GROUP } from '../src/data/telc-b2/data-vocab-rich.js';
import { DAYS } from '../src/data/telc-b2/data-plan.js';
import { PLAN_START, PLAN_DAYS } from '../src/data/telc-b2/data-content.js';
import {
  HOEREN_MAX, HOEREN_TEILE, LESEN1_HEADINGS, LESEN1_TEXTS,
  LESEN2_ITEMS, LESEN3_ADS, LESEN3_SITUATIONS, LESEN_MAX,
} from '../src/data/telc-b2/data-diagnostic.js';

test('telc B2: 600 cụm từ theo đúng thứ tự học (200 B1 → 180 chủ đề → 60 nâng cao → 160 B2 telc)', () => {
  assert.equal(ALL_ENTRIES.length, 600);
  assert.equal(ALL_ENTRIES[0].topicId, 101);
  assert.equal(ALL_ENTRIES[199].topicId, 105);
  assert.equal(ALL_ENTRIES[200].topicId, 1);
  assert.equal(ALL_ENTRIES[379].topicId, 10);
  assert.equal(ALL_ENTRIES[380].topicId, 11);
  assert.equal(ALL_ENTRIES[439].topicId, 20);
  assert.equal(ALL_ENTRIES[440].topicId, 201);
  assert.equal(ALL_ENTRIES[599].topicId, 212);
  assert.equal(DAYS.length, 60);
  assert.equal(PLAN_START, '2026-11-16');
  assert.equal(PLAN_DAYS, 60);
});

test('telc B2: mọi mục từ vựng (600 + 56 từ chẩn đoán) đều có từ đồng nghĩa', () => {
  const missing = [];
  for (const e of ALL_ENTRIES) {
    if (!getVocabSynonym(e.rich || e)) missing.push(e.de);
  }
  for (const it of DIAG_GROUP.items) {
    if (!getVocabSynonym(it)) missing.push(`diag:${it.de}`);
  }
  assert.deepEqual(missing, []);
});

test('telc B2: từ đồng nghĩa giữ nguyên giá trị gốc khi mục đã có syn', () => {
  // "weitgehend" vốn đã có syn "größtenteils" trong dữ liệu gốc — phải giữ nguyên.
  assert.equal(getVocabSynonym({ de: 'weitgehend', syn: 'größtenteils' }), 'größtenteils');
  // "die Kunststofffolie" là ví dụ Elio chụp màn hình: trước đây thiếu syn.
  assert.equal(getVocabSynonym({ de: 'die Kunststofffolie' }), 'die Plastikfolie (màng nhựa)');
  assert.equal(getVocabSynonym({ de: 'stattdessen' }), 'anstelle dessen (thay vào đó)');
  for (const [k, v] of Object.entries(TELC_B2_SYNONYMS)) {
    assert.equal(typeof v, 'string', k);
    assert.ok(v.trim().length > 0, k);
  }
});

test('telc B2: đề chẩn đoán đủ 15 câu Đọc + 10 câu Nghe, đáp án trong phạm vi', () => {
  assert.equal(LESEN_MAX, 15);
  assert.equal(HOEREN_MAX, 10);
  assert.equal(LESEN1_TEXTS.length, 5);
  assert.equal(LESEN2_ITEMS.length, 5);
  assert.equal(LESEN3_SITUATIONS.length, 5);
  for (const t of LESEN1_TEXTS) assert.ok(t.correct >= 0 && t.correct < LESEN1_HEADINGS.length, t.id);
  for (const it of LESEN2_ITEMS) assert.ok(it.correct >= 0 && it.correct < it.options.length, it.id);
  const adIds = new Set(LESEN3_ADS.map((a) => a.id));
  for (const s of LESEN3_SITUATIONS) assert.ok(adIds.has(s.correct), s.id);
  let hoerenCount = 0;
  for (const teil of HOEREN_TEILE) {
    for (const it of teil.items) {
      hoerenCount += 1;
      assert.ok(it.correct >= 0 && it.correct < it.options.length, it.id);
    }
  }
  assert.equal(hoerenCount, 10);
});
