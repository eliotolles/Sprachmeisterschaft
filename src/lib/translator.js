/**
 * Công cụ dịch phụ đề tiếng Đức sang tiếng Việt theo ngữ cảnh.
 * Chính: AI (purpose 'subtitle_translation') dịch từng đoạn 20 câu liên
 * tiếp để giữ ngữ cảnh hội thoại/bài giảng, dịch tự nhiên như lời nói.
 * Dự phòng: Google Translate endpoint (client: gtx) theo nhóm khi AI lỗi
 * hoặc trả sai định dạng — không bao giờ để một nhóm không có bản dịch.
 */

export async function translateTextLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  
  // Lọc và làm sạch dòng
  const cleanLines = lines.map(l => (typeof l === 'string' ? l.trim().replace(/\r?\n/g, ' ') : ''));
  const joinedText = cleanLines.join('\n');
  if (!joinedText.trim()) return cleanLines.map(() => '');

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=vi&dt=t&q=${encodeURIComponent(joinedText)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // Ghép tất cả các đoạn dịch trả về
    let fullTranslated = '';
    if (Array.isArray(data) && Array.isArray(data[0])) {
      fullTranslated = data[0].map(item => item[0]).join('');
    }

    const translatedLines = fullTranslated.split('\n');
    
    // Khớp kết quả trả về với số dòng ban đầu
    return cleanLines.map((original, i) => {
      if (!original) return '';
      if (/^\[(Musik|Music)\]$/i.test(original)) return '[Âm nhạc]';
      if (/^\[(Applaus|Applause)\]$/i.test(original)) return '[Tiếng vỗ tay]';
      if (/^\[(Lachen|Laughter)\]$/i.test(original)) return '[Tiếng cười]';
      if (/^\[.+\]$/.test(original) || /^\(.+\)$/.test(original)) return original;
      return translatedLines[i] ? translatedLines[i].trim() : '';
    });
  } catch (err) {
    console.warn('Lỗi batch dịch:', err);
    return cleanLines.map(() => '');
  }
}

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

/**
 * Dịch một nhóm dòng tiếng Đức bằng AI theo ngữ cảnh.
 * Trả về mảng bản dịch đúng thứ tự/số lượng. Ném lỗi khi AI lỗi hoặc
 * trả sai định dạng/số lượng để phía gọi rơi về Google Dịch dự phòng.
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
  if (!Array.isArray(raw) || raw.length !== cleanLines.length || raw.some(t => typeof t !== 'string')) {
    throw new Error('AI trả về sai định dạng hoặc sai số lượng câu dịch');
  }
  const translated = applyMarkerTranslations(cleanLines, raw);
  // Câu nguồn có nội dung mà AI dịch thành rỗng là dịch lỗi — để phía
  // gọi rơi về Google Dịch cho cả nhóm thay vì lưu bản dịch trống.
  if (translated.some((t, i) => cleanLines[i].trim() && !t.trim())) {
    throw new Error('AI bỏ sót bản dịch của một số câu');
  }
  return translated;
}

/**
 * Dịch toàn bộ mảng cues sang tiếng Việt
 * Cues format: [{ start, end, de, vi }]
 * Mặc định chỉ dịch câu chưa có `vi`. options.force=true thì dịch lại
 * toàn bộ, kể cả câu đã có bản dịch cũ (dùng để thay bản Google Dịch cũ
 * bằng bản AI theo ngữ cảnh).
 */
export async function batchTranslateCues(cues, onProgress, options = {}) {
  if (!Array.isArray(cues) || cues.length === 0) return [];
  const { force = false, aiGenerate = null } = options || {};
  const results = cues.map(c => ({ ...c }));
  const chunkSize = 20; // 20 câu mỗi nhóm để AI giữ được ngữ cảnh đoạn

  for (let i = 0; i < results.length; i += chunkSize) {
    const chunk = results.slice(i, i + chunkSize);
    const needTranslate = chunk.map(c => (force || !c.vi || !String(c.vi).trim() ? (c.de || c.text || '') : ''));
    
    // Nếu trong chunk có câu cần dịch
    if (needTranslate.some(t => t.trim())) {
      let translated = null;
      try {
        translated = await translateLinesWithAI(needTranslate, aiGenerate);
      } catch (err) {
        console.warn('Dịch phụ đề bằng AI lỗi, dùng Google Dịch dự phòng cho nhóm này:', err);
        translated = null;
      }
      if (!translated) {
        translated = await translateTextLines(needTranslate);
      }
      for (let j = 0; j < chunk.length; j++) {
        const idx = i + j;
        const needsIt = force || !results[idx].vi || !String(results[idx].vi).trim();
        if (needsIt && translated[j]) {
          results[idx].vi = translated[j];
        }
      }
    }

    if (typeof onProgress === 'function') {
      onProgress(Math.min(i + chunkSize, results.length), results.length);
    }
  }

  return results;
}
