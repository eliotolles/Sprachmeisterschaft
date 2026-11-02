import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X, Trash2, CheckCircle2 } from 'lucide-react';

let confirmResolve = null;

/**
 * Hiển thị popup xác nhận thay thế window.confirm mặc định của trình duyệt:
 * - Căn chính giữa màn hình (centered modal)
 * - Nền mờ sang trọng (backdrop blur)
 * - Tương thích hoàn hảo với giao diện học thuật cổ điển của Sprachmeisterschaft
 * - Trả về Promise<boolean> (true nếu người dùng bấm Xác nhận, false nếu Hủy)
 */
export function showConfirmModal({
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này không?',
  eyebrow = 'CẢNH BÁO NGUY HIỂM',
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy bỏ',
  variant = 'danger', // 'danger' | 'warning' | 'info'
}) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sprach_open_confirm', {
          detail: {
            title,
            message,
            eyebrow,
            confirmText,
            cancelText,
            variant,
          },
        })
      );
    }
  });
}

export function GlobalConfirmModal() {
  const [modalState, setModalState] = useState(null);

  useEffect(() => {
    const handleOpen = (e) => {
      setModalState(e.detail);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('sprach_open_confirm', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('sprach_open_confirm', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!modalState) return null;

  const handleClose = () => {
    if (confirmResolve) confirmResolve(false);
    confirmResolve = null;
    setModalState(null);
  };

  const handleConfirm = () => {
    if (confirmResolve) confirmResolve(true);
    confirmResolve = null;
    setModalState(null);
  };

  const isDanger = modalState.variant === 'danger';
  const isWarning = modalState.variant === 'warning';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="surface max-w-md w-full p-6 sm:p-7 rounded-sm border border-border shadow-2xl space-y-4 animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Eyebrow and Close Button */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span
            className={`font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
              isDanger
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                : isWarning
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                : 'bg-accent/15 text-accent border border-accent/30'
            }`}
          >
            {modalState.eyebrow || (isDanger ? 'CẢNH BÁO NGUY HIỂM' : 'XÁC NHẬN HỆ THỐNG')}
          </span>

          <button
            type="button"
            onClick={handleClose}
            className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Icon & Message */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-1">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : isWarning
                ? 'bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-accent/10 border-2 border-accent/30 text-accent'
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-6 h-6 animate-pulse" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1.5 flex-1 text-center sm:text-left">
            <h3 className="font-display text-xl font-bold text-foreground leading-snug">
              {modalState.title}
            </h3>
            <p className="font-body text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {modalState.message}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            className="tap px-4 py-2 rounded-sm border border-border bg-card hover:bg-muted text-foreground text-xs font-mono font-medium transition-colors"
          >
            {modalState.cancelText || 'Hủy bỏ'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className={`tap px-4 py-2 rounded-sm text-xs font-mono font-bold shadow-sm transition-colors flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700/50'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-700/50'
                : 'bg-accent hover:bg-accent/90 text-accent-foreground border border-accent/40'
            }`}
          >
            {isDanger && <Trash2 className="w-3.5 h-3.5" />}
            <span>{modalState.confirmText || (isDanger ? 'Xác nhận xóa' : 'Xác nhận')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
