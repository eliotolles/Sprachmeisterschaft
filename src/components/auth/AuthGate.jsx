import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

export function AuthGate({ children }) {
  const { currentPath, navigate } = useRouter();
  const [user, setUser] = useState(() => db.auth.getUser());
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(db.auth.getUser());
    };
    window.addEventListener('sprach_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('sprach_auth_change', handleAuthChange);
    };
  }, []);

  // Allow auth pages without gate
  if (
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/forgot-password' ||
    currentPath === '/reset-password'
  ) {
    return children;
  }

  // If not logged in, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  // If newly registered and not verified OTP:
  if (user && !user.is_verified) {
    const handleVerifyOtp = (e) => {
      e.preventDefault();
      if (!otpCode || otpCode.trim().length < 4) {
        setOtpError('Vui lòng nhập mã OTP gồm ít nhất 4 chữ số (ví dụ: 1234)');
        return;
      }
      const success = db.auth.verifyOtp(otpCode);
      if (success) {
        setOtpSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 800);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="surface max-w-md w-full p-6 md:p-8 text-center animate-rise">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="eyebrow mb-1">Bảo mật tài khoản</div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Xác thực OTP
          </h2>
          <p className="font-body text-sm text-muted-foreground mb-6">
            Mã xác thực đã được gửi đến email <strong>{user.email}</strong>. Vui lòng nhập mã để kích hoạt tài khoản.
          </p>

          {otpSuccess ? (
            <div className="p-4 rounded-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Xác thực thành công! Đang chuyển vào ứng dụng...</span>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Mã xác thực OTP (Nhập bất kỳ mã nào, ví dụ 1234):
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value);
                    setOtpError('');
                  }}
                  placeholder="Nhập 4-6 số OTP"
                  className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {otpError && (
                  <p className="text-xs text-rose-600 mt-1 font-body">{otpError}</p>
                )}
              </div>

              <button
                type="submit"
                className="tap w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm"
              >
                Xác thực và Vào học
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return children;
}
