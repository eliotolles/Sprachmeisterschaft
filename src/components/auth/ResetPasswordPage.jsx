import React, { useState } from 'react';
import { useRouter, Link } from '@/lib/router';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export function ResetPasswordPage() {
  const { navigate } = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleReset = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setDone(true);
    setTimeout(() => {
      navigate('/login');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="surface max-w-md w-full p-6 md:p-8 animate-rise">
        <div className="text-center mb-6">
          <div className="eyebrow mb-1">Thiết lập bảo mật</div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Đặt mật khẩu mới
          </h1>
          <div className="rule-double mt-3" />
        </div>

        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-body text-sm text-foreground">
              Mật khẩu mới đã được cập nhật thành công! Đang chuyển hướng đến đăng nhập...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Nhập lại mật khẩu mới
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {error && <p className="text-xs text-rose-600 mt-1 font-body">{error}</p>}
            </div>

            <button
              type="submit"
              className="tap w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Xác nhận mật khẩu mới</span>
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-border text-center text-xs font-body text-muted-foreground">
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
