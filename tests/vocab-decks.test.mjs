import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevelDecks } from '../src/lib/level-deck-adapter.js';
import { createVocabularyBinding } from '../src/core/elio/vocabulary-binding.js';

const shared = (id, german, level, topic) => ({ id, german, is_shared: true, level, topic, source_id: id });

test('level decks sort by CEFR rank (unlevelled last), words sort by level then A-Z German', () => {
  const cards = [
    shared('c1', 'Wort C1', 'C1', 'Thema C1'),
    shared('c2', 'Wort A2', 'A2', 'Thema A2'),
    shared('c3', 'Wort B1', 'B1', 'Thema B1'),
    shared('c4', 'Wort A1', 'A1', 'Thema A1'),
    shared('c5', 'Wort frei', '', 'Thema frei'),
    shared('c6', 'Wort B2', 'B2', 'Thema B2'),
    shared('c7', 'Wort range', 'A2–B1', 'Thema range'),
    shared('c8', 'Wort C2', 'C2', 'Thema C2'),
    shared('m1', 'Zebra', 'A1', 'Tiere'),
    shared('m2', 'Apfel', 'A1', 'Tiere'),
    shared('m3', 'Äpfel', 'A1', 'Tiere'),
    shared('m4', 'Haus', 'A1', 'Tiere'),
  ];
  const decks = buildLevelDecks(cards, {});
  assert.deepEqual(decks.map((d) => d.level), ['A1', 'A1', 'A2', 'A2 / B1', 'B1', 'B2', 'C1', 'C2', 'Chưa phân cấp']);
  const tiere = decks.find((d) => d.title === 'Tiere');
  assert.deepEqual(tiere.words.map((w) => w.german), ['Apfel', 'Äpfel', 'Haus', 'Zebra']);
});

test('decks with the same title stay independent when deleting by id only', () => {
  const cards = [
    shared('a1', 'Haus', 'A1', 'Gia đình'),
    shared('b1', 'Arbeit', 'B1', 'Gia đình'),
  ];
  // Same topic + different source -> two decks sharing one title.
  const rows = [
    { ...cards[0], source_deck_id: 'book-1' },
    { ...cards[1], source_deck_id: 'book-2' },
  ];
  const decks = buildLevelDecks(rows, {});
  assert.equal(decks.length, 2);
  assert.equal(decks[0].title, decks[1].title);
  const deleted = [decks[0].id]; // id-only filter, as readDecks now does
  const remaining = decks.filter((d) => !deleted.includes(d.id));
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, decks[1].id);
});

function mockClient({ role = 'admin' } = {}) {
  const calls = [];
  let sharedRows = [
    { source_id: 's1', german: 'Haus', vietnamese: 'nhà', level: 'A1', extra_json: '{}' },
    { source_id: 's2', german: 'Mutter', vietnamese: 'mẹ', level: 'A1', extra_json: '{}' },
  ];
  let deckWords = [{ id: 'w1', de: 'Tisch', vi: 'bàn', level: 'A2' }];
  const client = {
    getUser: () => ({ id: 'elio', role }),
    vocabulary: async () => [...sharedRows],
    records: async () => [{ id: 'deck-priv', public: 0, data: JSON.stringify({ words: deckWords }) }],
    loadState: async () => ({}),
    vocabularyDeck: async () => ({ canEdit: true, revision: 'r1' }),
    editVocabulary: async (input) => {
      calls.push(input);
      if (input.action === 'deleteShared') {
        if (role !== 'admin') throw Object.assign(new Error('Chỉ Admin được xóa từ trong nguồn chung.'), { code: 'ADMIN_REQUIRED' });
        sharedRows = sharedRows.filter((r) => !input.wordIds.includes(r.source_id));
        return { userId: 'elio', deleted: input.wordIds };
      }
      deckWords = deckWords.filter((w) => !input.wordIds.includes(w.id));
      return { userId: 'elio', deckId: input.deckId, deleted: input.wordIds };
    },
  };
  return { client, calls };
}

const legacyStub = { findMany: () => [], findById: () => null, update: () => { throw new Error('no local'); }, create: () => { throw new Error('no local'); }, createMany: () => { throw new Error('no local'); }, delete: () => { throw new Error('no local'); }, clearAll: () => { throw new Error('no local'); }, deleteByTopic: () => {}, deleteByLevel: () => {} };

test('deleteMany deletes a whole deck in one server call per group and reports failures honestly', async () => {
  const { client, calls } = mockClient({ role: 'admin' });
  const binding = createVocabularyBinding({ client, legacy: legacyStub, isActive: () => true });
  await binding.hydrate();
  const cards = binding.api.findMany();
  assert.equal(cards.length, 3);
  // 2 shared words (one group) + 1 private deck word (one group) = 2 calls.
  await binding.api.deleteMany(cards.map((c) => c.id));
  assert.equal(calls.length, 2);
  assert.equal(calls.filter((c) => c.action === 'deleteShared').length, 1);
  assert.equal(calls.filter((c) => c.action === 'delete').length, 1);
  assert.equal(binding.api.findMany().length, 0);
});

test('deleteMany of shared words as non-admin rejects instead of pretending success', async () => {
  const { client } = mockClient({ role: 'user' });
  const binding = createVocabularyBinding({ client, legacy: legacyStub, isActive: () => true });
  await binding.hydrate();
  const sharedCard = binding.api.findMany().find((c) => c.id.startsWith('elio_shared_'));
  await assert.rejects(binding.api.deleteMany([sharedCard.id]), (e) => e.code === 'ADMIN_REQUIRED');
  assert.equal(binding.api.findMany().length, 3);
});
