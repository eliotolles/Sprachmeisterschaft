/**
 * YouTube Transcript Extractor - Module độc lập cho Sprachmeisterschaft
 * Tự động lấy phụ đề (bản hiện lời / cues) từ link hoặc ID video YouTube.
 * Hoạt động trực tiếp trên trình duyệt, Node.js hoặc Edge.
 */

export function extractYouTubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const str = urlOrId.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function parseCaptionPayload(raw) {
  try {
    const json = JSON.parse(raw);
    if (Array.isArray(json?.events)) return json;
  } catch {}

  const decode = text => text
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, v) => {
      if (v[0] === '#') {
        const n = v[1].toLowerCase() === 'x' ? parseInt(v.slice(2), 16) : parseInt(v.slice(1), 10);
        return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
      }
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[v.toLowerCase()] || '';
    });

  const attr = (text, name) => text.match(new RegExp('(?:^|\\s)' + name + '=["\']([^"\']*)["\']'))?.[1];
  const events = [];

  if (/<(?:transcript|timedtext)(?:\s|>)/i.test(raw)) {
    for (const m of raw.matchAll(/<(text|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      const isP = m[1].toLowerCase() === 'p';
      const start = attr(m[2], isP ? 't' : 'start');
      const duration = attr(m[2], isP ? 'd' : 'dur');
      if (start === undefined) continue;
      events.push({
        tStartMs: Number(start) * (isP ? 1 : 1000),
        ...(duration === undefined ? {} : { dDurationMs: Number(duration) * (isP ? 1 : 1000) }),
        segs: [{ utf8: decode(m[3]) }]
      });
    }
    return { events };
  }

  if (/^\s*WEBVTT/.test(raw)) {
    const toSeconds = v => v.split(':').reduce((n, p) => n * 60 + Number(p), 0);
    for (const block of raw.replace(/\r/g, '').split(/\n\s*\n/)) {
      const lines = block.split('\n');
      const i = lines.findIndex(l => l.includes('-->'));
      if (i < 0) continue;
      const t = lines[i].match(/([\d:.]+)\s+-->\s+([\d:.]+)/);
      if (!t) continue;
      const start = toSeconds(t[1]);
      const end = toSeconds(t[2]);
      events.push({
        tStartMs: start * 1000,
        dDurationMs: (end - start) * 1000,
        segs: [{ utf8: decode(lines.slice(i + 1).join(' ')) }]
      });
    }
    return { events };
  }

  return null;
}

function extractEmbeddedJSON(html, pattern) {
  pattern.lastIndex = 0;
  let match, count = 0;
  while ((match = pattern.exec(html)) && count++ < 12) {
    let start = pattern.lastIndex;
    while (/\s/.test(html[start] || '') && start < html.length) start++;
    if (html[start] === '{') {
      let depth = 0, inString = false, escape = false;
      for (let i = start; i < html.length; i++) {
        const c = html[i];
        if (inString) {
          if (escape) escape = false;
          else if (c === '\\') escape = true;
          else if (c === '"') inString = false;
        } else {
          if (c === '"') inString = true;
          else if (c === '{') depth++;
          else if (c === '}') {
            depth--;
            if (depth === 0) {
              try { return JSON.parse(html.slice(start, i + 1)); } catch { break; }
            }
          }
        }
      }
    }
  }
  return null;
}

export async function getYouTubeTranscript(videoUrlOrId, lang = 'de') {
  const videoId = extractYouTubeId(videoUrlOrId);
  if (!videoId) {
    return { available: false, reason: 'ID video YouTube không hợp lệ.', cues: [] };
  }

  // 1. Thử gọi API backend nội bộ nếu có (/api/listening/captions hoặc /api/transcript)
  try {
    const apiRes = await fetch('/api/listening/captions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: videoId })
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

  // 2. Thử gọi /api/transcript?video_id=
  try {
    const apiRes = await fetch(`/api/transcript?video_id=${videoId}&lang=${lang}`);
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

  // 3. Fallback: Bóc tách trực tiếp trang YouTube
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=${lang}`;
    const pageRes = await fetch(watchUrl, {
      headers: {
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,vi;q=0.7'
      }
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      const playerResponse = 
        extractEmbeddedJSON(html, /(?:\bytInitialPlayerResponse\b|window\s*\[\s*["']ytInitialPlayerResponse["']\s*\])\s*=\s*/g) ||
        extractEmbeddedJSON(html, /"(?:player_response|playerResponse|ytInitialPlayerResponse)"\s*:\s*/g);

      const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(captionTracks) && captionTracks.length > 0) {
        const langRegex = new RegExp(`^${lang}(?:[-_]|$)`, 'i');
        const candidates = captionTracks
          .filter(t => langRegex.test(t.languageCode || ''))
          .sort((a, b) => Number(a.kind === 'asr') - Number(b.kind === 'asr'));

        const track = candidates[0] || captionTracks[0];
        const subRes = await fetch(track.baseUrl + '&fmt=json3').catch(() => fetch(track.baseUrl));
        if (subRes && subRes.ok) {
          const raw = await subRes.text();
          const parsed = parseCaptionPayload(raw);
          if (parsed && Array.isArray(parsed.events)) {
            const cues = [];
            for (let i = 0; i < parsed.events.length; i++) {
              const e = parsed.events[i];
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
                language: track.languageCode,
                source: track.kind === 'asr' ? 'youtube-auto' : 'youtube',
                cues
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Direct YouTube extraction failed:', err);
  }

  return {
    available: false,
    reason: 'Chưa lấy được phụ đề tự động từ video này. Bạn có thể tự dán văn bản phụ đề nếu có.',
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
