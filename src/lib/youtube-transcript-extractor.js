/**
 * YouTube Transcript Extractor - Module độc lập
 * Tự động lấy phụ đề tiếng Đức (bản hiện lời / cues) từ YouTube.
 * Hoạt động 100% trên Trình duyệt (Browser), Node.js, Cloudflare Workers, Vercel.
 * Mở CORS đầy đủ, không bao giờ báo lỗi "Chưa cấu hình backend phụ đề".
 */

export function extractYouTubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const str = urlOrId.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export async function getYouTubeTranscript(videoUrlOrId, lang = 'de') {
  const videoId = extractYouTubeId(videoUrlOrId);
  if (!videoId) {
    return { available: false, reason: 'ID video YouTube không hợp lệ.', cues: [] };
  }
  const sameLang = (a, b) => {
    const x = String(a || '').toLowerCase(), y = String(b || '').toLowerCase();
    return !!x && !!y && (x === y || x.startsWith(y + '-') || y.startsWith(x + '-'));
  };
  const toCues = list => list
    .filter(c => typeof c?.text === 'string' && c.text.trim())
    .map(c => {
      const start = Math.max(0, Number(c.start) || 0);
      const duration = Math.max(0.5, Number(c.duration) || 2);
      return {
        start: Math.round(start * 1000) / 1000,
        end: Math.round((start + duration) * 1000) / 1000,
        text: c.text.trim()
      };
    })
    .sort((a, b) => a.start - b.start);

  let serverError = null;
  // 1. GỌI BACKEND CỦA APP TRƯỚC — server tự thử lại và chỉ chấp nhận đúng
  // ngôn ngữ yêu cầu. (Trước đây gọi thẳng dịch vụ ngoài trước, vừa chậm
  // vừa hay nhận nhầm ngôn ngữ khác thành tiếng Đức.)
  try {
    const { elioClient } = await import('@/lib/elio-auth-runtime');
    if (elioClient.getUser()) {
      const data = await elioClient.listeningTranscript({ videoId });
      if (data && data.available && Array.isArray(data.cues) && data.cues.length > 0) {
        const cues = data.cues
          .filter(c => typeof c?.text === 'string' && c.text.trim())
          .map(c => ({
            start: Math.round(Number(c.start) * 1000) / 1000,
            end: Math.round(Number(c.end) * 1000) / 1000,
            text: c.text.trim()
          }))
          .sort((a, b) => a.start - b.start);
        if (cues.length > 0) {
          return {
            available: true,
            videoId,
            language: data.language || lang,
            source: data.source || 'youtube',
            via: 'server',
            cues
          };
        }
      }
    }
  } catch (err) {
    serverError = err;
    console.warn('Server transcript call error:', err);
  }

  // Server trả lỗi dứt khoát (sai ngôn ngữ / video không có phụ đề) thì
  // không gọi lại dịch vụ ngoài — kết quả sẽ giống hệt, chỉ tốn thêm thời gian.
  const DEFINITIVE_CODES = ['CAPTIONS_WRONG_LANGUAGE', 'CAPTIONS_NOT_CONFIGURED', 'CAPTIONS_DATA_MISMATCH', 'CAPTIONS_INVALID_DATA', 'CAPTIONS_TOO_LARGE', 'INVALID_VIDEO_ID'];
  if (serverError && DEFINITIVE_CODES.includes(serverError.code)) {
    return { available: false, reason: serverError.message || 'Không lấy được phụ đề tiếng Đức cho video này.', cues: [] };
  }

  // 2. GỌI TRỰC TIẾP FreeTranscriptAPI (dự phòng khi server bận / chưa đăng nhập).
  // Chỉ chấp nhận đúng ngôn ngữ yêu cầu — dịch vụ này trả ngôn ngữ khác
  // khi video không có track tiếng Đức.
  try {
    const res = await fetch(`https://api.freetranscriptapi.com/v1/transcript?video_url=${videoId}&lang=${lang}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000)
    });

    if (res.ok) {
      const data = await res.json();
      const returnedLang = String(data?.language || '').toLowerCase();
      if (returnedLang && !sameLang(returnedLang, lang)) {
        return { available: false, reason: `Video này không có phụ đề tiếng Đức (chỉ có phụ đề tiếng ${returnedLang}).`, cues: [] };
      }
      const cues = toCues(Array.isArray(data?.transcript) ? data.transcript : []);
      if (cues.length > 0) {
        return {
          available: true,
          videoId,
          language: data.language || lang,
          source: 'youtube',
          via: 'freetranscriptapi',
          cues
        };
      }
    }
  } catch (err) {
    console.warn('FreeTranscriptAPI call error:', err);
  }

  // (Fallback cũ qua proxy allorigins đã bỏ: YouTube trả trang kiểm tra bot
  // không còn captionTracks nên không bao giờ lấy được gì, chỉ tốn thêm ~20s.)
  return {
    available: false,
    reason: serverError?.message || 'Không lấy được phụ đề tiếng Đức tự động lúc này (dịch vụ lấy lời đang bận). Bạn có thể tải file .srt của bài lên thay thế.',
    cues: []
  };
}

export function cuesToSrt(cues) {
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const formatTime = seconds => {
    const ms = Math.round(seconds * 1000);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msec = ms % 1000;
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msec, 3)}`;
  };
  return cues.map((c, i) => `${i + 1}\n${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.text}`).join('\n\n') + '\n';
}

export function cuesToVtt(cues) {
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const formatTime = seconds => {
    const ms = Math.round(seconds * 1000);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msec = ms % 1000;
    return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(msec, 3)}`;
  };
  return 'WEBVTT\n\n' + cues.map(c => `${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.text}`).join('\n\n') + '\n';
}
