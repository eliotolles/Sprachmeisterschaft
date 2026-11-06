import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { elioAuthentication } from '@/lib/elio-auth-runtime';
import { db } from '@/lib/db';
import {progressCoreActive} from '@/lib/elio-progress-runtime';
import {useCoreProgress} from '@/lib/use-core-progress';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  User,
  Settings,
  FileText,
  LogOut,
  Flame,
  Award,
  Calendar,
  ShieldCheck,
  ChevronRight,
  BookMarked,
} from 'lucide-react';

export function MePage() {
  const coreActive=progressCoreActive();
  const { navigate } = useRouter();
  const [profile, setProfile] = useState(() => db.learnerProfile.get());
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [user, setUser] = useState(() => db.auth.getUser());
  const [cards, setCards] = useState(() => coreActive?(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]):db.vocabulary.findMany());
  const [logs, setLogs] = useState(() => coreActive?[]:db.studyLogs.findMany());

  useCoreProgress(db,{cards:setCards,logs:setLogs});

  useEffect(() => {
    const handleDbChange = () => {
      setProfile(db.learnerProfile.get());
      setUser(db.auth.getUser());
      if(progressCoreActive()){setCards(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]);return;}
      setCards(db.vocabulary.findMany());
      setLogs(db.studyLogs.findMany());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    window.addEventListener('sprach_auth_change', handleDbChange);
    return () => {
      window.removeEventListener('sprach_db_change', handleDbChange);
      window.removeEventListener('sprach_auth_change', handleDbChange);
    };
  }, []);

  const totalXp = logs.reduce((sum, l) => sum + (l.xp || 0), 0);

  const handleLogout = async () => {
    try {
      await db.auth.logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const linkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      await db.auth.linkGoogle();
    } catch (error) {
      toast.error(error.message);
      setLinkingGoogle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-rise">
      <PageHeader
        eyebrow="TÀI KHOẢN HỌC VIÊN"
        title="Meine Seiten"
        deTitle="Mein Bereich"
        subtitle="Tổng quan thông tin cá nhân, chứng chỉ mục tiêu và quản trị học tập."
      />

      {/* Account Profile Card */}
      <div className="surface p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-accent/15 border-2 border-accent/30 flex items-center justify-center font-display text-3xl font-bold text-accent shrink-0">
          {(profile.display_name || 'H').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {profile.display_name || user?.name || 'Học viên tiếng Đức'}
            </h2>
            <span className="inline-block px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-semibold self-center sm:self-auto">
              Mục tiêu: {profile.target_level || 'B1'}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {user?.email || 'hocvien@sprachmeisterschaft.de'}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-accent" />
              <span>{totalXp} XP tích luỹ</span>
            </div>
            <div className="flex items-center gap-1">
              <BookMarked className="w-4 h-4 text-accent" />
              <span>{cards.length} từ trong bộ thẻ</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Mục tiêu thẻ/ngày: {profile.daily_goal || 20}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Menu Cards */}
      <div className="surface divide-y divide-border">
        {/* Settings Link */}
        <Link
          to="/me/settings"
          className="tap p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-semibold text-sm text-foreground">
                Cài đặt hồ sơ & Trình độ mục tiêu
              </div>
              <div className="text-xs text-muted-foreground font-body">
                Thay đổi trình độ A1–C2 (áp dụng toàn ứng dụng), ngày thi và mục tiêu ngày.
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
        </Link>

        {/* Notes Link */}
        <Link
          to="/me/notes"
          className="tap p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-semibold text-sm text-foreground">
                Sổ tay Ghi chú & Bản nháp
              </div>
              <div className="text-xs text-muted-foreground font-body">
                Lưu lại quy tắc ngữ pháp, bài mẫu viết thư hoặc từ vựng đáng chú ý.
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
        </Link>

        {user && elioAuthentication()?.isActive() && (
          <button type="button" onClick={linkGoogle} disabled={linkingGoogle}
            className="tap w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 disabled:opacity-60">
            <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
            <span>
              <span className="block font-heading font-semibold text-sm">
                {linkingGoogle ? 'Đang mở Google…' : 'Liên kết tài khoản Google'}
              </span>
              <span className="block text-xs text-muted-foreground">
                Dùng tài khoản Google này để đăng nhập lần sau.
              </span>
            </span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="tap w-full p-4 flex items-center justify-between hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-semibold text-sm text-rose-700 dark:text-rose-400">
                Đăng xuất khỏi tài khoản
              </div>
              <div className="text-xs text-muted-foreground font-body">
                Thoát phiên làm việc hiện tại và quay về màn hình đăng nhập.
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-600 transition-colors" />
        </button>
      </div>
    </div>
  );
}
