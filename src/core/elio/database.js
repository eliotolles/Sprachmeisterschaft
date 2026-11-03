// Server-only Turso transport. Never import this module into browser entry points.
export const APPROVED_HOST = 'elio-einfach-new-eliotollesmann.aws-ap-southeast-1.turso.io';
export function coreError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}
export function databaseEndpoint(raw, expectedHost = APPROVED_HOST) {
  let url;
  try { url = new URL(String(raw).replace(/^libsql:\/\//, 'https://')); }
  catch { throw coreError(503, 'DATABASE_CONFIG', 'Database chưa được cấu hình đúng.'); }
  if (url.protocol !== 'https:' || url.hostname !== expectedHost || expectedHost !== APPROVED_HOST ||
      url.username || url.password || url.port || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw coreError(503, 'DATABASE_CONFIG', 'Database không khớp đích migration đã được phép.');
  }
  return new URL('/v2/pipeline', url.origin).href;
}
function cell(value) {
  if (value === null) return { type: 'null' };
  if (Number.isSafeInteger(value)) return { type: 'integer', value: String(value) };
  if (typeof value === 'string') return { type: 'text', value };
  throw new TypeError('Unsupported SQL parameter');
}
export async function query(env, sql, args = []) {
  // A function binding is used only by isolated SQLite tests, never read from request input.
  if (typeof env.TEST_CORE_DB === 'function') return env.TEST_CORE_DB(sql, args);
  const endpoint = databaseEndpoint(env.TURSO_DATABASE_URL, env.ELIO_CORE_EXPECTED_HOST || APPROVED_HOST);
  if (!env.TURSO_AUTH_TOKEN) throw coreError(503, 'DATABASE_CONFIG', 'Database chưa được kết nối.');
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.TURSO_AUTH_TOKEN },
      body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args: args.map(cell), want_rows: true } }, { type: 'close' }] }),
    });
    if (!response.ok) {
      if ([401,403].includes(response.status)) throw coreError(503,'DATABASE_AUTH','Turso từ chối quyền truy cập. Cần kiểm tra token database trên Worker.');
      throw coreError(503,'DATABASE_HTTP','Kết nối Turso trả lỗi HTTP '+response.status+'. Không tự gửi lại thao tác ghi.');
    }
    const data = await response.json();
    const first = data?.results?.[0];
    if (first?.type !== 'ok') {
      const message=String(first?.error?.message || '');
      if (/no such (table|column)/i.test(message)) throw coreError(503,'DATABASE_SCHEMA','Database của Worker thiếu bảng hoặc cột cần thiết. Cần đối chiếu đúng database đã chuẩn bị.');
      if (/readonly|read.only|not authorized|permission/i.test(message)) throw coreError(503,'DATABASE_WRITE_ACCESS','Token Turso của Worker không có quyền ghi cần thiết cho đăng nhập.');
      throw coreError(503,'DATABASE_QUERY','Turso không thực hiện được truy vấn đăng nhập. Cần kiểm tra log máy chủ.');
    }
    if (data?.results?.[1]?.type !== 'ok') throw coreError(503,'DATABASE_CLOSE','Chưa xác nhận đóng kết nối Turso; không tự gửi lại thao tác ghi.');
    const result = first.response?.result;
    if (!Array.isArray(result?.cols) || !Array.isArray(result?.rows)) throw new Error('Upstream shape');
    return { rows: result.rows.map(row => {
      if (!Array.isArray(row) || row.length !== result.cols.length) throw new Error('Upstream row');
      return Object.fromEntries(row.map((v, i) => [result.cols[i].name,
        v.type === 'null' ? null : ['integer', 'float'].includes(v.type) ? Number(v.value) : v.value]));
    }), changes: Number(result.affected_row_count || 0) };
  } catch (error) {
    if (error?.code?.startsWith('DATABASE_')) throw error;
    if (['TimeoutError','AbortError'].includes(error?.name)) throw coreError(503,'DATABASE_TIMEOUT','Kết nối Turso quá thời gian chờ. Không tự gửi lại thao tác ghi.');
    throw coreError(503, 'DATABASE_UNAVAILABLE', 'Không nhận được phản hồi hợp lệ từ Turso. Không tự gửi lại thao tác ghi.');
  }
}
