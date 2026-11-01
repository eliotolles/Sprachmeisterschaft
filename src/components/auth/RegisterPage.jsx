import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { UserPlus } from 'lucide-react';
import { LEVEL_IDS } from '@/data/levels';

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
      db.learnerProfile.update({ display_name: name || 'Học viên', target_level: targetLevel });
      navigate('/');
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="surface max-w-md w-full p-6 md:p-8 animate-rise">
        <div className="text-center mb-6">
          <div className="eyebrow mb-1">Đăng ký thành viên</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Bắt đầu hành trình
          </h1>
          <p className="font-heading italic text-xs text-muted-foreground mt-1">
            Chinh phục tiếng Đức A1–C2 bài bản và khoa học
          </p>
          <div className="rule-double mt-3" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Họ và tên hiển thị
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn Đạt"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
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
              placeholder="ban@example.com"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Mục tiêu chứng chỉ muốn đạt
            </label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
            >
              {LEVEL_IDS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  Trình độ {lvl} (Áp dụng toàn bộ ứng dụng)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tap w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2 mt-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký & Nhận mã OTP'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs font-body text-muted-foreground">
          <span>Đã có tài khoản? </span>
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
