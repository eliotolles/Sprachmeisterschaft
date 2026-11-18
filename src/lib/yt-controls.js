// Hàm thuần cho thanh điều khiển video riêng kiểu YouTube
// (ListeningPlayerPage.jsx). Tách riêng để test được bằng node:test;
// mọi tương tác với YT IFrame API vẫn nằm trong component.

// 0 -> "0:00", 65 -> "1:05", 3661 -> "1:01:01"
export function formatVideoTime(seconds) {
  const total = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(Number(seconds))) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mmss = `${m}:${String(s).padStart(2, '0')}`;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : mmss;
}

// Tua +/- giây, kẹp trong [0, duration]. duration <= 0 thì giữ nguyên giờ hiện tại.
export function clampSeekTime(current, delta, duration) {
  const cur = Number.isFinite(Number(current)) ? Number(current) : 0;
  const dur = Number.isFinite(Number(duration)) ? Number(duration) : 0;
  if (dur <= 0) return Math.max(0, cur + delta);
  return Math.max(0, Math.min(dur, cur + delta));
}

// Âm lượng YouTube 0-100, bước 5 như phím mũi tên lên/xuống của YouTube.
export function stepVolume(volume, delta) {
  const vol = Number.isFinite(Number(volume)) ? Number(volume) : 0;
  return Math.max(0, Math.min(100, vol + delta));
}

// Phím tắt nào thì xử lý, phím nào bỏ qua. Trả về hành động hoặc null.
// targetTag: tagName viết thường của element đang focus; contentEditable: có đang gõ trong vùng sửa được không.
export function resolveVideoShortcut(key, targetTag, contentEditable) {
  if (contentEditable) return null;
  if (['input', 'textarea', 'select'].includes(targetTag)) return null;
  const k = typeof key === 'string' ? key : '';
  if (k === ' ' || k.toLowerCase() === 'k') return 'toggle-play';
  if (k === 'ArrowLeft') return 'seek-back-5';
  if (k === 'ArrowRight') return 'seek-forward-5';
  if (k.toLowerCase() === 'j') return 'seek-back-10';
  if (k.toLowerCase() === 'l') return 'seek-forward-10';
  if (k.toLowerCase() === 'f') return 'toggle-fullscreen';
  if (k.toLowerCase() === 'm') return 'toggle-mute';
  if (k === 'ArrowUp') return 'volume-up';
  if (k === 'ArrowDown') return 'volume-down';
  return null;
}
