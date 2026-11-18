// ====================================================================
// SPRACHMEISTERSCHAFT — SUBTITLE PARSER (SRT / VTT / Timestamp)
// Module lá, không import gì khác: dùng được cả trong trình duyệt lẫn
// trong test Node (document-parsers.js nặng, kéo theo xlsx/mammoth/pdfjs
// và db.js nên không import trực tiếp được trong test).
// ====================================================================

/**
 * Chuẩn hóa phụ đề SRT/VTT trước khi đưa vào parseYouTubeSubtitles:
 * - bỏ dòng đầu WEBVTT và khối NOTE của VTT
 * - đổi timestamp dạng MM:SS.mmm (hay gặp trong VTT) sang HH:MM:SS,mmm
 */
export function normalizeSubtitleText(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let skipNote = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^WEBVTT/i.test(t)) continue;
    if (/^NOTE(\s|$)/i.test(t)) {
      skipNote = true;
      continue;
    }
    if (skipNote) {
      if (!t) skipNote = false;
      continue;
    }
    out.push(line);
  }
  return out
    .join('\n')
    .replace(
      /^(\d{2}):(\d{2})([.,]\d+)\s*-->\s*(\d{2}):(\d{2})([.,]\d+)\s*$/gm,
      '00:$1:$2,000 --> 00:$4:$5,000'
    );
}

/**
 * Parser Phụ Đề YouTube (SRT, VTT hoặc Timestamp)
 * Trả về mảng cue {id, start, end, de, vi} — start/end tính bằng giây.
 */
export function parseYouTubeSubtitles(text) {
  if (!text || !text.trim()) return [];
  const lines = text.split('\n');
  const subs = [];
  let curAutoTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^\d+$/.test(line)) continue; // bỏ qua số thứ tự dòng SRT

    // Trường hợp 1: SRT timestamp "00:01:20,000 --> 00:01:24,500"
    const srtMatch = line.match(/(\d{2}):(\d{2}):(\d{2})[,.]\d+\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.]\d+/);
    if (srtMatch) {
      const startSec = parseInt(srtMatch[1], 10) * 3600 + parseInt(srtMatch[2], 10) * 60 + parseInt(srtMatch[3], 10);
      const endSec = parseInt(srtMatch[4], 10) * 3600 + parseInt(srtMatch[5], 10) * 60 + parseInt(srtMatch[6], 10);

      // Đọc các dòng chữ phía sau
      let subtitleText = '';
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !lines[j].includes('-->')) {
        subtitleText += (subtitleText ? ' ' : '') + lines[j].trim();
        j++;
      }
      i = j - 1;

      // Tách tiếng Đức | tiếng Việt nếu có
      const parts = subtitleText.split(/\s*\|\s*/);
      subs.push({
        id: `sub_${subs.length + 1}`,
        start: startSec,
        end: endSec > startSec ? endSec : startSec + 4,
        de: parts[0] || '',
        vi: parts[1] || '',
      });
      continue;
    }

    // Trường hợp 2: Format ngắn "0:05 - Wie lange lernen Sie schon Deutsch? | Bạn học được bao lâu rồi?"
    const shortMatch = line.match(/^(\d+):(\d+)\s*[-:]\s*(.*?)(?:\s*\|\s*(.*))?$/);
    if (shortMatch) {
      const startSec = parseInt(shortMatch[1], 10) * 60 + parseInt(shortMatch[2], 10);
      subs.push({
        id: `sub_${subs.length + 1}`,
        start: startSec,
        end: startSec + 4,
        de: shortMatch[3].trim(),
        vi: shortMatch[4] ? shortMatch[4].trim() : '',
      });
      continue;
    }

    // Trường hợp 3: Dòng văn bản bình thường (tự tăng 4 giây mỗi câu)
    const p = line.split(/\s*\|\s*/);
    subs.push({
      id: `sub_${subs.length + 1}`,
      start: curAutoTime,
      end: curAutoTime + 4,
      de: p[0].trim(),
      vi: p[1] ? p[1].trim() : '',
    });
    curAutoTime += 4;
  }

  return subs;
}
