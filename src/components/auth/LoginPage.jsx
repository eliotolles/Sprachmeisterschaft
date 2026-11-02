import React, { useState } from 'react';
import { db, isSystemAdminEmail } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import {
  LogIn,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
} from 'lucide-react';
import { GoogleButton } from './GoogleButton';

export function LoginPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const isAdminEmail = cleanEmail ? isSystemAdminEmail(cleanEmail) : false;

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      try {
        const u = db.auth.login(cleanEmail, password);
        if (u.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden grain">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-accent/5 pointer-events-none blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-accent/5 pointer-events-none blur-3xl" />

      <div className="surface max-w-md w-full p-6 sm:p-8 animate-rise relative z-10 border border-border shadow-2xl rounded-sm">
        {/* Top return link & Edition tag */}
        <div className="flex items-center justify-between mb-5">
          <Link
            to="/landing"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang giới thiệu</span>
          </Link>

          <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
            ẤN BẢN 2026
          </span>
        </div>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground font-display text-xl font-bold mb-2.5 shadow-md">
            S
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Sprachmeisterschaft
          </h1>
          <p className="font-heading text-xs text-muted-foreground mt-1">
            DeutschMaster — Cổng đăng nhập học thuật tiếng Đức A1–C2
          </p>
          <div className="rule-double mt-3" />
        </div>

        {/* 1. Google Authentication */}
        <div className="mb-5">
          <GoogleButton
            label="Tiếp tục với Google"
            prefillEmail={cleanEmail}
            className="w-full"
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
            <div className="p-3 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-body">{error}</span>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="name@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
              />
            </div>

            {/* Smart dynamic role badge */}
            {isAdminEmail && (
              <div className="mt-1.5 p-2 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-mono flex items-center gap-1.5 animate-fadeIn">
                <span>👑</span>
                <span className="font-semibold">Nhận diện Email Quản trị viên (Super Admin)</span>
              </div>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono font-medium text-foreground">
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-accent hover:underline font-body transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={isAdminEmail ? 'admin123 (hoặc mật khẩu của bạn)' : '••••••••'}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`tap w-full py-2.5 px-4 font-mono text-xs font-bold rounded-sm border shadow-sm flex items-center justify-center gap-2 transition-all duration-200 ${
              isAdminEmail
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                : 'bg-accent hover:bg-accent/90 text-accent-foreground border-accent/40'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>
              {loading
                ? 'Đang kiểm tra tài khoản...'
                : isAdminEmail
                ? 'Đăng nhập Quản trị viên (Super Admin)'
                : 'Đăng nhập vào hệ thống'}
            </span>
          </button>
        </form>

        {/* Footer: Trust badge & Switch to Register */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col items-center gap-2 text-xs font-body text-muted-foreground">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Bảo mật dữ liệu học tập cá nhân</span>
          </div>

          <p>
            Chưa có hồ sơ học tập?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
