/**
 * local-media-store.js — Lưu trữ video do người học tự tải lên.
 *
 * localStorage chỉ chứa được chuỗi JSON (~5MB) nên KHÔNG thể giữ file video.
 * Các file video được lưu dạng Blob trong IndexedDB của chính trình duyệt này.
 * Chỉ metadata (tên, kích thước, id...) nằm trong localStorage (qua db.listening).
 *
 * Ghi chú quan trọng:
 * - Video chỉ tồn tại trong trình duyệt/máy đã import. Xóa dữ liệu trình duyệt
 *   hoặc đổi máy khác sẽ mất video — cần import lại.
 * - Mọi hàm đều phòng thủ: môi trường không có IndexedDB (SSR/test Node)
 *   sẽ báo lỗi tiếng Việt rõ ràng thay vì crash.
 */

const DB_NAME = 'sprachmeisterschaft-media';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

// Giới hạn từng file video: 2 GB. Vượt quá sẽ từ chối với thông báo rõ ràng.
export const MAX_LOCAL_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

export function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

function isIndexedDBAvailable() {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('Trình duyệt này không hỗ trợ IndexedDB nên không lưu được video máy tính. Hãy dùng Chrome, Edge hoặc Firefox bản mới.'));
      return;
    }
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Không mở được kho lưu video (IndexedDB).'));
    request.onblocked = () => reject(new Error('Kho lưu video đang bị khóa bởi một tab khác. Hãy đóng các tab Sprachmeisterschaft khác rồi thử lại.'));
  });
}

function runTransaction(storeName, mode, task) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        let tx;
        try {
          tx = db.transaction(storeName, mode);
        } catch (err) {
          db.close();
          reject(err);
          return;
        }
        const store = tx.objectStore(storeName);
        let result;
        try {
          result = task(store);
        } catch (err) {
          db.close();
          reject(err);
          return;
        }
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error || new Error('Lỗi khi ghi/đọc kho lưu video.'));
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error || new Error('Thao tác với kho lưu video đã bị hủy.'));
        };
      })
  );
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Lỗi IndexedDB.'));
  });
}

function describeQuotaError(err) {
  if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
    return new Error(
      'Bộ nhớ trình duyệt đã đầy, không lưu được video này. Hãy xóa bớt video đã import trong kho Luyện nghe, hoặc dùng file nhỏ hơn rồi thử lại.'
    );
  }
  // Ghi Blob lớn xuống đĩa thất bại: trình duyệt thường báo UnknownError /
  // "Failed to write blobs (IOError)" khi ổ đĩa đầy hoặc hết hạn mức lưu trữ.
  if (err && (err.name === 'UnknownError' || /failed to write blobs|ioerror/i.test(err.message || ''))) {
    return new Error(
      'Trình duyệt ghi video xuống ổ đĩa thất bại (ổ đĩa có thể đã đầy hoặc hết hạn mức lưu trữ). Hãy import ít video mỗi lần, xóa bớt video cũ trong kho Luyện nghe, hoặc dọn chỗ trống trên ổ đĩa rồi thử lại.'
    );
  }
  return err;
}

/** Kiểm tra kích thước file trước khi lưu. Ném lỗi tiếng Việt nếu quá giới hạn. */
export function checkLocalVideoSize(bytes, fileName = '') {
  if (Number(bytes) > MAX_LOCAL_VIDEO_BYTES) {
    throw new Error(
      `Video "${fileName || 'này'}" quá lớn (${formatFileSize(bytes)}). Mỗi video tối đa ${formatFileSize(MAX_LOCAL_VIDEO_BYTES)}. Hãy nén nhỏ lại rồi import lại.`
    );
  }
}

/**
 * Lưu một video (File/Blob) vào IndexedDB.
 * @param {{id: string, blob: Blob, name?: string, type?: string}} input
 * @returns {Promise<{id: string, size: number, type: string}>}
 */
export async function saveLocalMedia({ id, blob, name = '', type = '' }) {
  if (!id || !blob) throw new Error('Thiếu thông tin video để lưu.');
  checkLocalVideoSize(blob.size, name || id);
  try {
    await runTransaction(STORE_NAME, 'readwrite', (store) =>
      requestToPromise(
        store.put({
          id,
          blob,
          name,
          type: type || blob.type || '',
          size: blob.size,
          addedAt: new Date().toISOString(),
        })
      )
    );
  } catch (err) {
    throw describeQuotaError(err);
  }
  return { id, size: blob.size, type: type || blob.type || '' };
}

/** Đọc Blob video theo id. Trả về null nếu không còn trong kho. */
export async function getLocalMedia(id) {
  if (!id) return null;
  try {
    const record = await runTransaction(STORE_NAME, 'readonly', (store) =>
      requestToPromise(store.get(id))
    );
    return record?.blob || null;
  } catch {
    return null;
  }
}

/** Tạo object URL (blob:) để phát video. Nhớ revoke khi không dùng nữa. */
export async function getLocalMediaUrl(id) {
  const blob = await getLocalMedia(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/** Kiểm tra video còn trong kho không (không đọc toàn bộ Blob). */
export async function hasLocalMedia(id) {
  if (!id) return false;
  try {
    const key = await runTransaction(STORE_NAME, 'readonly', (store) =>
      requestToPromise(store.getKey(id))
    );
    return key !== undefined && key !== null;
  } catch {
    return false;
  }
}

/** Xóa một video khỏi kho. Không báo lỗi nếu id không tồn tại. */
export async function deleteLocalMedia(id) {
  if (!id) return false;
  try {
    await runTransaction(STORE_NAME, 'readwrite', (store) =>
      requestToPromise(store.delete(id))
    );
    return true;
  } catch {
    return false;
  }
}

/** Xóa nhiều video một lúc (dọn dẹp khi xóa bộ nghe). */
export async function deleteLocalMediaMany(ids = []) {
  const list = [...new Set((ids || []).filter(Boolean))];
  for (const id of list) {
    await deleteLocalMedia(id);
  }
  return list.length;
}

/** Ước lượng dung lượng kho video đang dùng (để hiển thị nếu cần). */
export async function estimateLocalMediaStorage() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      return { usage: est.usage || 0, quota: est.quota || 0 };
    }
  } catch {}
  return { usage: 0, quota: 0 };
}

/**
 * Liệt kê tất cả video đang nằm trong kho IndexedDB (kèm Blob).
 * Dùng để khôi phục lại tập video khi metadata trong localStorage bị mất
 * (ví dụ sau khi bấm "Khôi phục gốc") mà file Blob vẫn còn nguyên.
 */
export async function listLocalMedia() {
  const records = await runTransaction(STORE_NAME, 'readonly', (store) =>
    requestToPromise(store.getAll())
  );
  return (records || []).map((r) => ({
    id: r.id,
    blob: r.blob,
    name: r.name || '',
    type: r.type || '',
    size: r.size || 0,
    addedAt: r.addedAt || '',
  }));
}
