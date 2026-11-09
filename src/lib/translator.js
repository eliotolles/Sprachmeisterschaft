/**
 * Công cụ dịch tự động phụ đề tiếng Đức sang tiếng Việt
 * Sử dụng Google Translate endpoint (client: gtx)
 * Tối ưu batch nối dòng giúp dịch hàng trăm câu trong 1-2 giây
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

/**
 * Dịch toàn bộ mảng cues sang tiếng Việt
 * Cues format: [{ start, end, de, vi }]
 */
export async function batchTranslateCues(cues, onProgress) {
  if (!Array.isArray(cues) || cues.length === 0) return [];
  const results = cues.map(c => ({ ...c }));
  const chunkSize = 40; // 40 câu mỗi request để tránh URL quá dài

  for (let i = 0; i < results.length; i += chunkSize) {
    const chunk = results.slice(i, i + chunkSize);
    const needTranslate = chunk.map(c => (!c.vi || !c.vi.trim() ? (c.de || c.text || '') : ''));
    
    // Nếu trong chunk có câu cần dịch
    if (needTranslate.some(t => t.trim())) {
      const translated = await translateTextLines(needTranslate);
      for (let j = 0; j < chunk.length; j++) {
        const idx = i + j;
        if ((!results[idx].vi || !results[idx].vi.trim()) && translated[j]) {
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
