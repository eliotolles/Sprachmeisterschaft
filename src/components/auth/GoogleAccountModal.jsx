import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import {
  X,
  User,
  Plus,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Loader2,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

const SAVED_ACCOUNTS_KEY = 'sprach_saved_google_accounts';

const DEFAULT_ACCOUNTS = [
  {
    name: 'Nguyễn Văn Đạt',
    email: 'dat.nguyenviet.1999@gmail.com',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    isAdmin: true,
  },
];

export function GoogleAccountModal({ isOpen, onClose, onSuccess }) {
  const { navigate } = useRouter();
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure primary admin is always included
          const hasAdmin = parsed.some(
            (a) => a.email?.toLowerCase() === 'dat.nguyenviet.1999@gmail.com'
          );
          if (!hasAdmin) {
            return [...DEFAULT_ACCOUNTS, ...parsed];
          }
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_ACCOUNTS;
  });

  useEffect(() => {
    if (isOpen) {
      setView('list');
      setError('');
      setCustomEmail('');
      setCustomName('');
      setIsSubmitting(false);
      setSelectedEmail(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveAccountToHistory = (account) => {
    try {
      const updated = [
        account,
        ...accounts.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase()),
      ].slice(0, 6);
      setAccounts(updated);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSelectAccount = (account) => {
    setSelectedEmail(account.email);
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const user = db.auth.loginWithGoogle({
          email: account.email,
          name: account.name,
          picture: account.picture,
        });

        saveAccountToHistory(account);

        toast.success(
          account.email.toLowerCase() === 'dat.nguyenviet.1999@gmail.com'
            ? 'Đăng nhập thành công với quyền Super Admin!'
            : `Đăng nhập Google thành công: ${account.name || account.email}`
        );

        if (onSuccess) {
          onSuccess(user);
        } else {
          if (user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
        onClose();
      } catch (err) {
        setError(err.message || 'Đăng nhập Google thất bại');
        setIsSubmitting(false);
      }
    }, 450);
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: yourname@gmail.com)');
      return;
    }

    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    const isAdmin = cleanEmail === 'dat.nguyenviet.1999@gmail.com';

    const newAccount = {
      name: cleanName,
      email: cleanEmail,
      picture: null,
      isAdmin,
    };

    handleSelectAccount(newAccount);
  };

  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    if (emailToRemove.toLowerCase() === 'dat.nguyenviet.1999@gmail.com') {
      toast.info('Tài khoản Super Admin mặc định không thể xóa khỏi danh sách chọn nhanh.');
      return;
    }
    const updated = accounts.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    setAccounts(updated);
    try {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (err) {}
    toast.success('Đã xóa tài khoản khỏi danh sách chọn nhanh');
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-[420px] rounded-lg border border-border shadow-2xl overflow-hidden animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Google Logo & Title */}
        <div className="p-6 pb-4 text-center border-b border-border relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Google 4-Color Logo */}
          <div className="w-8 h-8 mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h3 className="font-heading text-lg font-semibold text-foreground">
            {view === 'list' ? 'Chọn tài khoản Google' : 'Sử dụng tài khoản khác'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            để tiếp tục đăng nhập vào <span className="font-semibold text-foreground">Sprachmeisterschaft</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          {error && (
            <div className="mb-4 p-3 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
              {error}
            </div>
          )}

          {view === 'list' ? (
            <div className="space-y-1.5">
              {/* Account list */}
              {accounts.map((acc) => {
                const isSelected = selectedEmail === acc.email && isSubmitting;
                const isAdminAccount = acc.email.toLowerCase() === 'dat.nguyenviet.1999@gmail.com';

                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full text-left p-3 rounded-md border border-transparent hover:border-border hover:bg-muted/60 transition-all flex items-center justify-between group active:scale-[0.99] disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {acc.picture ? (
                          <img
                            src={acc.picture}
                            alt={acc.name}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-accent/15 text-accent border border-accent/30 font-bold flex items-center justify-center text-sm font-heading">
                            {(acc.name || acc.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isAdminAccount && (
                          <span
                            className="absolute -top-1 -right-1 text-[10px]"
                            title="Quản trị viên Super Admin"
                          >
                            👑
                          </span>
                        )}
                      </div>

                      {/* Name & Email */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {acc.name || acc.email}
                          </span>
                          {isAdminAccount && (
                            <span className="text-[9px] font-mono px-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
                              Super Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{acc.email}</p>
                      </div>
                    </div>

                    {/* Actions / Status */}
                    <div className="shrink-0 flex items-center gap-1 ml-2">
                      {isSelected ? (
                        <Loader2 className="w-4 h-4 text-accent animate-spin" />
                      ) : (
                        !isAdminAccount && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveAccount(e, acc.email)}
                            className="p-1 rounded text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa khỏi danh sách chọn nhanh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Add another account option */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setView('add')}
                className="w-full text-left p-3 rounded-md border border-dashed border-border hover:border-accent/40 hover:bg-muted/40 transition-colors flex items-center gap-3 text-xs font-medium text-foreground active:scale-[0.99] mt-2"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">Sử dụng một tài khoản khác</div>
                  <div className="text-[10px] text-muted-foreground">
                    Nhập Gmail cá nhân của bạn để tạo hồ sơ riêng biệt
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* Add custom Google account form */
            <form onSubmit={handleAddAccount} className="space-y-4">
              <button
                type="button"
                onClick={() => setView('list')}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại danh sách tài khoản</span>
              </button>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Địa chỉ Gmail / Email Google *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="ví dụ: nguyenvana@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Nhập <span className="font-mono font-bold text-accent">dat.nguyenviet.1999@gmail.com</span> nếu bạn là Super Admin.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Họ và tên hiển thị (tùy chọn)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="ví dụ: Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-3 py-1.5 rounded-sm border border-border text-xs font-mono hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <span>Tiếp tục đăng nhập</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-4 bg-muted/40 border-t border-border text-[10px] text-muted-foreground leading-relaxed">
          Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, tùy chọn ngôn ngữ và ảnh hồ sơ của bạn với
          Sprachmeisterschaft.
        </div>
      </div>
    </div>
  );
}
