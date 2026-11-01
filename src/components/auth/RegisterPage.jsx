import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { UserPlus, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { LEVEL_IDS } from '@/data/levels';
import { GoogleButton } from './GoogleButton';

export function RegisterPage() {
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetLevel, setTargetLevel] = useState('B1');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      db.auth.register({ name, email, password });
      db.learnerProfile.update({
        display_name: name || 'Học viên',
        target_level: targetLevel,
      });
      // Direct to main app or OTP gate
      navigate('/');
    }, 400);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      db.auth.loginAsDemo();
      navigate('/');
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden grain">
      {/* Background classical ornament circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/5 pointer-events-none blur-3xl animate-float" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent/5 pointer-events-none blur-3xl animate-float" style={{ animationDelay: '2.5s' }} />

      <div className="surface max-w-lg w-full p-6 sm:p-8 animate-rise relative z-10 border border-border shadow-xl">
        {/* Top return link */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/landing"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang bìa giới thiệu</span>
          </Link>

          <span className="eyebrow">KHỞI ĐẦU HỌC THUẬT</span>
        </div>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full wax-seal text-white font-display text-xl font-bold mb-3 shadow-md animate-float">
            S
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Bắt đầu hành trình
          </h1>
          <p className="font-heading italic text-xs text-muted-foreground mt-1">
            Thiết lập lộ trình chinh phục chứng chỉ tiếng Đức A1–C2
          </p>
          <div className="rule-double mt-3" />
        </div>

        {/* 1. Google Authentication (Fast Registration) */}
        <div className="space-y-3 mb-5">
          <GoogleButton
            label="Đăng ký nhanh bằng Google"
            className="animate-rise delay-100"
          />

          <button
            type="button"
            onClick={handleDemoLogin}
            className="tap w-full py-2.5 px-3 rounded-sm border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors animate-rise delay-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trải nghiệm ngay không cần mật khẩu (Tài khoản Demo)</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative bg-card px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            hoặc đăng ký bằng Email
          </span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Họ và tên học viên
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn Đạt"
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Mục tiêu chứng chỉ
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono transition-all duration-200"
              >
                {LEVEL_IDS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Trình độ {lvl} (Áp dụng toàn app)
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Mật khẩu khởi tạo
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
            />
          </div>

          {/* Value perks checklist */}
          <div className="p-3 bg-muted/40 rounded-sm border border-border text-xs space-y-1.5 font-body">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>Ghi nhớ 950+ từ vựng cốt lõi với thuật toán SRS SM-2</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>7 Xưởng kỹ năng thực chiến & 9 bộ đề thi chuẩn CEFR</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>Gia sư AI ELIO đồng hành giải thích ngữ pháp 24/7</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tap w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Đang tạo hồ sơ...' : 'Đăng ký & Bắt đầu học'}</span>
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 pt-4 border-t border-border text-center text-xs font-body text-muted-foreground">
          <span>Đã có tài khoản học viên? </span>
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
export default RegisterPage;
