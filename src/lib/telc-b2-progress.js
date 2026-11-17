// Tiến độ học telc B2 — lưu localStorage (giống hệt cách app gốc "Học telc B2"
// lưu tiến độ), khóa riêng theo người dùng đang đăng nhập khi có thể.
// LƯU Ý: không dùng ee_state — gateway của server chỉ cho phép một danh sách
// khóa cố định và 'telcB2Progress' không nằm trong đó, đồng thời nhiệm vụ cấm
// sửa gateway.js / tạo endpoint mới / chạm dữ liệu Turso.
const KEY_BASE = 'sprachmeisterschaft:telcB2Progress';

export function defaultTelcB2Progress() {
  return {
    checks: [], // [{ day, blockId }]
    mastered: [], // [{ topicId, itemIndex }]
    reviews: [], // [{ topicId, itemIndex, box, dueAt }]
    scores: [], // [{ id, label, lesen, sprachbausteine, hoeren, schreiben, sprechen, createdAt }]
    errors: [], // [{ id, text, createdAt }]
    grammarLearned: [], // [topicId 1..8]
    completedDays: [], // [day]
    diagnostics: [], // [{ id, lesenRaw, lesenMax, hoerenRaw, hoerenMax, createdAt, answers: { answers, t1, t3 } | null }]
  };
}

function keyFor(userId) {
  return userId ? `${KEY_BASE}:${userId}` : `${KEY_BASE}:anon`;
}

export function loadTelcB2Progress(userId) {
  const fallback = defaultTelcB2Progress();
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function saveTelcB2Progress(userId, progress) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(progress));
  } catch {
    // Bộ nhớ trình duyệt đầy hoặc bị chặn — tiến độ phiên hiện tại vẫn giữ trong RAM.
  }
}
