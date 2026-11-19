import test from 'node:test';
import assert from 'node:assert/strict';
import { batchTranslateCues, translateLinesWithAI, translateTextLines } from '../src/lib/translator.js';

const cues = (n) =>
  Array.from({ length: n }, (_, i) => ({
    _id: `cue-${i}`,
    start: i * 2,
    end: i * 2 + 1.5,
    de: `Câu tiếng Đức số ${i + 1}`,
    vi: '',
  }));

// Google Translate (gtx) trả về data[0] là mảng các đoạn [bản dịch, gốc].
function stubGoogleFetch(translatedJoined) {
  const prev = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [[[translatedJoined, 'gốc']]],
  });
  return () => { globalThis.fetch = prev; };
}

test('AI dịch đúng thứ tự/số lượng và giữ nguyên start/end/de/_id', async () => {
  const calls = [];
  const aiGenerate = async ({ userPrompt }) => {
    calls.push(userPrompt);
    const count = (userPrompt.match(/^\d+\. /gm) || []).length;
    return { translations: Array.from({ length: count }, (_, i) => `Dịch AI ${i + 1}`) };
  };
  const progress = [];
  const result = await batchTranslateCues(cues(25), (done, total) => progress.push([done, total]), { aiGenerate });
  // 25 câu chia 2 nhóm 20 + 5, mỗi nhóm AI trả đúng thứ tự trong nhóm.
  assert.equal(calls.length, 2);
  assert.deepEqual(progress, [[20, 25], [25, 25]]);
  assert.equal(result.length, 25);
  for (let i = 0; i < 25; i++) {
    assert.equal(result[i].vi, `Dịch AI ${(i % 20) + 1}`);
    assert.equal(result[i].start, i * 2);
    assert.equal(result[i].end, i * 2 + 1.5);
    assert.equal(result[i].de, `Câu tiếng Đức số ${i + 1}`);
    assert.equal(result[i]._id, `cue-${i}`);
  }
});

test('AI lỗi thì rơi về Google Dịch theo nhóm', async () => {
  const restore = stubGoogleFetch('Dịch A\nDịch B');
  try {
    const aiGenerate = async () => { throw new Error('AI hết quota'); };
    const result = await batchTranslateCues(
      [{ start: 0, end: 1, de: 'Guten Tag', vi: '' }, { start: 1, end: 2, de: 'Wie geht es dir?', vi: '' }],
      undefined,
      { aiGenerate },
    );
    assert.deepEqual(result.map((c) => c.vi), ['Dịch A', 'Dịch B']);
  } finally {
    restore();
  }
});

test('AI trả sai số lượng thì rơi về Google Dịch theo nhóm', async () => {
  const restore = stubGoogleFetch('Dịch A\nDịch B');
  try {
    const aiGenerate = async () => ({ translations: ['chỉ một câu'] });
    const result = await batchTranslateCues(
      [{ start: 0, end: 1, de: 'Guten Tag', vi: '' }, { start: 1, end: 2, de: 'Wie geht es dir?', vi: '' }],
      undefined,
      { aiGenerate },
    );
    assert.deepEqual(result.map((c) => c.vi), ['Dịch A', 'Dịch B']);
  } finally {
    restore();
  }
});

test('không force thì bỏ qua câu đã có vi; force=true dịch lại cả câu đã có vi', async () => {
  const two = [
    { start: 0, end: 1, de: 'Hallo', vi: 'Chào cũ (Google)' },
    { start: 1, end: 2, de: 'Wie geht es dir?', vi: '' },
  ];
  const aiGenerate = async () => ({ translations: ['', 'Bạn khỏe không?'] });
  const kept = await batchTranslateCues(two, undefined, { aiGenerate });
  assert.equal(kept[0].vi, 'Chào cũ (Google)');
  assert.equal(kept[1].vi, 'Bạn khỏe không?');

  const aiGenerateForce = async () => ({ translations: ['Xin chào (AI)', 'Bạn có khỏe không?'] });
  const forced = await batchTranslateCues(two, undefined, { force: true, aiGenerate: aiGenerateForce });
  assert.deepEqual(forced.map((c) => c.vi), ['Xin chào (AI)', 'Bạn có khỏe không?']);
});

test('dấu hiệu [Musik] luôn ra [Âm nhạc] dù AI trả khác', async () => {
  const aiGenerate = async () => ({ translations: ['Nhạc nền', 'Chào buổi sáng'] });
  const result = await batchTranslateCues(
    [
      { start: 0, end: 1, de: '[Musik]', vi: '' },
      { start: 1, end: 2, de: 'Guten Morgen', vi: '' },
    ],
    undefined,
    { aiGenerate },
  );
  assert.deepEqual(result.map((c) => c.vi), ['[Âm nhạc]', 'Chào buổi sáng']);
});

test('translateTextLines (Google) vẫn hoạt động và đổi [Musik]', async () => {
  const restore = stubGoogleFetch('Xin chào\nChào bạn');
  try {
    const out = await translateTextLines(['[Musik]', 'Hallo']);
    assert.deepEqual(out, ['[Âm nhạc]', 'Chào bạn']);
    assert.deepEqual(await translateTextLines([]), []);
    assert.deepEqual(await batchTranslateCues([]), []);
  } finally {
    restore();
  }
});

test('translateLinesWithAI chấp nhận cả mảng trần và object translations', async () => {
  const bare = await translateLinesWithAI(['Hallo'], async () => ['Xin chào']);
  assert.deepEqual(bare, ['Xin chào']);
  await assert.rejects(
    () => translateLinesWithAI(['Hallo', 'Tschüss'], async () => ({ translations: ['Xin chào'] })),
    /sai số lượng/,
  );
});
