import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { db } from '@/lib/db';
import { progressCoreActive } from '@/lib/elio-progress-runtime';
import { progressStreak } from '@/core/elio/progress-binding';
import { useCoreProgress } from '@/lib/use-core-progress';
import { useRouter, Link } from '@/lib/router';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { computeReadiness, calculateStreak, formatDate } from '@/lib/algorithms';
import { WORDS, STARTER_TOPICS } from '@/data/vocabulary';
import { DAYS } from '@/data/telc-b2/data-plan';
import { PLAN_START } from '@/data/telc-b2/data-content';
import { GRAMMAR_TOPICS_FULL, grammarTopicForDay } from '@/data/telc-b2/data-grammar';
import { loadTelcB2Progress } from '@/lib/telc-b2-progress';
import {
  RotateCw,
  Flame,
  Calendar,
  CheckCircle2,
  Sparkles,
  Bot,
  ArrowRight,
  BookMarked,
  BookOpen,
  Headphones,
  Play,
  Home,
  Library,
  GraduationCap,
  TrendingUp,
  Wrench,
  Settings,
  Gamepad2,
  BarChart3,
  Clock,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

// Ngày bắt đầu lộ trình telc B2 (16/11/2026) — tính "ngày hôm nay" của lộ trình 60 ngày.
const PLAN_START_DATE = (() => {
  const [y, m, d] = PLAN_START.split('-').map(Number);
  return new Date(y, m - 1, d);
})();

function currentB2Day() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today - PLAN_START_DATE) / 86400000) + 1;
  return Math.min(60, Math.max(1, diff));
}

export function HomePage() {
  const coreActive = progressCoreActive();
  const { navigate, currentPath } = useRouter();
  const [profile, setProfile] = useState(() => db.learnerProfile.get());
  const [cards, setCards] = useState(() => coreActive ? (db.vocabulary.isCore?.() ? db.vocabulary.findMany() : []) : db.vocabulary.findMany());
  // Số liệu thẻ tải bất đồng bộ ở chế độ core: chưa tải xong thì không hiển thị
  // số 0 (sai) — giữ trạng thái "đang tải" tới khi có số thật.
  const [cardsLoaded, setCardsLoaded] = useState(() => !coreActive || cards.length > 0);
  const handleCardsLoaded = useCallback((value) => {
    setCards(value);
    setCardsLoaded(true);
  }, []);
  const [logs, setLogs] = useState(() => coreActive ? [] : db.studyLogs.findMany());
  const [sessions, setSessions] = useState(() => coreActive ? [] : db.skillSessions.findMany());
  const [exams, setExams] = useState(() => coreActive ? [] : db.examResults.findMany());
  const [studyPlan, setStudyPlan] = useState(() => db.studyPlan?.get());
  const [collections, setCollections] = useState(() => {
    try { return db.listening.getCollections(); } catch { return []; }
  });
  const [b2Progress, setB2Progress] = useState(() => {
    try { return loadTelcB2Progress(db.auth.getUser()?.id || null); } catch { return loadTelcB2Progress(null); }
  });

  useCoreProgress(db, { cards: handleCardsLoaded, logs: setLogs, sessions: setSessions, exams: setExams });

  // Dashboard tối: bật dark mode khi ở trang chính, trả lại đúng cài đặt của người dùng khi rời trang.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.add('dark');
    return () => {
      if (!wasDark && localStorage.getItem('sprach_theme') !== 'dark') root.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    const handleDbChange = () => {
      setProfile(db.learnerProfile.get());
      if (progressCoreActive()) { setCards(db.vocabulary.isCore?.() ? db.vocabulary.findMany() : []); return; }
      setCards(db.vocabulary.findMany());
      setLogs(db.studyLogs.findMany());
      setSessions(db.skillSessions.findMany());
      setExams(db.examResults.findMany());
      setStudyPlan(db.studyPlan?.get());
      try { setCollections(db.listening.getCollections()); } catch { /* giữ nguyên danh sách cũ */ }
      try { setB2Progress(loadTelcB2Progress(db.auth.getUser()?.id || null)); } catch { /* giữ nguyên tiến độ cũ */ }
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    window.addEventListener('sprach_auth_change', handleDbChange);
    return () => {
      window.removeEventListener('sprach_db_change', handleDbChange);
      window.removeEventListener('sprach_auth_change', handleDbChange);
    };
  }, []);

  // Time-based German greeting
  const hour = new Date().getHours();
  let greeting = 'Guten Tag';
  let greetingVi = 'Chào buổi trưa';
  if (hour < 11) {
    greeting = 'Guten Morgen';
    greetingVi = 'Chào buổi sáng';
  } else if (hour >= 18) {
    greeting = 'Guten Abend';
    greetingVi = 'Chào buổi tối';
  }

  // Due cards today
  const today = formatDate();
  const dueCards = cards.filter((c) => !c.due_date || c.due_date <= today);

  // Streak
  const streak = coreActive ? progressStreak(logs, today) : calculateStreak(logs);

  // Exam Countdown (D-xx)
  const examDate = profile.exam_date ? new Date(profile.exam_date) : new Date(Date.now() + 45 * 86400000);
  const diffDays = Math.max(0, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)));

  // Readiness
  const readiness = computeReadiness(cards, sessions, exams, profile.target_level || 'B1');

  // Lộ trình telc B2 hôm nay (dữ liệu thật từ data-plan / tiến độ đã lưu)
  const b2Day = currentB2Day();
  const todayPlan = DAYS[Math.min(b2Day, DAYS.length) - 1] || DAYS[0];
  const grammarToday = grammarTopicForDay(b2Day) || GRAMMAR_TOPICS_FULL[GRAMMAR_TOPICS_FULL.length - 1];
  const completedDaysCount = (b2Progress.completedDays || []).length;
  const latestScore = (b2Progress.scores || []).length > 0 ? b2Progress.scores[b2Progress.scores.length - 1] : null;
  const latestDiagnostic = (b2Progress.diagnostics || []).length > 0 ? b2Progress.diagnostics[b2Progress.diagnostics.length - 1] : null;

  // Bài nghe mới nhất (dữ liệu thật từ thư viện nghe)
  const allEpisodes = useMemo(() => {
    try {
      return collections.flatMap((collection) =>
        db.listening.getEpisodes(collection.id).map((episode) => ({ ...episode, collection }))
      );
    } catch { return []; }
  }, [collections]);
  const latestEpisode = useMemo(() => {
    if (!allEpisodes.length) return null;
    const sorted = [...allEpisodes].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return sorted[0];
  }, [allEpisodes]);
  // Hai bài nghe kế tiếp trong thư viện (hàng "Tiếp theo / Sau đó" của thẻ nghe)
  const nextEpisodes = useMemo(() => {
    if (!allEpisodes.length) return [];
    const sorted = [...allEpisodes].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return sorted.slice(1, 3);
  }, [allEpisodes]);

  const dueWords = dueCards.slice(0, 3);

  // Dock module — bấm là nhảy tới nội dung thật của module đó.
  const hoerenPath = latestEpisode
    ? `/skills/listening/${latestEpisode.collectionId}/${latestEpisode.id}`
    : '/skills/listening';
  const dockItems = [
    { id: 'start', label: 'Start', icon: Home, path: '/', tile: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    { id: 'bibliothek', label: 'Bibliothek', icon: Library, path: '/skills/listening', tile: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    { id: 'hoeren', label: 'Hören', icon: Headphones, path: hoerenPath, tile: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    { id: 'wortschatz', label: 'Wortschatz', icon: BookMarked, path: '/vocabulary', tile: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    { id: 'grammatik', label: 'Grammatik', icon: BookOpen, path: '/b2', tile: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
    { id: 'b2', label: 'Lộ trình B2', icon: GraduationCap, path: '/b2', tile: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
    { id: 'statistik', label: 'Statistik', icon: TrendingUp, path: '/progress', tile: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
    { id: 'tools', label: 'Công cụ', icon: Wrench, path: '/skills/listening/personal', tile: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
    { id: 'settings', label: 'Einstellungen', icon: Settings, path: '/me/settings', tile: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
  ];
  const isDockActive = (item) => {
    if (item.id === 'start') return currentPath === '/' || currentPath === '';
    if (item.id === 'bibliothek') return currentPath === '/skills/listening';
    if (item.id === 'hoeren') return currentPath.startsWith('/skills/listening/') && currentPath.split('/').length > 3;
    return currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
  };

  // Starter Deck loader if empty
  const handleLoadStarterDeck = () => {
    const starterWords = WORDS.filter((w) => STARTER_TOPICS.includes(w.topic)).slice(0, 30);
    const added = db.vocabulary.createMany(starterWords);
    db.studyLogs.recordActivity({ newWords: added.length });
    toast.success(`Đã nạp thành công ${added.length} từ vựng mẫu vào bộ thẻ của bạn!`);
  };

  const heroStats = [
    { label: 'Chuỗi học', value: cardsLoaded ? `${streak} ngày` : '…', icon: Flame },
    { label: 'Thẻ đến hạn', value: cardsLoaded ? `${dueCards.length} thẻ` : '…', icon: RotateCw },
    { label: 'Lộ trình B2', value: `Tag ${b2Day}/60`, icon: Calendar },
    { label: 'Sẵn sàng thi', value: cardsLoaded ? `${readiness.total}%` : '…', icon: Target },
  ];

  return (
    <div className="space-y-5 md:space-y-6 animate-rise">
      {/* Hero: chào + Capi 3D + số liệu tổng quan — bố cục 1:1 bản demo */}
      <section className="dash-glass relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(620px circle at 85% 0%, rgba(217, 84, 50, 0.30), transparent 65%)' }}
        />
        <div className="relative flex flex-col lg:flex-row">
          <div className="flex-1 min-w-0 p-5 md:p-7">
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-accent/40 bg-accent/10 text-accent">
                Lộ trình telc B2 · Tag {b2Day}/60
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-border/70 bg-white/[0.05] text-foreground/85">
                Chủ điểm hôm nay: {todayPlan.focus}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-border/70 bg-white/[0.05] text-foreground/85">
                {grammarToday.name.split('—')[0].trim()} đang học
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-[2.6rem] leading-tight font-bold text-foreground mt-4">
              {greeting}, {profile.display_name || 'Học viên'}.
              <span className="block italic text-accent">Weiter geht's!</span>
            </h1>
            <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed max-w-xl">
              Hôm nay anh học tiếp ngày {b2Day} của lộ trình 60 ngày: nghe bài {latestEpisode ? (latestEpisode.deTitle || latestEpisode.title) : 'mới nhất trong thư viện'}, ôn {cardsLoaded ? `${dueCards.length} thẻ đến hạn` : 'thẻ đến hạn'} và chạm vào {grammarToday.name.split('—')[0].trim()}.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => navigate(latestEpisode ? `/skills/listening/${latestEpisode.collectionId}/${latestEpisode.id}` : '/skills/listening')}
                className="tap px-4 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-lg shadow-sm inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Nghe tiếp bài đang học</span>
              </button>
              <Link
                to="/review"
                className="tap px-4 py-2.5 border border-border bg-white/[0.05] hover:bg-white/10 text-foreground text-sm font-medium rounded-lg inline-flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4 text-accent" />
                <span>Ôn từ vựng hôm nay</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
              {heroStats.map((s) => (
                <div key={s.label} className="rounded-lg border border-border/60 bg-white/[0.04] px-3 py-2.5">
                  <div className="font-display text-lg md:text-xl font-bold text-foreground">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative shrink-0 lg:w-[340px] xl:w-[380px]">
            <img
              src="/mascot/capi-hero.svg"
              alt="Capi — linh vật capybara của Sprachmeisterschaft"
              className="dash-float h-72 w-full lg:h-full object-cover object-[center_18%]"
              loading="eager"
              decoding="async"
            />
            <div className="dash-bubble absolute bottom-3 left-3 right-3 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 px-3.5 py-2.5">
              <div className="text-[13px] font-semibold text-white">Capi sagt: „Langsam, aber jeden Tag."</div>
              <div className="text-xs text-white/75 mt-0.5">Chậm cũng được, miễn là ngày nào cũng học. Capi chờ anh ở thẻ từ vựng bên dưới đó.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hàng 2: bài nghe tiếp theo + panel Start — bố cục 1:1 bản demo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bài nghe tiếp theo */}
        <section className="dash-glass p-5 md:p-6 lg:col-span-2">
            <div className="eyebrow">Tiếp tục học · Hören</div>
            {latestEpisode ? (
              <>
                <div className="flex items-start justify-between gap-4 mt-1">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl md:text-2xl font-bold text-foreground truncate">
                      {latestEpisode.deTitle || latestEpisode.title}
                    </h2>
                    <p className="font-body text-xs text-muted-foreground mt-1 truncate">
                      {latestEpisode.collection?.title || 'Luyện nghe'}
                      {latestEpisode.level ? ` · ${latestEpisode.level}` : ''}
                      {latestEpisode.subtitles?.length ? ` · ${latestEpisode.subtitles.length} câu phụ đề · Bấm vào từng từ để tra` : ''}
                      {latestEpisode.quiz?.length ? ` · ${latestEpisode.quiz.length} câu quiz` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/skills/listening/${latestEpisode.collectionId}/${latestEpisode.id}`)}
                    className="tap w-14 h-14 shrink-0 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center shadow-lg"
                    title="Mở trình nghe"
                  >
                    <Play className="w-6 h-6 ml-0.5" />
                  </button>
                </div>
                <div className="mt-5">
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: '0%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-1.5">
                    <span>0:00</span>
                    <span>{latestEpisode.duration || '03:00'}</span>
                  </div>
                </div>
                {nextEpisodes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                    {nextEpisodes.map((ep, idx) => (
                      <button
                        key={ep.id || idx}
                        type="button"
                        onClick={() => navigate(`/skills/listening/${ep.collectionId}/${ep.id}`)}
                        className="tap text-left rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2.5"
                      >
                        <div className="text-[11px] font-mono text-muted-foreground">{idx === 0 ? 'Tiếp theo' : 'Sau đó'}</div>
                        <div className="font-heading font-semibold text-sm text-foreground truncate mt-0.5">
                          {ep.deTitle || ep.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{ep.duration || '03:00'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">
                Chưa có bài nghe nào trong thư viện.
                <Link to="/skills/listening" className="text-accent hover:underline ml-1">
                  Nhập video YouTube hoặc video máy tính để bắt đầu →
                </Link>
              </div>
            )}
          </section>

        {/* Panel Start: tổng quan ngày học hôm nay — 1:1 bản demo */}
        <section className="dash-glass p-5 md:p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-foreground leading-tight">Start</h2>
              <p className="text-[11px] text-muted-foreground">Trang chủ · Tổng quan ngày học hôm nay của anh.</p>
            </div>
          </div>
          <div className="space-y-2.5 mt-4 flex-1">
            <Link
              to="/b2"
              className="tap flex items-start gap-3 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span className="min-w-0">
                <span className="block font-heading font-semibold text-sm text-foreground">Lộ trình telc B2</span>
                <span className="block text-[11px] text-muted-foreground">Tag {b2Day}/60 · đang học</span>
              </span>
            </Link>
            <Link
              to="/review"
              className="tap flex items-start gap-3 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span className="min-w-0">
                <span className="block font-heading font-semibold text-sm text-foreground">Từ vựng hôm nay</span>
                <span className="block text-[11px] text-muted-foreground">
                  {cardsLoaded ? `${dueCards.length} thẻ đến hạn` : 'Đang tải…'}
                </span>
              </span>
            </Link>
            <Link
              to={latestEpisode ? `/skills/listening/${latestEpisode.collectionId}/${latestEpisode.id}` : '/skills/listening'}
              className="tap flex items-start gap-3 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span className="min-w-0">
                <span className="block font-heading font-semibold text-sm text-foreground">Bài nghe đang mở</span>
                <span className="block text-[11px] text-muted-foreground truncate">
                  {latestEpisode ? (latestEpisode.deTitle || latestEpisode.title) : 'Chưa có bài nghe'}
                </span>
              </span>
            </Link>
          </div>
          <Link
            to="/b2"
            className="tap mt-4 px-4 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2"
          >
            <span>Tiếp tục học Tag {b2Day}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>

      {/* Hàng 3: kế hoạch B2 hôm nay + sẵn sàng thi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {/* Kế hoạch B2 hôm nay */}
          <section className="dash-glass p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Heute · Tag {b2Day}</div>
                <h2 className="font-display text-xl font-bold text-foreground mt-0.5">Kế hoạch học hôm nay</h2>
                <div className="text-xs text-muted-foreground mt-0.5">{todayPlan.focus} · Lộ trình telc B2 {b2Day}/60</div>
              </div>
              <Link to="/b2" className="tap text-xs font-mono text-accent hover:underline inline-flex items-center gap-1 shrink-0">
                <span>Mở lộ trình</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mt-2 line-clamp-3">
              {todayPlan.task}
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
                <span>Đã hoàn thành {completedDaysCount}/60 ngày</span>
                <span>{Math.round((completedDaysCount / 60) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.round((completedDaysCount / 60) * 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mt-3">
                {[14, 30, 60].map((m) => (
                  <span
                    key={m}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                      b2Day >= m
                        ? 'bg-accent/15 border-accent/40 text-accent'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {b2Day >= m ? '✓ ' : ''}Tag {m}
                  </span>
                ))}
                <span className="text-[11px] font-mono text-muted-foreground ml-auto">
                  Ngữ pháp tuần này: {grammarToday.name.split('—')[0].trim()}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Chỉ số sẵn sàng thi */}
        <section className="dash-glass p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="eyebrow">Chỉ số sẵn sàng thi</div>
            <h2 className="font-display text-2xl font-bold text-foreground mt-0.5">Prüfungsreife</h2>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Đo lường tổng hợp từ 3 trụ cột: Vốn từ ({readiness.vocab.score}%), Kỹ năng ({readiness.skills.score}%), Đề thi ({readiness.exams.score}%).
            </p>
          </div>
          <div className="flex flex-col items-center justify-center my-4">
            <ProgressRing progress={readiness.total} size={130} strokeWidth={10} label="Sẵn sàng" />
          </div>
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="font-mono text-muted-foreground">Mục tiêu: {profile.target_level || 'B1'}</span>
            <Link to="/readiness" className="font-mono text-accent hover:underline inline-flex items-center gap-1">
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </div>

      {/* Nhiệm vụ trọng tâm hôm nay (giữ nguyên logic lộ trình cá nhân) */}
      <section className="dash-glass p-5 md:p-6">
        {studyPlan && Array.isArray(studyPlan.dailyTasks) && studyPlan.dailyTasks.length > 0 ? (
          (() => {
            const todayStr = formatDate();
            const planTasksForToday = studyPlan.dailyTasks.filter((t) => t.date === todayStr && !t.isRestDay);
            const activeRoadmapTasks = planTasksForToday.length > 0
              ? planTasksForToday
              : studyPlan.dailyTasks.filter((t) => !t.completed && !t.isRestDay).slice(0, 4);

            const missedCount = studyPlan.dailyTasks.filter(
              (t) => !t.completed && !t.isRestDay && t.date < todayStr
            ).length;

            const handleTogglePlanTask = (taskId, e) => {
              e.preventDefault();
              e.stopPropagation();
              db.studyPlan.toggleTask(taskId);
            };

            const handleReschedulePlan = () => {
              const updated = db.studyPlan.reschedule();
              if (updated) {
                toast.success('Đã điều chỉnh dồn lịch học thông minh sang các ngày tiếp theo!');
              }
            };

            return (
              <>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <div className="eyebrow">
                      Lộ trình {studyPlan.meta?.examName || 'Chứng chỉ'} ({studyPlan.meta?.targetLevel || profile.target_level})
                    </div>
                    {missedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleReschedulePlan}
                        className="tap text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Có {missedCount} bài lỡ hẹn • Điều chỉnh dồn lịch</span>
                      </button>
                    )}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Nhiệm vụ trọng tâm hôm nay
                  </h2>
                  <p className="font-body text-xs text-muted-foreground mt-1 mb-4">
                    Theo lộ trình cá nhân hóa ({studyPlan.meta?.dailyMinutes || 45} phút/ngày). Đánh dấu hoàn thành để cập nhật tiến độ.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  {activeRoadmapTasks.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className={`p-3.5 rounded-lg border transition-all flex items-start gap-3 justify-between ${
                        t.completed
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-border/60 bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleTogglePlanTask(t.id, e)}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-emerald-600 transition-colors"
                        title={t.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/60 hover:border-accent" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono mb-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-accent/10 text-accent font-bold uppercase">
                            {t.skill}
                          </span>
                          <span className="text-muted-foreground">{t.durationMinutes} phút</span>
                        </div>
                        <div
                          className={`text-xs font-heading font-semibold line-clamp-2 ${
                            t.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {t.title}
                        </div>
                      </div>

                      <Link
                        to={t.targetPath || '/skills'}
                        className="shrink-0 p-1.5 text-xs font-mono text-accent hover:underline rounded hover:bg-accent/10 transition-colors"
                        title="Vào phòng luyện tập tương ứng"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>
                    Đã hoàn thành {activeRoadmapTasks.filter((t) => t.completed).length}/
                    {activeRoadmapTasks.length} nhiệm vụ
                  </span>
                  <Link to="/readiness" className="text-accent hover:underline">
                    Đo lường độ sẵn sàng thi →
                  </Link>
                </div>
              </>
            );
          })()
        ) : (
          <>
            <div>
              <div className="eyebrow mb-1">Kế hoạch hàng ngày</div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                4 Nhiệm vụ học tập hôm nay
              </h2>
              <p className="font-body text-xs text-muted-foreground mt-1 mb-4">
                Hoàn thành các hoạt động để cộng điểm kinh nghiệm (XP) và duy trì chuỗi học.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
              <Link
                to="/review"
                className="tap p-3.5 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-semibold text-foreground">
                    1. Ôn thẻ từ vựng SRS
                  </div>
                  <div className="text-[11px] text-muted-foreground font-body">
                    {!cardsLoaded ? 'Đang tải…' : dueCards.length > 0 ? `Còn ${dueCards.length} thẻ đến hạn` : 'Đã hoàn thành!'}
                  </div>
                </div>
              </Link>

              <Link
                to="/skills"
                className="tap p-3.5 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-semibold text-foreground">
                    2. Luyện 1 kỹ năng ngôn ngữ
                  </div>
                  <div className="text-[11px] text-muted-foreground font-body">
                    Nghe chính tả, nói đuổi, ngữ pháp...
                  </div>
                </div>
              </Link>

              <Link
                to="/game"
                className="tap p-3.5 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-semibold text-foreground">
                    3. Phản xạ mạo từ Der/Die/Das
                  </div>
                  <div className="text-[11px] text-muted-foreground font-body">
                    Chơi 1 vòng 15 câu nhận ngay XP
                  </div>
                </div>
              </Link>

              <Link
                to="/elio"
                className="tap p-3.5 rounded-lg border border-border/60 bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-400/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-semibold text-foreground">
                    4. Hỏi gia sư AI ELIO
                  </div>
                  <div className="text-[11px] text-muted-foreground font-body">
                    Giải đáp thắc mắc ngữ pháp &amp; bài thi
                  </div>
                </div>
              </Link>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Mỗi nhiệm vụ cộng dồn vào StudyLog trong ngày</span>
              <Link to="/progress" className="text-accent hover:underline">
                Xem tiến độ tuần →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Hàng 5: từ vựng · ngữ pháp · điểm số */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Từ vựng */}
        <section className="dash-glass p-5 flex flex-col">
          <div className="eyebrow">Từ vựng · Wortschatz</div>
          <h2 className="font-display text-xl font-bold text-foreground mt-0.5">
            {cardsLoaded ? `${dueCards.length} thẻ đến hạn` : 'Đang tải…'}
          </h2>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {cardsLoaded
              ? `Tổng ${cards.length} thẻ · ${readiness.vocab.mastered} từ đã thuộc vững · ${readiness.vocab.learned} đã học`
              : 'Đang tải số liệu từ vựng…'}
          </p>
          <div className="space-y-2.5 mt-4 flex-1">
            {!cardsLoaded ? (
              <div className="text-sm text-muted-foreground">Đang tải thẻ đến hạn…</div>
            ) : dueWords.length > 0 ? dueWords.map((c) => (
              <div key={c.id || `${c.article || ''}-${c.german}`} className="rounded-lg border border-border/60 bg-white/[0.03] px-3 py-2">
                <div className="font-heading font-semibold text-sm text-foreground">
                  {c.article ? `${c.article} ` : ''}{c.german}
                </div>
                <div className="text-xs text-muted-foreground truncate">{c.vietnamese || ''}</div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">Đã hoàn thành hết thẻ hôm nay!</div>
            )}
          </div>
          <Link
            to="/review"
            className="tap mt-4 px-3.5 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Ôn ngay</span>
          </Link>
        </section>

        {/* Ngữ pháp */}
        <section className="dash-glass p-5 flex flex-col">
          <div className="eyebrow">Ngữ pháp · Grammatik</div>
          <h2 className="font-display text-xl font-bold text-foreground mt-0.5">{grammarToday.name}</h2>
          <p className="font-body text-xs text-muted-foreground mt-1">{grammarToday.nameVi}</p>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mt-3 line-clamp-4 flex-1">
            {grammarToday.intro}
          </p>
          <Link
            to="/b2"
            className="tap mt-4 px-3.5 py-2 border border-border bg-white/[0.05] hover:bg-white/10 text-foreground text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>Học ngữ pháp trong lộ trình B2</span>
          </Link>
        </section>

        {/* Điểm số */}
        <section className="dash-glass p-5 flex flex-col">
          <div className="eyebrow">Điểm số · Ergebnisse</div>
          <h2 className="font-display text-xl font-bold text-foreground mt-0.5">Điểm chẩn đoán &amp; thi thử</h2>
          <div className="mt-3 space-y-2.5 flex-1">
            {latestDiagnostic ? (
              <div className="rounded-lg border border-border/60 bg-white/[0.03] px-3 py-2.5">
                <div className="text-[11px] font-mono text-muted-foreground">Chẩn đoán Ngày 1</div>
                <div className="font-heading font-semibold text-sm text-foreground mt-0.5">
                  Đọc {latestDiagnostic.lesenRaw}/{latestDiagnostic.lesenMax} · Nghe {latestDiagnostic.hoerenRaw}/{latestDiagnostic.hoerenMax}
                </div>
              </div>
            ) : null}
            {latestScore ? (
              <div className="rounded-lg border border-border/60 bg-white/[0.03] px-3 py-2.5">
                <div className="text-[11px] font-mono text-muted-foreground">{latestScore.label || 'Thi thử'}</div>
                <div className="font-heading font-semibold text-sm text-foreground mt-0.5">
                  {[
                    latestScore.lesen != null ? `Đọc ${latestScore.lesen}` : null,
                    latestScore.sprachbausteine != null ? `Sprachb. ${latestScore.sprachbausteine}` : null,
                    latestScore.hoeren != null ? `Nghe ${latestScore.hoeren}` : null,
                    latestScore.schreiben != null ? `Viết ${latestScore.schreiben}` : null,
                    latestScore.sprechen != null ? `Nói ${latestScore.sprechen}` : null,
                  ].filter(Boolean).join(' · ') || 'Đã lưu điểm'}
                </div>
              </div>
            ) : null}
            {!latestDiagnostic && !latestScore && (
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                Chưa có điểm chẩn đoán hay thi thử nào được lưu. Làm bài chẩn đoán Ngày 1 để có mốc so sánh cho cả lộ trình.
              </p>
            )}
          </div>
          <Link
            to="/b2"
            className="tap mt-4 px-3.5 py-2 border border-border bg-white/[0.05] hover:bg-white/10 text-foreground text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-accent" />
            <span>{latestDiagnostic || latestScore ? 'Xem bảng điểm' : 'Làm bài chẩn đoán'}</span>
          </Link>
        </section>
      </div>

      {/* Hàng 6: thử thách trò chơi + ELIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="dash-glass p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="eyebrow">Thử thách hôm nay</div>
            <h3 className="font-display text-lg font-bold text-foreground mt-0.5">Tình huống giao tiếp</h3>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Dịch câu giao tiếp, chọn câu trả lời, xếp câu — 10 câu một vòng, học nguyên câu theo tình huống thật.
            </p>
          </div>
          <Link
            to="/game"
            className="tap px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-lg inline-flex items-center gap-2 shrink-0"
          >
            <span>Chơi ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <section className="dash-glass p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="eyebrow">Gia sư AI riêng</div>
            <h3 className="font-display text-lg font-bold text-foreground mt-0.5">Trợ lý ngôn ngữ ELIO</h3>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Sửa lỗi ngữ pháp, chấm bài viết theo 4 tiêu chí chuẩn thi, đóng vai giám khảo phỏng vấn thi nói.
            </p>
          </div>
          <Link
            to="/elio"
            className="tap px-4 py-2 border border-border bg-white/[0.05] hover:bg-white/10 text-foreground text-sm font-medium rounded-lg inline-flex items-center gap-2 shrink-0"
          >
            <span>Trò chuyện</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>

      {/* Starter Deck Card (If deck empty) */}
      {cards.length === 0 && (
        <section className="dash-glass p-5 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <BookMarked className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Bộ thẻ của bạn đang trống!
                </h3>
                <p className="font-body text-xs md:text-sm text-muted-foreground mt-0.5">
                  Nạp ngay 30 từ vựng cơ bản thông dụng nhất (Đời sống, Ẩm thực, Nhà ở) để bắt đầu phiên ôn thẻ SRS đầu tiên.
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadStarterDeck}
              className="tap px-5 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-lg shadow-sm shrink-0 inline-flex items-center gap-2"
            >
              <BookMarked className="w-4 h-4" />
              <span>Nạp bộ thẻ mẫu StarterDeck</span>
            </button>
          </div>
        </section>
      )}

      {/* Dock module (mobile): hàng tĩnh, tự xuống dòng — giống bản mobile của demo */}
      <nav aria-label="Module chính" className="dash-glass md:hidden flex flex-wrap justify-center gap-1.5 px-3 py-2.5">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const active = isDockActive(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`tap relative flex items-center justify-center w-11 h-11 rounded-xl border ${
                active
                  ? 'bg-accent text-accent-foreground shadow-lg border-accent'
                  : `${item.tile}`
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </nav>

      {/* Khoảng trống cho dock cố định (desktop) */}
      <div aria-hidden className="hidden md:block h-24" />

      {/* Dock module (desktop) — portal ra body để position:fixed neo theo
          viewport, không bị .animate-rise của main/HomePage (transform
          translateY(0) giữ lại) giữ nó ở cuối nội dung trang. */}
      {createPortal(
        <nav aria-label="Module chính" className="dash-dock dash-glass fixed bottom-4 left-0 right-0 mx-auto w-max max-w-[calc(100vw-2rem)] z-40 hidden md:flex items-end gap-1 px-3 py-2">
          {dockItems.map((item) => {
            const Icon = item.icon;
            const active = isDockActive(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`dash-dock-item relative flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${
                  active
                    ? 'bg-accent text-accent-foreground shadow-lg border-accent'
                    : `${item.tile} hover:bg-white/10`
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="dash-tip absolute -top-9 left-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>,
        document.body
      )}
    </div>
  );
}
