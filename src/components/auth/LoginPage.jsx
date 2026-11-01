import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { LogIn, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('hocvien@sprachmeisterschaft.de');
  const [password, setPassword] = useState('deutschmaster123');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      db.auth.login(email, password);
      navigate('/');
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="surface max-w-md w-full p-6 md:p-8 animate-rise">
        <div className="text-center mb-6">
          <div className="eyebrow mb-1">Cổng đăng nhập</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Sprachmeisterschaft
          </h1>
          <p className="font-heading italic text-xs text-muted-foreground mt-1">
            DeutschMaster — Nền tảng tự học tiếng Đức A1–C2
          </p>
          <div className="rule-double mt-3" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hocvien@sprachmeisterschaft.de"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono font-medium text-foreground">
                Mật khẩu
              </label>
              <Link to="/forgot-password" className="text-xs text-accent hover:underline font-body">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tap w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs font-body text-muted-foreground">
          <span>Chưa có tài khoản học tập? </span>
          <Link to="/register" className="text-accent font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
