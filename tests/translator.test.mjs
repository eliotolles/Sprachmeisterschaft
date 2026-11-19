import test from 'node:test';
import assert from 'node:assert/strict';
import { batchTranslateCues, batchTranslateCuesGoogle, translateLinesWithAI, translateLinesWithGoogle } from '../src/lib/translator.js';

const cues = (n) =>
  Array.from({ length: n }, (_, i) => ({
    _id: `cue-${i}`,
    start: i * 2,
    end: i * 2 + 1.5,
    de: `Câu tiếng Đức số ${i + 1}`,
    vi: '',
  }));

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
  assert.equal(result.failedCount, 0);
  assert.equal(result.length, 25);
  for (let i = 0; i < 25; i++) {
    assert.equal(result[i].vi, `Dịch AI ${(i % 20) + 1}`);
    assert.equal(result[i].start, i * 2);
    assert.equal(result[i].end, i * 2 + 1.5);
    assert.equal(result[i].de, `Câu tiếng Đức số ${i + 1}`);
    assert.equal(result[i]._id, `cue-${i}`);
  }
});

test('AI lỗi một nhóm thì nhóm đó giữ vi cũ (hoặc trống), các nhóm khác vẫn dịch, báo đúng số câu lỗi', async () => {
  // Nhóm 20 câu đầu dịch được, nhóm 5 câu sau AI lỗi.
  const aiGenerate = async ({ userPrompt }) => {
    const count = (userPrompt.match(/^\d+\. /gm) || []).length;
    if (count === 5) throw new Error('AI hết quota');
    return { translations: Array.from({ length: count }, (_, i) => `Dịch AI ${i + 1}`) };
  };
  const result = await batchTranslateCues(cues(25), undefined, { aiGenerate });
  for (let i = 0; i < 20; i++) assert.equal(result[i].vi, `Dịch AI ${i + 1}`);
  for (let i = 20; i < 25; i++) assert.equal(result[i].vi, '');
  assert.equal(result.failedCount, 5);
});

test('AI lỗi với force=true thì nhóm đó giữ vi cũ và vẫn tính là lỗi', async () => {
  const two = [
    { start: 0, end: 1, de: 'Hallo', vi: 'Chào cũ' },
    { start: 1, end: 2, de: 'Wie geht es dir?', vi: 'Bạn khỏe không (cũ)' },
  ];
  const aiGenerate = async () => { throw new Error('AI lỗi'); };
  const result = await batchTranslateCues(two, undefined, { force: true, aiGenerate });
  // Giữ nguyên bản dịch cũ, không bị xóa thành trống.
  assert.deepEqual(result.map((c) => c.vi), ['Chào cũ', 'Bạn khỏe không (cũ)']);
  assert.equal(result.failedCount, 2);
});

test('AI trả sai số lượng thì nhóm đó giữ vi cũ, các nhóm khác vẫn dịch', async () => {
  const aiGenerate = async ({ userPrompt }) => {
    const count = (userPrompt.match(/^\d+\. /gm) || []).length;
    if (count === 5) return { translations: ['chỉ một câu'] };
    return { translations: Array.from({ length: count }, (_, i) => `Dịch AI ${i + 1}`) };
  };
  const result = await batchTranslateCues(cues(25), undefined, { aiGenerate });
  for (let i = 0; i < 20; i++) assert.equal(result[i].vi, `Dịch AI ${i + 1}`);
  for (let i = 20; i < 25; i++) assert.equal(result[i].vi, '');
  assert.equal(result.failedCount, 5);
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
  assert.equal(kept.failedCount, 0);

  const aiGenerateForce = async () => ({ translations: ['Xin chào (AI)', 'Bạn có khỏe không?'] });
  const forced = await batchTranslateCues(two, undefined, { force: true, aiGenerate: aiGenerateForce });
  assert.deepEqual(forced.map((c) => c.vi), ['Xin chào (AI)', 'Bạn có khỏe không?']);
  assert.equal(forced.failedCount, 0);
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
  assert.equal(result.failedCount, 0);
});

test('chạy song song: nhóm sau xong trước nhóm trước nhưng kết quả vẫn đúng thứ tự', async () => {
  // Nhóm 0 (20 câu) bị giữ lại, nhóm 1 (5 câu) xong trước — kết quả cuối
  // vẫn phải theo đúng thứ tự gốc, progress báo nhóm xong trước.
  const deferreds = [];
  const aiGenerate = async ({ userPrompt }) => {
    const count = (userPrompt.match(/^\d+\. /gm) || []).length;
    let resolve;
    const gate = new Promise((r) => { resolve = r; });
    deferreds.push({ resolve, count });
    await gate;
    return { translations: Array.from({ length: count }, (_, i) => `Dịch ${i + 1}`) };
  };
  const progress = [];
  const promise = batchTranslateCues(cues(25), (done, total) => progress.push([done, total]), { aiGenerate });
  // Đợi cả 2 nhóm đều đã bắt đầu gọi AI.
  for (let i = 0; i < 50 && deferreds.length < 2; i++) await new Promise((r) => setImmediate(r));
  assert.equal(deferreds.length, 2);
  // Cho nhóm 1 (5 câu) xong trước nhóm 0.
  deferreds[1].resolve();
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  deferreds[0].resolve();
  const result = await promise;
  // Kết quả vẫn đúng thứ tự gốc: câu 1-20 là "Dịch 1..20", câu 21-25 là "Dịch 1..5".
  for (let i = 0; i < 20; i++) assert.equal(result[i].vi, `Dịch ${i + 1}`);
  for (let i = 20; i < 25; i++) assert.equal(result[i].vi, `Dịch ${i - 20 + 1}`);
  assert.equal(result.failedCount, 0);
  // Progress báo nhóm xong trước (5 câu) rồi mới đủ 25.
  assert.deepEqual(progress, [[5, 25], [25, 25]]);
});

test('chạy song song tối đa 3 nhóm cùng lúc', async () => {
  let active = 0;
  let maxActive = 0;
  let calls = 0;
  const aiGenerate = async ({ userPrompt }) => {
    calls++;
    active++;
    maxActive = Math.max(maxActive, active);
    const count = (userPrompt.match(/^\d+\. /gm) || []).length;
    await new Promise((r) => setTimeout(r, 10));
    active--;
    return { translations: Array.from({ length: count }, (_, i) => `Dịch ${i + 1}`) };
  };
  const result = await batchTranslateCues(cues(100), undefined, { aiGenerate });
  assert.equal(calls, 5); // 100 câu = 5 nhóm
  assert.equal(maxActive, 3); // không vượt quá 3 nhóm cùng lúc
  assert.equal(result.failedCount, 0);
  assert.equal(result.length, 100);
});

test('translateLinesWithGoogle gọi gtx, bỏ câu trống, map đúng thứ tự', async () => {
  const seenUrls = [];
  const fetchFn = async (url) => {
    seenUrls.push(url);
    const q = new URL(url).searchParams.getAll('q');
    return {
      ok: true,
      json: async () => [[...q.map((t) => [`Dịch: ${t}`, t])], null, 'de'],
    };
  };
  const result = await translateLinesWithGoogle(['Hallo', '', 'Tschüss'], fetchFn);
  assert.deepEqual(result, ['Dịch: Hallo', '', 'Dịch: Tschüss']);
  assert.match(seenUrls[0], /translate\.googleapis\.com/);
  assert.match(seenUrls[0], /tl=vi/);
  // 429 thì ném lỗi để phía gọi giữ nguyên vi cũ.
  await assert.rejects(
    () => translateLinesWithGoogle(['Hallo'], async () => ({ ok: false, status: 429, json: async () => ({}) })),
    /429/,
  );
});

test('dịch nhanh bằng Google: chỉ dịch câu chưa có vi, ghi viEngine google, lỗi thì tính failedCount', async () => {
  const googleTranslate = async (lines) => lines.map((l) => (l ? `GG: ${l}` : ''));
  const input = [
    { start: 0, end: 1, de: 'Hallo', vi: 'Chào cũ' },
    { start: 1, end: 2, de: 'Wie geht es dir?', vi: '' },
    { start: 2, end: 3, de: 'Tschüss', vi: '' },
  ];
  const result = await batchTranslateCuesGoogle(input, undefined, { googleTranslate });
  assert.equal(result[0].vi, 'Chào cũ'); // giữ nguyên, không dịch lại
  assert.equal(result[0].viEngine, undefined);
  assert.equal(result[1].vi, 'GG: Wie geht es dir?');
  assert.equal(result[1].viEngine, 'google');
  assert.equal(result[2].vi, 'GG: Tschüss');
  assert.equal(result.translationEngine, 'google');
  assert.equal(result.failedCount, 0);

  const failed = await batchTranslateCuesGoogle(cues(2), undefined, {
    googleTranslate: async () => { throw new Error('Google 429'); },
  });
  assert.deepEqual(failed.map((c) => c.vi), ['', '']);
  assert.equal(failed.failedCount, 2);
  assert.equal(failed.translationEngine, 'none');

  const empty = await batchTranslateCuesGoogle([]);
  assert.deepEqual([...empty], []);
  assert.equal(empty.failedCount, 0);
});

test('đường dịch đúng ghi viEngine để nút "dịch đúng" biết câu nào đã đúng', async () => {
  const deeplTranslate = async ({ texts }) => ({ translations: texts.map((t) => `DeepL: ${t}`) });
  const result = await batchTranslateCues(cues(2), undefined, {
    deeplTranslate,
    aiGenerate: async () => { throw new Error('AI không được gọi'); },
  });
  assert.deepEqual(result.map((c) => c.viEngine), ['deepl', 'deepl']);

  // DeepL lỗi thì AI làm, ghi 'ai'.
  const result2 = await batchTranslateCues(cues(2), undefined, {
    deeplTranslate: async () => { throw new Error('DeepL lỗi'); },
    aiGenerate: async () => ({ translations: ['Xin chào', 'Tạm biệt'] }),
  });
  assert.deepEqual(result2.map((c) => c.viEngine), ['ai', 'ai']);
});

test('translateLinesWithAI chấp nhận cả mảng trần và object translations', async () => {
  const bare = await translateLinesWithAI(['Hallo'], async () => ['Xin chào']);
  assert.deepEqual(bare, ['Xin chào']);
  await assert.rejects(
    () => translateLinesWithAI(['Hallo', 'Tschüss'], async () => ({ translations: ['Xin chào'] })),
    /sai số lượng/,
  );
});

test('DeepL dịch trước, AI không được gọi; context là câu ngay trước nhóm', async () => {
  const seen = [];
  const deeplTranslate = async ({ texts, context }) => {
    seen.push({ texts, context });
    return { translations: texts.map((t) => `DeepL: ${t}`) };
  };
  const aiGenerate = async () => { throw new Error('AI không được gọi khi DeepL đã dịch được'); };
  // 25 câu: chỉ câu 20-21 cần dịch (nằm ở nhóm 2, bắt đầu từ câu 20),
  // câu 19 ngay trước nhóm là câu ngữ cảnh đã có bản dịch.
  const input = cues(25).map((c, i) => ({ ...c, vi: 'đã dịch' }));
  input[19] = { start: 38, end: 39.5, de: 'Wir machen Hausaufgaben.', vi: 'Chúng ta làm bài tập.' };
  input[20] = { start: 40, end: 41.5, de: 'Ich bin fertig.', vi: '' };
  input[21] = { start: 42, end: 43.5, de: 'Das kriegen wir hin.', vi: '' };
  const result = await batchTranslateCues(input, undefined, { deeplTranslate, aiGenerate });
  assert.equal(result[20].vi, 'DeepL: Ich bin fertig.');
  assert.equal(result[21].vi, 'DeepL: Das kriegen wir hin.');
  assert.equal(result.failedCount, 0);
  assert.equal(result.translationEngine, 'deepl');
  assert.equal(seen.length, 1);
  // Chỉ gửi câu cần dịch (các câu khác đã có vi nên không gửi), kèm context.
  assert.deepEqual(seen[0].texts, ['Ich bin fertig.', 'Das kriegen wir hin.']);
  assert.match(seen[0].context, /Hausaufgaben/);
});

test('DeepL hết hạn mức thì chuyển sang AI cho nhóm đó và các nhóm còn lại', async () => {
  let deeplCalls = 0;
  const deeplTranslate = async () => {
    deeplCalls++;
    throw Object.assign(new Error('DeepL đã hết hạn mức.'), { code: 'DEEPL_EXHAUSTED' });
  };
  const aiGenerate = async ({ userPrompt }) => {
    const count = (userPrompt.match(/^\d+\. /gm) || []).length;
    return { translations: Array.from({ length: count }, (_, i) => `Dịch AI ${i + 1}`) };
  };
  const result = await batchTranslateCues(cues(20), undefined, { deeplTranslate, aiGenerate });
  assert.equal(result.failedCount, 0);
  assert.equal(result.translationEngine, 'ai');
  // DeepL chỉ thử đúng 1 lần rồi tắt cho phần còn lại của lần chạy.
  assert.equal(deeplCalls, 1);
  for (let i = 0; i < 20; i++) assert.equal(result[i].vi, `Dịch AI ${i + 1}`);
});

test('DeepL lỗi tạm thời thì AI vẫn dịch được; cả hai lỗi thì tính failedCount', async () => {
  const deeplTranslate = async () => { throw new Error('DeepL tạm lỗi'); };
  const aiGenerate = async () => ({ translations: ['Xin chào', 'Tạm biệt'] });
  const ok = await batchTranslateCues(cues(2), undefined, { deeplTranslate, aiGenerate });
  assert.deepEqual(ok.map((c) => c.vi), ['Xin chào', 'Tạm biệt']);
  assert.equal(ok.failedCount, 0);
  assert.equal(ok.translationEngine, 'ai');

  const bothFail = await batchTranslateCues(cues(2), undefined, {
    deeplTranslate,
    aiGenerate: async () => { throw new Error('AI lỗi'); },
  });
  assert.deepEqual(bothFail.map((c) => c.vi), ['', '']);
  assert.equal(bothFail.failedCount, 2);
});

test('deeplTranslate=false thì bỏ qua DeepL, chỉ dùng AI', async () => {
  const aiGenerate = async () => ({ translations: ['Xin chào'] });
  const result = await batchTranslateCues(cues(1), undefined, { deeplTranslate: false, aiGenerate });
  assert.equal(result[0].vi, 'Xin chào');
  assert.equal(result.translationEngine, 'ai');
});

test('DeepL không gửi câu trống lên server mà map lại thành rỗng, tiết kiệm hạn mức', async () => {
  const seen = [];
  const deeplTranslate = async ({ texts }) => {
    seen.push(texts);
    return { translations: texts.map((t) => `DeepL: ${t}`) };
  };
  const result = await batchTranslateCues(
    [
      { start: 0, end: 1, de: '', vi: '' },
      { start: 1, end: 2, de: 'Guten Morgen', vi: '' },
      { start: 2, end: 3, de: '[Musik]', vi: '' },
    ],
    undefined,
    { deeplTranslate, aiGenerate: async () => { throw new Error('AI không được gọi'); } },
  );
  assert.deepEqual(seen, [['Guten Morgen', '[Musik]']]);
  assert.deepEqual(result.map((c) => c.vi), ['', 'DeepL: Guten Morgen', '[Âm nhạc]']);
  assert.equal(result.failedCount, 0);
});
