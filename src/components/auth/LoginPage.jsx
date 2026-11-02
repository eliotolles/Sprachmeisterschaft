import React, { useState, useEffect } from 'react';
import { db, isSystemAdminEmail, SYSTEM_ADMIN_EMAILS } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  UserPlus, 
  ChevronDown, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Mail,
  User,
  KeyRound
} from 'lucide-react';

// Danh sách các tài khoản Google mẫu chuẩn xác theo ảnh của bạn
export const GOOGLE_PRESET_ACCOUNTS = [
  {
    id: 'acc_1',
    name: 'グエンダット',
    email: 'dat.uneti.1999@gmail.com',
    avatarType: 'text',
    avatarText: 'ダ',
    avatarBg: 'bg-purple-900 text-purple-200 border-purple-700',
    isSuperAdmin: true,
  },
  {
    id: 'acc_2',
    name: 'Viết Nguyễn Đạt',
    email: 'dat.uneti.99@gmail.com',
    avatarType: 'photo',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    fallbackInitial: 'V',
    isSuperAdmin: true,
  },
  {
    id: 'acc_3',
    name: 'Douyin Tiktok',
    email: 'dat.sunlife99@gmail.com',
    avatarType: 'emoji',
    avatarIcon: '🦊',
    avatarBg: 'bg-amber-950/80 border-amber-600/50',
    isSuperAdmin: true,
  },
  {
    id: 'acc_4',
    name: 'Đạt Nguyễn',
    email: 'dat.nguyenviet.1999@gmail.com',
    avatarType: 'text',
    avatarText: 'Đ',
    avatarBg: 'bg-neutral-800 text-neutral-200 border-neutral-600',
    isSuperAdmin: true,
  },
  {
    id: 'acc_5',
    name: 'Đạt Nguyễn',
    email: 'dat.nguyenviet.99@gmail.com',
    avatarType: 'text',
    avatarText: 'Đ',
    avatarBg: 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-700',
    isSuperAdmin: true,
  },
  {
    id: 'acc_6',
    name: 'Đạt Nguyễn',
    email: 'dat.nv260399@gmail.com',
    avatarType: 'photo',
    avatarUrl: 'https://images.unsplash.com/photo-1550853024-fae8cd4be47f?w=100&h=100&fit=crop&crop=faces',
    fallbackInitial: 'Đ',
    isSuperAdmin: true,
  },
  {
    id: 'acc_7',
    name: 'Einfach Elio',
    email: 'elio.nv260399@gmail.com',
    avatarType: 'text',
    avatarText: 'e',
    avatarBg: 'bg-emerald-950 text-emerald-300 border-emerald-600',
    isSuperAdmin: true,
  },
];

export function LoginPage() {
  const { navigate } = useRouter();
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(()=>{
    const code=new URLSearchParams(window.location.hash.split('?')[1]||'').get('coreAuthError');
    const messages={GOOGLE_NOT_LINKED:'Google chưa được liên kết. Hãy đăng nhập bằng mật khẩu trước.',GOOGLE_ALREADY_LINKED:'Google đã được liên kết với tài khoản khác.',GOOGLE_STATE:'Phiên Google đã hết hạn hoặc không khớp. Hãy thử lại.',ACCOUNT_BLOCKED:'Tài khoản không được phép đăng nhập.',GOOGLE_NOT_CONFIGURED:'Chưa cấu hình Google OAuth phía server.',GOOGLE_IDENTITY:'Chưa xác minh được danh tính Google. Hãy thử lại.'};
    if(messages[code])setError(messages[code]);
  },[]);


  // Ghi nhớ phiên đăng nhập: Kiểm tra xem người dùng đã đăng nhập chưa
  const [currentUser, setCurrentUser] = useState(() => db.auth.getUser());
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  useEffect(() => {
    // Nếu người dùng đã đăng nhập trước đó và không phải đang bấm "Đăng xuất / Đổi tài khoản"
    if (currentUser && !isSwitchingAccount) {
      const isAdmin = currentUser.role === 'admin' || isSystemAdminEmail(currentUser.email);
      const timer = setTimeout(() => {
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentUser, isSwitchingAccount, navigate]);
  
  // Chế độ nhập tài khoản khác
  const [showCustomAccountModal, setShowCustomAccountModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // Chế độ dự phòng đăng nhập email/mật khẩu truyền thống
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const [legacyPassword, setLegacyPassword] = useState('');

  // Lưu lịch sử tài khoản đã thêm
  const [accounts, setAccounts] = useState(GOOGLE_PRESET_ACCOUNTS);

  useEffect(() => {
    // Tải thêm các tài khoản đã từng đăng nhập bổ sung từ LocalStorage nếu có
    try {
      const saved = localStorage.getItem('sprach_custom_google_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Gộp các tài khoản mới vào cuối danh sách trước mục "Sử dụng một tài khoản khác"
          setAccounts([...GOOGLE_PRESET_ACCOUNTS, ...parsed]);
        }
      }
    } catch (e) {
      console.error('Lỗi đọc tài khoản đã lưu:', e);
    }
  }, []);

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
          navigate('/admin');
        } else {
          toast.success(`Đăng nhập Google thành công!`, {
            description: `Chào mừng ${account.name} đã quay trở lại.`,
          });
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
        setIsSubmitting(false);
        setSelectedEmail(null);
      }
    }, 450);
  };

  // Thêm tài khoản Google khác
  const handleAddCustomAccount = (e) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: yourname@gmail.com)');
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

    // Lưu vào LocalStorage
    try {
      const saved = JSON.parse(localStorage.getItem('sprach_custom_google_accounts') || '[]');
      const filtered = saved.filter(a => a.email !== cleanEmail);
      filtered.push(newAcc);
      localStorage.setItem('sprach_custom_google_accounts', JSON.stringify(filtered));
    } catch (e) {}

    setShowCustomAccountModal(false);
    handleSelectAccount(newAcc);
  };

  // Đăng nhập mật khẩu truyền thống
  const handleLegacyLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(async () => {
      try {
        const cleanEmail = customEmail.trim().toLowerCase();
        const u = await db.auth.login(cleanEmail, legacyPassword);
        if (u.role === 'admin' || isSystemAdminEmail(cleanEmail)) {
          toast.success(`👑 Đăng nhập thành công với quyền Super Admin!`);
          navigate('/admin');
        } else {
          toast.success(`Đăng nhập thành công!`);
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Email hoặc mật khẩu không chính xác.');
        setIsSubmitting(false);
      }
    }, 350);
  };

  // Nếu người dùng đã đăng nhập và không phải bấm đổi tài khoản:
  if (currentUser && !isSwitchingAccount) {
    const isAdmin = currentUser.role === 'admin' || isSystemAdminEmail(currentUser.email);
    return (
      <div className="min-h-screen bg-[#121314] text-[#e3e3e3] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#4285F4]/30 selection:text-white">
        <div className="w-full max-w-[480px] bg-[#1a1b1e] border border-[#2d2e31] rounded-[28px] p-8 sm:p-10 text-center shadow-2xl relative animate-rise">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="text-sm text-[#c4c7c5] font-medium">Sprachmeisterschaft</span>
          </div>

          <div className="relative w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden border border-[#444746] bg-[#282a2d] flex items-center justify-center text-xl font-bold text-white shadow-lg">
            {currentUser.picture ? (
              <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <span>{currentUser.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
            {isAdmin && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-black font-bold border-2 border-[#1a1b1e]">
                ★
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-medium mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Đang ghi nhớ phiên đăng nhập</span>
          </div>

          <h2 className="text-xl font-medium text-white mb-0.5">
            {currentUser.name}
          </h2>
          <p className="text-sm text-[#9aa0a6] mb-6">
            {currentUser.email}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/')}
              className="w-full py-3 px-4 rounded-xl bg-[#4285F4] hover:bg-[#3367d6] text-white font-medium text-sm transition-colors shadow flex items-center justify-center gap-2"
            >
              <span>Vào {isAdmin ? 'Trung tâm Quản trị' : 'Giao diện Học tập'} ngay</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={async () => {
                try {await db.auth.logout();setCurrentUser(null);setIsSwitchingAccount(true);}
                catch(error){setError(error.message || 'Chưa đăng xuất được.');}
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-[#383a3f] text-[#c4c7c5] hover:text-white hover:bg-[#282a2d] text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Đăng xuất & Đổi tài khoản khác</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121314] text-[#e3e3e3] flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 font-sans antialiased selection:bg-[#4285F4]/30 selection:text-white">
      {/* Thanh tiến trình khi đang đăng nhập (Google Bar) */}
      {isSubmitting && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-transparent overflow-hidden z-50">
          <div className="h-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] animate-pulse w-full"></div>
        </div>
      )}

      {/* Container chính: Bo góc, viền mờ cao cấp chuẩn Google Account Picker Dark Mode */}
      <div className="w-full max-w-[1020px] bg-[#1a1b1e] border border-[#2d2e31] rounded-[28px] p-6 sm:p-10 md:p-14 shadow-2xl relative my-auto transition-all duration-300">
        
        {/* Header trên cùng: Logo Google + Chữ "Đăng nhập bằng Google" */}
        <div className="flex items-center gap-3 mb-8 sm:mb-12">
          {/* Logo Google đa sắc chính hãng */}
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

        {/* Bố cục 2 cột chính: Cột trái Tiêu đề, Cột phải Danh sách tài khoản */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-start">
          
          {/* CỘT TRÁI: "Chọn tài khoản" + "Tiếp tục tới learnattack.de" */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-[42px] font-normal tracking-tight text-white mb-3">
                Chọn tài khoản
              </h1>
              <p className="text-[15px] sm:text-[16px] text-[#c4c7c5]">
                Tiếp tục tới{' '}
                <span className="text-[#a8c7fa] hover:text-[#d3e3fd] hover:underline cursor-pointer font-medium">
                  learnattack.de
                </span>
              </p>
            </div>

            {/* Badge hướng dẫn & kiểm tra Super Admin */}
            <div className="mt-8 p-4 rounded-2xl bg-[#232529] border border-[#37393e] hidden md:block">
              <div className="flex items-center gap-2.5 text-amber-400 text-sm font-medium mb-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Nhận diện Super Admin tự động</span>
              </div>
              <p className="text-xs text-[#9aa0a6] leading-relaxed">
                Các tài khoản của bạn (<strong className="text-white">dat.nguyenviet.1999</strong>, <strong className="text-white">elio.nv260399</strong>,...) được liên kết trực tiếp với quyền Quản trị tối cao. Chọn bất kỳ tài khoản nào để vào hệ thống ngay.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: Danh sách tài khoản người dùng */}
          <div className="md:col-span-7 flex flex-col divide-y divide-[#2d2e31]">
            <div className="flex flex-col">
              {accounts.map((acc) => {
                const isCurrentSuper = isSystemAdminEmail(acc.email);
                const isSelected = selectedEmail === acc.email;

                return (
                  <button
                    key={acc.id || acc.email}
                    onClick={() => handleSelectAccount(acc)}
                    disabled={isSubmitting}
                    className={`group w-full flex items-center justify-between py-3.5 px-3 rounded-xl transition-all duration-150 text-left cursor-pointer border border-transparent
                      hover:bg-[#282a2d] hover:border-[#383a3f] active:bg-[#333539] ${
                        isSelected ? 'bg-[#282a2d] border-[#4285F4]' : ''
                      }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar chuẩn xác theo từng loại hình ảnh */}
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

                        {/* Huy hiệu Super Admin nhỏ góc avatar */}
                        {isCurrentSuper && (
                          <span
                            title="Super Admin"
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[9px] text-black font-bold border border-[#1a1b1e]"
                          >
                            ★
                          </span>
                        )}
                      </div>

                      {/* Tên và Email */}
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

                    {/* Loading spinner hoặc icon mũi tên */}
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

              {/* Tùy chọn 8: "Sử dụng một tài khoản khác" */}
              <button
                type="button"
                onClick={() => setShowCustomAccountModal(true)}
                disabled={isSubmitting}
                className="group w-full flex items-center gap-4 py-4 px-3 rounded-xl transition-all duration-150 text-left hover:bg-[#282a2d] active:bg-[#333539] mt-1"
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

        {/* Nút tròn cuộn xuống màu xanh đặc trưng của Google Auth ở góc phải */}
        <div className="absolute -bottom-6 right-8 sm:right-12">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            aria-label="Cuộn xuống"
            className="w-12 h-12 rounded-full bg-[#004a77] hover:bg-[#005f99] active:bg-[#003b60] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          >
            <ChevronDown className="w-6 h-6 text-[#c2e7ff]" />
          </button>
        </div>
      </div>

      {/* FOOTER: Chính sách quyền riêng tư & Điều khoản dịch vụ theo nguyên mẫu */}
      <div className="w-full max-w-[1020px] mt-8 text-center sm:text-left text-[12px] sm:text-[13px] text-[#8e918f] leading-relaxed flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
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

        {/* Nút mở đăng nhập bằng mật khẩu khi cần */}
        <button
          onClick={() => setShowLegacyForm(!showLegacyForm)}
          className="text-xs text-[#9aa0a6] hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{showLegacyForm ? 'Ẩn form mật khẩu' : 'Đăng nhập mật khẩu truyền thống'}</span>
        </button>
      </div>

      {/* MODAL 1: Nhập email tài khoản khác */}
      {showCustomAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1e1f22] border border-[#383a3f] rounded-2xl p-6 shadow-2xl relative">
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

              {isSystemAdminEmail(customEmail.trim().toLowerCase()) && (
                <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Email này được cấp quyền Super Admin hệ thống.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomAccountModal(false)}
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

      {/* FORM DỰ PHÒNG: Đăng nhập mật khẩu truyền thống */}
      {showLegacyForm && (
        <div className="w-full max-w-[1020px] mt-6 p-6 bg-[#1a1b1e] border border-[#2d2e31] rounded-2xl">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Phương thức phụ: Đăng nhập bằng Mật khẩu</span>
          </h4>
          <form onSubmit={handleLegacyLogin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="email"
              placeholder="Email đăng nhập"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="bg-[#121314] border border-[#383a3f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Mật khẩu (ví dụ: admin123)"
              value={legacyPassword}
              onChange={(e) => setLegacyPassword(e.target.value)}
              className="bg-[#121314] border border-[#383a3f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              Đăng nhập bằng Mật khẩu
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
