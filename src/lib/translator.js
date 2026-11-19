/**
 * Công cụ dịch phụ đề tiếng Đức sang tiếng Việt.
 * HAI LUỒNG (anh Elio 20/11, vì DeepL chậm hơn AI anh hay dùng):
 * 1) Dịch NHANH (bản nháp) bằng Google Dịch — lúc import/lấy phụ đề
 *    và khi mở video: nhanh như lúc đầu, vào video đã có tiếng Việt.
 *    Google dịch từng câu, không giữ ngữ cảnh nên có thể sai.
 * 2) Dịch ĐÚNG (khi bấm "Dịch lại bằng AI") — DeepL TRƯỚC (dịch theo
 *    ngữ cảnh, chạy phía server nên máy người dùng không nặng thêm),
 *    hết hạn mức 1.000.000 ký tự (một lần, không cộng lại mỗi tháng)
 *    thì tự chuyển sang AI và Ở LẠI AI. AI là purpose
 *    'subtitle_translation', dịch từng đoạn 20 câu liên tiếp để giữ ngữ
 *    cảnh hội thoại/bài giảng, dịch tự nhiên như lời nói.
 * Mỗi câu đã dịch ghi `viEngine` = 'google' | 'deepl' | 'ai' để nút
 * "dịch đúng" biết câu nào chỉ có bản nháp (cần dịch lại đúng) và câu
 * nào đã có bản dịch đúng (giữ nguyên, không dịch lại từ đầu).
 * Engine nào lỗi hoặc trả sai cho một nhóm thì nhóm đó giữ nguyên `vi`
 * cũ (câu chưa có `vi` thì để trống), ghi nhận vào `failedCount` trên
 * mảng trả về, và dịch tiếp các nhóm còn lại — không dừng cả bài vì
 * một nhóm lỗi.
 */

const SUBTITLE_AI_SYSTEM_PROMPT = `Bạn là dịch giả phụ đề tiếng Đức - Việt cho video bài học tiếng Đức (ngôn ngữ nói, người học trình độ B1/B2). Dịch các câu sau sang tiếng Việt tự nhiên, đúng ngữ cảnh đoạn hội thoại/bài giảng, như lời nói thường ngày — không dịch từng từ máy móc.
Giữ nguyên tên riêng, số, ngày tháng. Chuyển [Musik] thành [Âm nhạc], [Lachen] thành [Tiếng cười], [Applaus] thành [Tiếng vỗ tay].
Không thêm giải thích, không bịa thêm câu, không gộp hay tách câu. Trả về DUY NHẤT một JSON object dạng {"translations": ["...", ...]} với đúng số câu đã gửi, đúng thứ tự. Mỗi bản dịch chỉ dùng tiếng Việt (trừ tên riêng và các dấu [..] đã chuyển). Câu nguồn trống thì dịch thành chuỗi rỗng.`;

function applyMarkerTranslations(sourceLines, translatedLines) {
  return translatedLines.map((t, i) => {
    const src = (sourceLines[i] || '').trim();
    if (!src) return '';
    if (/^\[(Musik|Music)\]$/i.test(src)) return '[Âm nhạc]';
    if (/^\[(Applaus|Applause)\]$/i.test(src)) return '[Tiếng vỗ tay]';
    if (/^\[(Lachen|Laughter)\]$/i.test(src)) return '[Tiếng cười]';
    return typeof t === 'string' ? t.trim() : '';
  });
}

function validateTranslatedLines(cleanLines, raw) {
  if (!Array.isArray(raw) || raw.length !== cleanLines.length || raw.some(t => typeof t !== 'string')) {
    throw new Error('Trả về sai định dạng hoặc sai số lượng câu dịch');
  }
  const translated = applyMarkerTranslations(cleanLines, raw);
  // Câu nguồn có nội dung mà dịch thành rỗng là dịch lỗi — để phía
  // gọi giữ nguyên `vi` cũ của nhóm và ghi nhận là dịch lỗi.
  if (translated.some((t, i) => cleanLines[i].trim() && !t.trim())) {
    throw new Error('Bỏ sót bản dịch của một số câu');
  }
  return translated;
}

/**
 * Dịch một nhóm dòng tiếng Đức bằng AI theo ngữ cảnh.
 * Trả về mảng bản dịch đúng thứ tự/số lượng. Ném lỗi khi AI lỗi hoặc
 * trả sai định dạng/số lượng để phía gọi giữ nguyên `vi` cũ của nhóm đó
 * và ghi nhận là dịch lỗi (không dùng Google Dịch nữa).
 * `aiGenerate` là điểm chích để test (nhận {systemPrompt, userPrompt},
 * trả về JSON đã parse); production để trống sẽ gọi dàn AI của app.
 */
export async function translateLinesWithAI(lines, aiGenerate = null) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const cleanLines = lines.map(l => (typeof l === 'string' ? l.trim().replace(/\r?\n/g, ' ') : ''));
  const numbered = cleanLines.map((l, i) => `${i + 1}. ${l}`).join('\n');
  const userPrompt = `Dịch đúng ${cleanLines.length} câu sau (giữ đúng thứ tự và số lượng):\n${numbered}`;

  let value;
  if (typeof aiGenerate === 'function') {
    value = await aiGenerate({ systemPrompt: SUBTITLE_AI_SYSTEM_PROMPT, userPrompt });
  } else {
    const { executeTaskWithFallback } = await import('@/lib/ai-evaluator');
    value = await executeTaskWithFallback({
      taskId: 'subtitle_translation',
      systemPrompt: SUBTITLE_AI_SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
    });
  }

  const raw = Array.isArray(value) ? value : value?.translations;
  return validateTranslatedLines(cleanLines, raw);
}

/**
 * Dịch NHANH một nhóm dòng tiếng Đức bằng Google Dịch (bản nháp).
 * ĐÚNG CODE BUỔI CHIỀU 19/11 (lúc Google còn nhanh): nối tất cả các
 * dòng bằng '\n' thành MỘT đoạn văn, gửi 1 request duy nhất với 1 tham
 * số q — Google có tách câu thành nhiều đoạn thì vẫn ghép lại được bằng
 * cách nối tất cả các đoạn dịch rồi tách lại theo '\n'. KHÔNG đếm số
 * đoạn trả về (Google tách câu kiểu gì cũng đúng).
 * Chạy phía trình duyệt qua endpoint gtx công khai — nhanh như lúc đầu,
 * nhưng dịch từng câu, không giữ ngữ cảnh nên có thể sai (bản nháp).
 * Chỉ ném lỗi khi Google trả HTTP lỗi (vd 429) để phía gọi ghi nhận là
 * dịch lỗi; câu nào Google không dịch được thì trả '' (không ném lỗi
 * cả nhóm như code trước — đó là lý do 68 câu vừa rồi dịch được 0 câu).
 * `fetchFn` là điểm chích để test (mặc định là fetch của trình duyệt).
 */
export async function translateLinesWithGoogle(lines, fetchFn = fetch) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const cleanLines = lines.map(l => (typeof l === 'string' ? l.trim().replace(/\r?\n/g, ' ') : ''));
  const joinedText = cleanLines.join('\n');
  if (!joinedText.trim()) return cleanLines.map(() => '');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=vi&dt=t&q=${encodeURIComponent(joinedText)}`;
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`Google Dịch lỗi ${res.status}`);
  const data = await res.json();
  // Ghép tất cả các đoạn dịch trả về (Google có thể tách 1 câu thành
  // nhiều đoạn — nối lại rồi tách theo '\n' thì vẫn đúng từng dòng).
  let fullTranslated = '';
  if (Array.isArray(data) && Array.isArray(data[0])) {
    fullTranslated = data[0].map(item => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : '')).join('');
  }
  const translatedLines = fullTranslated.split('\n');
  return cleanLines.map((original, i) => {
    if (!original) return '';
    if (/^\[(Musik|Music)\]$/i.test(original)) return '[Âm nhạc]';
    if (/^\[(Applaus|Applause)\]$/i.test(original)) return '[Tiếng vỗ tay]';
    if (/^\[(Lachen|Laughter)\]$/i.test(original)) return '[Tiếng cười]';
    if (/^\[.+\]$/.test(original) || /^\(.+\)$/.test(original)) return original;
    return translatedLines[i] ? translatedLines[i].trim() : '';
  });
}

/**
 * Dịch một nhóm dòng tiếng Đức bằng DeepL (server giữ khóa, trình duyệt
 * không bao giờ thấy khóa). DeepL nhận cả nhóm cùng lúc kèm `context`
 * là vài câu ngay trước nhóm để phân biệt nghĩa theo ngữ cảnh
 * (ví dụ "Ich bin fertig." làm xong bài hay kiệt sức).
 * Trả về mảng bản dịch đúng thứ tự/số lượng. Ném lỗi khi chưa có khóa,
 * hết hạn mức, DeepL lỗi hoặc trả sai — phía gọi chuyển sang AI.
 * `deeplTranslate` là điểm chích để test (nhận {texts, context}, trả về
 * {translations} hoặc {exhausted: true}); production để trống sẽ gọi
 * endpoint /api/core/translate/deepl qua elioClient. Câu nguồn trống
 * không gửi lên DeepL mà map lại thành rỗng (tiết kiệm hạn mức, tránh
 * DeepL trả 400 vì text rỗng).
 */
export async function translateLinesWithDeepL(lines, options = {}) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const cleanLines = lines.map(l => (typeof l === 'string' ? l.trim().replace(/\r?\n/g, ' ') : ''));
  const context = typeof options.context === 'string' ? options.context.trim().slice(0, 1000) : '';
  const sendIdx = cleanLines.map((l, i) => (l ? i : -1)).filter(i => i >= 0);
  if (sendIdx.length === 0) return cleanLines.map(() => '');

  let result;
  const deeplTranslate = options.deeplTranslate ?? null;
  if (typeof deeplTranslate === 'function') {
    result = await deeplTranslate({ texts: sendIdx.map(i => cleanLines[i]), context });
  } else {
    const { elioClient } = await import('@/lib/elio-auth-runtime');
    if (!elioClient.getUser()) throw Object.assign(new Error('Chưa đăng nhập core nên chưa dùng được DeepL.'), { code: 'DEEPL_NOT_SIGNED_IN' });
    result = await elioClient.translateDeepL({ texts: sendIdx.map(i => cleanLines[i]), context });
  }
  if (result?.exhausted) throw Object.assign(new Error('DeepL đã hết hạn mức.'), { code: 'DEEPL_EXHAUSTED' });
  const raw = Array.isArray(result) ? result : result?.translations;
  if (!Array.isArray(raw) || raw.length !== sendIdx.length) {
    throw new Error('DeepL trả về sai số lượng câu dịch');
  }
  const full = cleanLines.map(() => '');
  sendIdx.forEach((lineIdx, k) => { full[lineIdx] = raw[k]; });
  return validateTranslatedLines(cleanLines, full);
}

/**
 * Dịch toàn bộ mảng cues sang tiếng Việt — DeepL TRƯỚC, hết hạn mức
 * hoặc DeepL lỗi thì chuyển sang AI từng nhóm.
 * Cues format: [{ start, end, de, vi }]
 * Mặc định chỉ dịch câu chưa có `vi`. options.force=true thì dịch lại
 * toàn bộ, kể cả câu đã có bản dịch cũ.
 * options.deeplTranslate: hàm chích để test (nhận {texts, context});
 * null = dùng endpoint DeepL mặc định; false = bỏ qua DeepL, chỉ dùng AI.
 * CHẠY SONG SONG: tối đa 3 nhóm 20 câu cùng lúc (nhanh gấp ~3 lần so với
 * dịch tuần tự, mà không dội engine quá nhiều). Nhóm nào xong thì ghi kết
 * quả của nhóm đó vào đúng vị trí theo chỉ số và báo `onProgress` ngay —
 * thứ tự câu trong kết quả cuối luôn đúng thứ tự gốc, dù nhóm sau xong
 * trước nhóm trước.
 * Trả về mảng cues đã dịch, gắn thêm `failedCount` = số câu cần dịch nhưng
 * cả hai engine đều lỗi nên chưa dịch được (giữ `vi` cũ nếu có, chưa có
 * thì để trống), và `translationEngine` = 'deepl' | 'ai' | 'mixed' |
 * 'none' (engine nào đã dịch các câu trong lần chạy này).
 * Nhóm nào cả hai engine đều lỗi thì chỉ nhóm đó bị tính lỗi, các nhóm
 * khác vẫn dịch.
 */
export async function batchTranslateCues(cues, onProgress, options = {}) {
  if (!Array.isArray(cues) || cues.length === 0) {
    const empty = [];
    empty.failedCount = 0;
    empty.translationEngine = 'none';
    return empty;
  }
  const { force = false, aiGenerate = null, deeplTranslate = null } = options || {};
  const results = cues.map(c => ({ ...c }));
  const chunkSize = 20; // 20 câu mỗi nhóm để engine giữ được ngữ cảnh đoạn
  const CONCURRENCY = 3; // tối đa 3 nhóm chạy cùng lúc
  const chunkStarts = [];
  for (let i = 0; i < results.length; i += chunkSize) chunkStarts.push(i);
  // DeepL chỉ thử cho tới khi lỗi lần đầu trong lần chạy này — sau đó
  // toàn bộ nhóm còn lại dịch bằng AI luôn, không gọi DeepL nữa.
  let deeplAllowed = deeplTranslate !== false;
  const enginesUsed = new Set();

  // Ngữ cảnh cho DeepL: tối đa 3 câu tiếng Đức ngay trước nhóm, để
  // phân biệt nghĩa theo tình huống (làm xong bài hay kiệt sức...).
  const contextBefore = (start) => {
    const prev = [];
    for (let i = start - 1; i >= 0 && prev.length < 3; i--) {
      const de = (results[i].de || results[i].text || '').trim();
      if (de) prev.unshift(de);
    }
    return prev.join(' ');
  };

  // Dịch một nhóm, ghi kết quả đúng vị trí theo chỉ số, trả về số câu lỗi.
  const processChunk = async (start) => {
    const chunk = results.slice(start, start + chunkSize);
    const needTranslate = chunk.map(c => (force || !c.vi || !String(c.vi).trim() ? (c.de || c.text || '') : ''));
    let failedHere = 0;
    if (needTranslate.some(t => t.trim())) {
      let translated = null;
      let engine = null;
      if (deeplAllowed) {
        try {
          translated = await translateLinesWithDeepL(needTranslate, { context: contextBefore(start), deeplTranslate });
          engine = 'deepl';
        } catch (err) {
          // DeepL chưa có khóa, hết hạn mức, lỗi mạng hay trả sai: tắt
          // DeepL cho phần còn lại của lần chạy này, chuyển sang AI.
          deeplAllowed = false;
          console.warn('Dịch phụ đề bằng DeepL lỗi cho nhóm này, chuyển sang AI:', err);
          translated = null;
        }
      }
      if (!translated) {
        try {
          translated = await translateLinesWithAI(needTranslate, aiGenerate);
          engine = 'ai';
        } catch (err) {
          // AI lỗi/trả sai cho nhóm này: KHÔNG dùng Google Dịch nữa.
          // Giữ nguyên `vi` cũ của nhóm, câu chưa có `vi` thì để trống.
          console.warn('Dịch phụ đề bằng AI lỗi cho nhóm này, giữ nguyên bản dịch cũ (nếu có):', err);
          translated = null;
        }
      }
      if (engine) enginesUsed.add(engine);
      for (let j = 0; j < chunk.length; j++) {
        const idx = start + j;
        const needsIt = force || !results[idx].vi || !String(results[idx].vi).trim();
        if (needsIt && translated && translated[j]) {
          results[idx].vi = translated[j];
          results[idx].viEngine = engine;
        }
        // Câu cần dịch mà nhóm này cả hai engine đều lỗi
        // (translated === null) thì tính là lỗi dù vẫn giữ `vi` cũ —
        // vì bản dịch lại đã thất bại; câu chưa có `vi` thì tính là lỗi.
        // Câu nguồn trống thì không có gì để dịch, không tính là lỗi.
        const source = (chunk[j].de || chunk[j].text || '').trim();
        if (needsIt && source && (translated === null || !results[idx].vi || !String(results[idx].vi).trim())) {
          failedHere++;
        }
      }
    }
    return failedHere;
  };

  let failedCount = 0;
  let completedCues = 0;
  let next = 0;
  const worker = async () => {
    while (next < chunkStarts.length) {
      const start = chunkStarts[next++];
      failedCount += await processChunk(start);
      completedCues += Math.min(chunkSize, results.length - start);
      if (typeof onProgress === 'function') {
        onProgress(Math.min(completedCues, results.length), results.length);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, chunkStarts.length) }, () => worker()),
  );

  results.failedCount = failedCount;
  results.translationEngine = enginesUsed.size === 0 ? 'none' : enginesUsed.size === 1 ? [...enginesUsed][0] : 'mixed';
  return results;
}

/**
 * Dịch NHANH toàn bộ mảng cues sang tiếng Việt bằng Google Dịch (bản
 * nháp) — dùng lúc import/lấy phụ đề và khi mở video, để vào video đã
 * có tiếng Việt ngay (nhanh như lúc đầu). Chỉ dịch câu chưa có `vi`;
 * câu nào Google lỗi thì giữ trống, ghi vào `failedCount`, mở video sẽ
 * tự thử lại. Muốn dịch ĐÚNG thì bấm "Dịch lại bằng AI" (DeepL→AI).
 * options.googleTranslate: hàm chích để test (nhận mảng dòng, trả về
 * mảng bản dịch); null = dùng endpoint Google gtx mặc định.
 * CHẠY SONG SONG: tối đa 3 nhóm 20 câu cùng lúc, như luồng dịch đúng.
 * Trả về mảng cues đã dịch, gắn `failedCount` và `translationEngine`
 * = 'google' | 'none'. Câu nào dịch được ghi `viEngine = 'google'`.
 */
export async function batchTranslateCuesGoogle(cues, onProgress, options = {}) {
  if (!Array.isArray(cues) || cues.length === 0) {
    const empty = [];
    empty.failedCount = 0;
    empty.translationEngine = 'none';
    return empty;
  }
  const { googleTranslate = null } = options || {};
  const results = cues.map(c => ({ ...c }));
  const chunkSize = 40; // 40 câu mỗi request (như buổi chiều) để tránh URL quá dài
  const CONCURRENCY = 3; // tối đa 3 nhóm chạy cùng lúc
  const chunkStarts = [];
  for (let i = 0; i < results.length; i += chunkSize) chunkStarts.push(i);
  let anyGoogle = false;
  let lastError = null;

  const processChunk = async (start) => {
    const chunk = results.slice(start, start + chunkSize);
    const needTranslate = chunk.map(c => (!c.vi || !String(c.vi).trim() ? (c.de || c.text || '') : ''));
    let failedHere = 0;
    if (needTranslate.some(t => t.trim())) {
      let translated = null;
      try {
        translated = googleTranslate
          ? await googleTranslate(needTranslate)
          : await translateLinesWithGoogle(needTranslate);
      } catch (err) {
        // Google lỗi cho nhóm này (mạng, 429...): giữ nguyên `vi` cũ,
        // câu chưa có `vi` thì để trống — mở video sẽ tự thử lại. Ghi
        // lại lý do để toast báo rõ (vd "Google Dịch lỗi 429").
        if (!lastError) lastError = err?.message || String(err);
        console.warn('Dịch nhanh bằng Google lỗi cho nhóm này, giữ nguyên (mở video sẽ thử lại):', err);
        translated = null;
      }
      for (let j = 0; j < chunk.length; j++) {
        const idx = start + j;
        const needsIt = !results[idx].vi || !String(results[idx].vi).trim();
        if (needsIt && translated && translated[j]) {
          results[idx].vi = translated[j];
          results[idx].viEngine = 'google';
          anyGoogle = true;
        }
        const source = (chunk[j].de || chunk[j].text || '').trim();
        if (needsIt && source && (translated === null || !results[idx].vi || !String(results[idx].vi).trim())) {
          failedHere++;
        }
      }
    }
    return failedHere;
  };

  let failedCount = 0;
  let completedCues = 0;
  let next = 0;
  const worker = async () => {
    while (next < chunkStarts.length) {
      const start = chunkStarts[next++];
      failedCount += await processChunk(start);
      completedCues += Math.min(chunkSize, results.length - start);
      if (typeof onProgress === 'function') {
        onProgress(Math.min(completedCues, results.length), results.length);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, chunkStarts.length) }, () => worker()),
  );

  results.failedCount = failedCount;
  results.translationEngine = anyGoogle ? 'google' : 'none';
  results.lastError = lastError;
  return results;
}
