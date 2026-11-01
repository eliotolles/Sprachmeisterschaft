import React, { useState } from 'react';
import { useRouter, Link } from '@/lib/router';
import { Mail, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="surface max-w-md w-full p-6 md:p-8 animate-rise">
        <div className="text-center mb-6">
          <div className="eyebrow mb-1">Khôi phục tài khoản</div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Quên mật khẩu
          </h1>
          <div className="rule-double mt-3" />
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-body text-sm text-foreground">
              Đường dẫn khôi phục mật khẩu đã được gửi đến <strong>{email}</strong>.
            </p>
            <button
              onClick={() => navigate('/reset-password')}
              className="tap w-full py-2 px-4 bg-accent text-accent-foreground text-sm font-medium rounded-sm border border-accent/40"
            >
              Tiến hành đổi mật khẩu mới
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="font-body text-xs text-muted-foreground">
              Nhập email đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu an toàn.
            </p>
            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Email học viên
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@example.com"
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="tap w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Gửi liên kết khôi phục</span>
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
