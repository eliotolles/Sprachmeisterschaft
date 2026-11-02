import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { LogIn, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import { GoogleButton } from './GoogleButton';

export function LoginPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      try {
        const u = db.auth.login(email, password);
        if (u.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Đăng nhập thất bại.');
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden grain">
      {/* Background classical ornament circles */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/5 pointer-events-none blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 pointer-events-none blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="surface max-w-md w-full p-6 sm:p-8 animate-rise relative z-10 border border-border shadow-xl">
        {/* Top return link */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/landing"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang bìa giới thiệu</span>
          </Link>

          <span className="eyebrow">ẤN BẢN 2026</span>
        </div>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full wax-seal text-white font-display text-xl font-bold mb-3 shadow-md animate-float">
            S
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Sprachmeisterschaft
          </h1>
          <p className="font-heading italic text-xs text-muted-foreground mt-1">
            DeutschMaster — Cổng đăng nhập hệ thống học thuật A1–C2
          </p>
          <div className="rule-double mt-3" />
        </div>

        {/* 1. Google Authentication */}
        <div className="mb-5">
          <GoogleButton
            label="Đăng nhập bằng Google"
            className="animate-rise delay-100"
          />
        </div>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative bg-card px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            hoặc đăng nhập bằng Email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 animate-rise">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-body">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
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
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tap w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Đang xác thực thông tin...' : 'Đăng nhập vào hệ thống'}</span>
          </button>
        </form>

        {/* Trust badge & Switch to Register */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col items-center gap-2 text-xs font-body text-muted-foreground">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Bảo mật dữ liệu học tập cá nhân</span>
          </div>

          <p>
            Chưa có hồ sơ học tập?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Tạo tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
