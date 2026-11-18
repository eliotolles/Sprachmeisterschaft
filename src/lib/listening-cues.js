// Leaf module (no imports): chuẩn hóa phụ đề trước khi lưu lên máy chủ.
// Cùng luật với validateImport('listening') ở server: mỗi câu tối đa 1500 ký
// tự, start/end hợp lệ, start không giảm dần, tối đa 10000 câu.
export function cleanListeningCues(cues) {
  return (cues || [])
    .map((c) => ({
      start: c.start,
      end: c.end,
      text: String(c.de ?? c.text ?? '').trim(),
      vi: String(c.vi ?? '').trim(),
    }))
    .filter(
      (c) =>
        c.text &&
        c.text.length <= 1500 &&
        Number.isFinite(c.start) &&
        Number.isFinite(c.end) &&
        c.start >= 0 &&
        c.end > c.start
    )
    .sort((a, b) => a.start - b.start)
    .filter((c, i, a) => !i || c.start >= a[i - 1].start)
    .slice(0, 10000);
}
