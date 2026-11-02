import React, { useState, useEffect } from 'react';
import { db, isSystemAdminEmail } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { GOOGLE_PRESET_ACCOUNTS } from './LoginPage';
import { 
  X, 
  ShieldCheck, 
  UserPlus, 
  ChevronDown, 
  Loader2, 
  Mail, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export function GoogleAccountModal({ isOpen, onClose, onSuccess }) {
  const { navigate } = useRouter();
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Chế độ nhập tài khoản Google khác
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const [accounts, setAccounts] = useState(GOOGLE_PRESET_ACCOUNTS);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedEmail(null);
      setIsSubmitting(false);
      setShowCustomModal(false);

      try {
        const saved = localStorage.getItem('sprach_custom_google_accounts');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAccounts([...GOOGLE_PRESET_ACCOUNTS, ...parsed]);
          }
        }
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Xử lý đăng nhập ngay khi click vào 1 tài khoản
  const handleSelectAccount = (account) => {
    setError('');
    setSelectedEmail(account.email);
    setIsSubmitting(true);

    setTimeout(async () => {
      try {
        const isAdmin = isSystemAdminEmail(account.email);
        const user = await db.auth.loginWithGoogle({
          email: account.email,
          name: account.name,
          picture: account.avatarUrl || null,
        });

        if (isAdmin || user.role === 'admin') {
          toast.success(`👑 Chào mừng Super Admin: ${account.name}!`, {
            description: `Đăng nhập quyền Quản trị tối cao với email ${account.email}`,
          });
          onClose?.();
          if (onSuccess) onSuccess(user);
          else navigate('/admin');
        } else {
          toast.success(`Đăng nhập Google thành công!`, {
            description: `Chào mừng ${account.name} đã quay trở lại.`,
          });
          onClose?.();
          if (onSuccess) onSuccess(user);
          else navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
        setIsSubmitting(false);
        setSelectedEmail(null);
      }
    }, 400);
  };

  // Thêm tài khoản Google khác
  const handleAddCustomAccount = (e) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Vui lòng nhập địa chỉ email Google hợp lệ (ví dụ: yourname@gmail.com)');
      return;
    }

    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    const isAdmin = isSystemAdminEmail(cleanEmail);

    const newAcc = {
      id: `acc_custom_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      avatarType: 'text',
      avatarText: cleanName.charAt(0).toUpperCase(),
      avatarBg: isAdmin ? 'bg-amber-950 text-amber-200 border-amber-600' : 'bg-blue-950 text-blue-200 border-blue-600',
      isSuperAdmin: isAdmin,
    };

    try {
      const saved = JSON.parse(localStorage.getItem('sprach_custom_google_accounts') || '[]');
      const filtered = saved.filter((a) => a.email !== cleanEmail);
      filtered.push(newAcc);
      localStorage.setItem('sprach_custom_google_accounts', JSON.stringify(filtered));
    } catch (e) {}

    setShowCustomModal(false);
    handleSelectAccount(newAcc);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      {/* Container chính chuẩn Google Account Picker Dark Mode */}
      <div
        className="w-full max-w-[980px] bg-[#1a1b1e] border border-[#2d2e31] rounded-[28px] p-6 sm:p-10 md:p-12 shadow-2xl relative my-auto transition-all duration-300 text-[#e3e3e3] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng modal X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#282a2d] hover:bg-[#383a3f] text-[#9aa0a6] hover:text-white flex items-center justify-center transition-colors"
          title="Đóng (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Thanh tiến trình khi đang đăng nhập (Google Bar) */}
        {isSubmitting && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-transparent overflow-hidden rounded-t-[28px]">
            <div className="h-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] animate-pulse w-full" />
          </div>
        )}

        {/* Header: Logo Google + Chữ "Đăng nhập bằng Google" */}
        <div className="flex items-center gap-3 mb-6 sm:mb-10">
          <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
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
          <span className="text-[15px] sm:text-[16px] text-[#c4c7c5] font-medium tracking-wide">
            Đăng nhập bằng Google
          </span>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Bố cục 2 cột chính */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start">
          {/* CỘT TRÁI */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-[40px] font-normal tracking-tight text-white mb-2 leading-tight">
                Chọn tài khoản
              </h1>
              <p className="text-[15px] sm:text-[16px] text-[#c4c7c5]">
                Tiếp tục tới{' '}
                <span className="text-[#a8c7fa] hover:text-[#d3e3fd] hover:underline cursor-pointer font-medium">
                  learnattack.de
                </span>
              </p>
            </div>

            {/* Badge nhận diện Super Admin */}
            <div className="mt-8 p-4 rounded-2xl bg-[#232529] border border-[#37393e] hidden md:block">
              <div className="flex items-center gap-2.5 text-amber-400 text-sm font-medium mb-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Nhận diện Super Admin tự động</span>
              </div>
              <p className="text-xs text-[#9aa0a6] leading-relaxed">
                Tài khoản của bạn được liên kết trực tiếp với quyền Quản trị tối cao. Chọn bất kỳ tài khoản nào để vào hệ thống ngay.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: Danh sách tài khoản người dùng */}
          <div className="md:col-span-7 flex flex-col divide-y divide-[#2d2e31] max-h-[55vh] overflow-y-auto pr-1">
            <div className="flex flex-col">
              {accounts.map((acc) => {
                const isCurrentSuper = isSystemAdminEmail(acc.email);
                const isSelected = selectedEmail === acc.email;

                return (
                  <button
                    key={acc.id || acc.email}
                    onClick={() => handleSelectAccount(acc)}
                    disabled={isSubmitting}
                    className={`group w-full flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-150 text-left cursor-pointer border border-transparent
                      hover:bg-[#282a2d] hover:border-[#383a3f] active:bg-[#333539] ${
                        isSelected ? 'bg-[#282a2d] border-[#4285F4]' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        {acc.avatarType === 'photo' && acc.avatarUrl ? (
                          <img
                            src={acc.avatarUrl}
                            alt={acc.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#444746]"
                          />
                        ) : acc.avatarType === 'emoji' ? (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${acc.avatarBg || 'bg-amber-900 border-amber-700'}`}>
                            {acc.avatarIcon || '🦊'}
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-[17px] font-medium border ${
                              acc.avatarBg || 'bg-purple-900 text-purple-200 border-purple-700'
                            }`}
                          >
                            {acc.avatarText || acc.name.charAt(0)}
                          </div>
                        )}

                        {isCurrentSuper && (
                          <span
                            title="Super Admin"
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[9px] text-black font-bold border border-[#1a1b1e]"
                          >
                            ★
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] sm:text-[16px] text-white font-medium truncate group-hover:text-white">
                            {acc.name}
                          </span>
                          {isCurrentSuper && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] sm:text-[14px] text-[#9aa0a6] truncate font-normal">
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-3">
                      {isSelected && isSubmitting ? (
                        <Loader2 className="w-5 h-5 text-[#a8c7fa] animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[#4285F4] transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Tùy chọn: Sử dụng một tài khoản khác */}
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                disabled={isSubmitting}
                className="group w-full flex items-center gap-3.5 py-3.5 px-3 rounded-xl transition-all duration-150 text-left hover:bg-[#282a2d] active:bg-[#333539] mt-1"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-[#444746] bg-transparent text-[#e3e3e3] group-hover:border-[#747775]">
                  <UserPlus className="w-5 h-5 text-[#c4c7c5]" />
                </div>
                <div className="text-[15px] sm:text-[16px] text-white font-medium">
                  Sử dụng một tài khoản khác
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer điều khoản */}
        <div className="mt-8 pt-6 border-t border-[#2d2e31] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] sm:text-[13px] text-[#8e918f]">
          <p>
            Trước khi sử dụng learnattack.de, bạn có thể xem{' '}
            <a href="#" className="text-[#a8c7fa] hover:underline font-medium">
              Chính sách quyền riêng tư
            </a>{' '}
            và{' '}
            <a href="#" className="text-[#a8c7fa] hover:underline font-medium">
              Điều khoản dịch vụ
            </a>{' '}
            của ứng dụng.
          </p>
        </div>

        {/* Nút tròn cuộn xuống màu xanh */}
        <div className="absolute -bottom-5 right-8">
          <div className="w-11 h-11 rounded-full bg-[#004a77] text-white flex items-center justify-center shadow-lg">
            <ChevronDown className="w-5 h-5 text-[#c2e7ff]" />
          </div>
        </div>
      </div>

      {/* Modal nhập tài khoản khác */}
      {showCustomModal && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowCustomModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#1e1f22] border border-[#383a3f] rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-medium text-white mb-2">Đăng nhập tài khoản khác</h3>
            <p className="text-sm text-[#9aa0a6] mb-5">
              Nhập địa chỉ email Google của bạn để truy cập ngay vào hệ thống.
            </p>

            <form onSubmit={handleAddCustomAccount} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#9aa0a6] font-medium mb-1.5">
                  Địa chỉ Email Google
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="ví dụ: elio.nv260399@gmail.com"
                    className="w-full bg-[#121314] border border-[#383a3f] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#5e6166] text-sm focus:outline-none focus:border-[#4285F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#9aa0a6] font-medium mb-1.5">
                  Tên hiển thị (Tùy chọn)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="ví dụ: Einfach Elio"
                    className="w-full bg-[#121314] border border-[#383a3f] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#5e6166] text-sm focus:outline-none focus:border-[#4285F4]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-sm text-[#c4c7c5] hover:text-white rounded-xl hover:bg-[#282a2d]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-xl shadow transition-colors"
                >
                  Tiếp tục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoogleAccountModal;
