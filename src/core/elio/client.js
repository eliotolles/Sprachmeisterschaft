// Presentation-independent compatibility client. No API keys, passwords, session
// tokens, account lists or cloud progress are persisted into browser storage.
export function createElioClient({ fetcher = (...args) => fetch(...args), timeoutMs = 20000 } = {}) {
  let identity = null;
  let epoch = 0;
  const versions = new Map();
  const writes = new Map();
  function fail(code, message, extra = {}) { return Object.assign(new Error(message), { code, ...extra }); }
  async function request(path, { method = 'GET', data, expectedEpoch = epoch, user = identity } = {}) {
    const response = await fetcher('/api/core' + path, {
      method, credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json', ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(user ? { 'X-Elio-User': user.id } : {}) },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (expectedEpoch !== epoch) throw fail('ACCOUNT_CHANGED', 'Tài khoản đã thay đổi; không áp dụng kết quả cũ.');
    let payload;
    try { payload = await response.json(); } catch { throw fail('INVALID_RESPONSE', 'Máy chủ trả dữ liệu không hợp lệ.'); }
    if (!response.ok) throw fail(payload.code || 'REQUEST_FAILED', payload.error || 'Yêu cầu chưa thành công.', { status: response.status, latest: payload.latest });
    return payload;
  }
  function setIdentity(user) {
    if (!user || typeof user.id !== 'string' || !user.id || !['admin', 'user'].includes(user.role)) throw fail('INVALID_USER', 'Tài khoản từ máy chủ không hợp lệ.');
    identity = Object.freeze({ id: user.id, email: user.email, name: user.name, role: user.role });
    versions.clear();
    return identity;
  }
  function requireUser() { if (!identity) throw fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.'); }
  async function loadState(keys, expectedEpoch = epoch, user = identity) {
    requireUser();
    const payload = await request('/state' + (keys ? '?keys=' + encodeURIComponent(keys.join(',')) : ''), { expectedEpoch, user });
    if (payload.userId !== user.id || !payload.records || typeof payload.records !== 'object') throw fail('ACCOUNT_CHANGED', 'Dữ liệu không khớp tài khoản.');
    for (const [name, row] of Object.entries(payload.records)) {
      if (!Number.isSafeInteger(row.version) || row.version < 1) throw fail('INVALID_RESPONSE', 'Phiên bản dữ liệu không hợp lệ.');
      versions.set(name, row.version);
    }
    if (keys) for (const name of keys) if (!Object.hasOwn(payload.records, name)) versions.set(name, 0);
    return payload.records;
  }
  return {
    getUser: () => identity,
    config: () => request('/config'),
    async restore() {
      const current = ++epoch; identity = null; versions.clear();
      try { return setIdentity((await request('/auth/me', { expectedEpoch: current, user: null })).user); }
      catch (error) { if (error.status === 401) return null; throw error; }
    },
    async login(email, password) {
      const current = ++epoch; identity = null; versions.clear();
      return setIdentity((await request('/auth/login', { method: 'POST', data: { email, password }, expectedEpoch: current, user: null })).user);
    },
    async register({ email, password, name }) {
      const current = ++epoch; identity = null; versions.clear();
      return setIdentity((await request('/auth/register', { method: 'POST', data: { email, password, name }, expectedEpoch: current, user: null })).user);
    },
    async logout() {
      requireUser(); const current = epoch;
      await request('/auth/logout', { method: 'POST', data: {}, expectedEpoch: current });
      ++epoch; identity = null; versions.clear();
    },
    loadState,
    saveState(name, value) {
      requireUser();
      const current = epoch, user = identity, key = user.id + ':' + name;
      // Capture this edit now, not after a previous asynchronous write finishes.
      const captured = structuredClone(value);
      const prior = writes.get(key) || Promise.resolve();
      const next = prior.catch(() => {}).then(async () => {
        if (current !== epoch) throw fail('ACCOUNT_CHANGED', 'Không ghi bản nháp của tài khoản trước.');
        if (!versions.has(name)) await loadState([name], current, user);
        const payload = await request('/state', { method: 'PUT', data: { name, value: captured, version: versions.get(name) }, expectedEpoch: current, user });
        if (payload.userId !== user.id || !Number.isSafeInteger(payload.version)) throw fail('INVALID_RESPONSE', 'Xác nhận lưu không hợp lệ.');
        versions.set(name, payload.version);
        return payload;
      });
      writes.set(key, next);
      next.then(() => { if (writes.get(key) === next) writes.delete(key); }, () => { if (writes.get(key) === next) writes.delete(key); });
      return next;
    },
    async vocabulary({ limit = 200, offset = 0, q, deck, level } = {}) {
      requireUser();
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      for (const [key, value] of Object.entries({ q, deck, level })) if (value !== undefined) params.set(key, value);
      return (await request('/vocabulary?' + params)).cards;
    },
    reviewVocabulary(sourceId, rating, { direction = 'de' } = {}) {
      requireUser();
      const name = 'sprach_vocabulary_reviews', current = epoch, user = identity, key = user.id + ':' + name;
      const prior = writes.get(key) || Promise.resolve();
      const next = prior.catch(() => {}).then(async () => {
        if (current !== epoch) throw fail('ACCOUNT_CHANGED', 'Không ghi lần ôn của tài khoản trước.');
        if (!versions.has(name)) await loadState([name], current, user);
        const payload = await request('/vocabulary/review', { method: 'POST',
          data: { sourceId, rating, direction, version: versions.get(name) }, expectedEpoch: current, user });
        if (payload.userId !== user.id || payload.sourceId !== sourceId || !Number.isSafeInteger(payload.version)) {
          throw fail('INVALID_RESPONSE', 'Xác nhận ôn từ không hợp lệ.');
        }
        versions.set(name, payload.version);
        return payload;
      });
      writes.set(key, next);
      next.then(() => { if (writes.get(key) === next) writes.delete(key); }, () => { if (writes.get(key) === next) writes.delete(key); });
      return next;
    },
    async records(kind) {
      requireUser(); return (await request('/records?kind=' + encodeURIComponent(kind))).items;
    },
  };
}
