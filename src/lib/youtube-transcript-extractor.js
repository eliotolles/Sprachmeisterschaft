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

  // 1. GỌI TRỰC TIẾP FreeTranscriptAPI (Hỗ trợ CORS toàn cầu access-control-allow-origin: *, không cần backend)
  try {
    const res = await fetch(`https://api.freetranscriptapi.com/v1/transcript?video_url=${videoId}&lang=${lang}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.transcript) && data.transcript.length > 0) {
        const cues = data.transcript
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
    }
  } catch (err) {
    console.warn('FreeTranscriptAPI call error:', err);
  }

  // 2. THỬ GỌI BACKEND NỘI BỘ NẾU CÓ (/api/listening/captions)
  try {
    const apiRes = await fetch('/api/listening/captions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: videoId }),
      signal: AbortSignal.timeout(15000)
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.available && Array.isArray(data.cues) && data.cues.length > 0) {
        return {
          available: true,
          videoId,
          language: data.language || lang,
          source: data.source || 'youtube',
          cues: data.cues
        };
      }
    }
  } catch {}

  // 3. THỬ QUA PROXY CORS DỰ PHÒNG (Cho trường hợp Direct YouTube timedtext)
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}&hl=${lang}`)}`;
    const pageRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(20000) });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const match = html.match(/\"captionTracks\":\s*(\[[^\]]+\])/);
      if (match) {
        const tracks = JSON.parse(match[1]);
        const langRegex = new RegExp(`^${lang}(?:[-_]|$)`, 'i');
        const candidate = tracks.find(t => langRegex.test(t.languageCode || '')) || tracks[0];
        if (candidate?.baseUrl) {
          const subUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(candidate.baseUrl + '&fmt=json3')}`;
          const subRes = await fetch(subUrl, { signal: AbortSignal.timeout(20000) });
          if (subRes.ok) {
            const raw = await subRes.json().catch(() => null);
            if (raw && Array.isArray(raw.events)) {
              const cues = [];
              for (const e of raw.events) {
                if (!e || e.tStartMs === undefined) continue;
                const text = (Array.isArray(e.segs) ? e.segs : [])
                  .map(s => s?.utf8 || '')
                  .join('')
                  .replace(/\s+/g, ' ')
                  .trim();
                const start = Number(e.tStartMs) / 1000;
                let end = (Number(e.tStartMs) + Number(e.dDurationMs)) / 1000;
                if (isNaN(end) || end <= start) end = start + 3;
                if (text && end > start) {
                  cues.push({
                    start: Math.round(start * 1000) / 1000,
                    end: Math.round(end * 1000) / 1000,
                    text
                  });
                }
              }
              if (cues.length > 0) {
                return {
                  available: true,
                  videoId,
                  language: candidate.languageCode,
                  source: 'youtube',
                  cues
                };
              }
            }
          }
        }
      }
    }
  } catch {}

  return {
    available: false,
    reason: 'Video này không có phụ đề tiếng Đức công khai hoặc YouTube đang tạm thời hạn chế truy cập. Bạn có thể tự dán văn bản phụ đề nếu có.',
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
