import { ScreenWordLookup } from '@/components/vocabulary/ScreenWordLookup';
import { CollectionToolbar } from '@/components/common/CollectionTools';
import { FloatingAiAssistant } from '@/components/common/FloatingAiAssistant';
import { toast } from 'sonner';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from '@/lib/router';
import { db } from '@/lib/db';
import {
  Calendar,
  RotateCw,
  BookMarked,
  Gamepad2,
  FileCheck2,
  GraduationCap,
  Bot,
  TrendingUp,
  UserCheck,
  Settings,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { MacMenuBar } from '@/components/macos/MacMenuBar';
import { MacDock } from '@/components/macos/MacDock';
import { MacSpotlight } from '@/components/macos/MacSpotlight';
import { MacWindow, MacDesktop } from '@/components/macos/MacWindow';
import '@/components/macos/macos.css';

/* macOS desktop shell. The shell is only a frame: routing, pages, API calls,
   state and the Turso backend are untouched — every feature lives in the
   same components as before, inside one macOS window. */

function moduleTitleFor(path) {
  if (path === '/' || path === '') return 'Hôm nay';
  if (path === '/review') return 'Ôn thẻ';
  if (path === '/vocabulary') return 'Từ vựng';
  if (path === '/vocabulary/levels') return 'Cấp độ từ vựng';
  if (path === '/vocabulary/library') return 'Thư viện từ vựng';
  if (path === '/vocabulary/dictionary') return 'Từ điển';
  if (path === '/vocabulary/situations') return 'Tình huống giao tiếp';
  if (path === '/vocabulary/specialties' || path === '/vocabulary/professions') return 'Từ vựng chuyên ngành';
  if (path === '/skills') return 'Kỹ năng';
  if (path === '/skills/listening') return 'Luyện nghe';
  if (path === '/skills/listening/personal' || path === '/personal-videos') return 'Video cá nhân';
  if (path.startsWith('/skills/listening/')) return 'Luyện nghe';
  if (path.startsWith('/skills/')) {
    const skill = path.replace('/skills/', '').split('/')[0];
    const names = {
      reading: 'Luyện đọc', writing: 'Luyện viết', speaking: 'Luyện nói',
      grammar: 'Ngữ pháp', dictation: 'Chép chính tả', shadowing: 'Shadowing',
      pronunciation: 'Phát âm', interview: 'Phỏng vấn', listening: 'Luyện nghe',
    };
    return names[skill] || 'Kỹ năng';
  }
  if (path === '/game') return 'Trò chơi';
  if (path.startsWith('/exams')) return 'Luyện thi';
  if (path === '/readiness') return 'Sẵn sàng thi';
  if (path === '/elio') return 'AI ELIO';
  if (path === '/progress') return 'Tiến độ';
  if (path === '/me') return 'Meine Seiten';
  if (path === '/me/settings') return 'Cài đặt';
  if (path === '/me/notes') return 'Ghi chú';
  if (path === '/admin') return 'Quản trị viên';
  if (path === '/b2') return 'Lộ trình B2';
  if (path.startsWith('/explore')) return 'Học & khám phá';
  if (path.startsWith('/collections')) return 'Các bộ học';
  if (path.startsWith('/practice')) return 'Luyện tập';
  return 'Sprachmeisterschaft';
}

export function AppShell({ children }) {
  const { currentPath, navigate } = useRouter();
  const [user, setUser] = useState(() => db.auth.getUser());
  const [profile, setProfile] = useState(() => db.learnerProfile.get());
  const [showOnboarding, setShowOnboarding] = useState(() => db.studyPlan?.shouldShowOnboarding() || false);

  // macOS window state: open | minimized (keeps the Dock dot) | closed (no dot).
  const [windowState, setWindowState] = useState('open');
  const [maximized, setMaximized] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sprach_macos_maximized') === 'true';
    }
    return false;
  });
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sprach_reduce_motion') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sprach_macos_maximized', String(maximized));
    }
  }, [maximized]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sprach_reduce_motion', String(reduceMotion));
    }
  }, [reduceMotion]);

  useEffect(() => {
    const handleDbChange = () => {
      setProfile(db.learnerProfile.get());
      setShowOnboarding(db.studyPlan?.shouldShowOnboarding() || false);
    };
    const handleAuthChange = () => {
      setUser(db.auth.getUser());
      setProfile(db.learnerProfile.get());
      setShowOnboarding(db.studyPlan?.shouldShowOnboarding() || false);
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    window.addEventListener('sprach_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('sprach_db_change', handleDbChange);
      window.removeEventListener('sprach_auth_change', handleAuthChange);
    };
  }, []);

  const userIsAdmin = Boolean(user?.role === 'admin' || db.auth.isAdmin());

  // Any navigation reopens the window (like launching the app from the Dock).
  const handleNavigate = useCallback((path) => {
    setWindowState('open');
    navigate(path);
  }, [navigate]);

  const handleLogout = async () => {
    try { await db.auth.logout(); navigate('/login'); }
    catch (error) { toast.error(error.message || 'Chưa đăng xuất được.'); }
  };

  const dockItems = useMemo(() => [
    { path: '/', label: 'Hôm nay', icon: Calendar, color: '#0a84ff' },
    { path: '/review', label: 'Ôn thẻ', icon: RotateCw, color: '#30d158' },
    { path: '/vocabulary', label: 'Từ vựng', icon: BookMarked, color: '#ff9f0a' },
    { path: '/skills/listening', label: 'Luyện nghe', icon: Headphones, color: '#ff375f' },
    { path: '/game', label: 'Trò chơi', icon: Gamepad2, color: '#af52de' },
    { path: '/exams', label: 'Luyện thi', icon: FileCheck2, color: '#0e9488' },
    { path: '/b2', label: 'Lộ trình B2', icon: GraduationCap, color: '#5856d6' },
    { path: '/elio', label: 'AI ELIO', icon: Bot, color: '#34c9a3' },
    { path: '/progress', label: 'Tiến độ', icon: TrendingUp, color: '#ffd60a', darkIcon: true },
    { path: '/me', label: 'Tôi', icon: UserCheck, color: '#8e8e93' },
    { path: '/me/settings', label: 'Cài đặt', icon: Settings, color: '#636366' },
    ...(userIsAdmin
      ? [{ path: '/admin', label: 'Quản trị viên', icon: ShieldCheck, color: '#ff453a', separatorBefore: true }]
      : []),
  ], [userIsAdmin]);

  const moduleTitle = moduleTitleFor(currentPath);
  const windowTitle = moduleTitle === 'Sprachmeisterschaft' ? 'Sprachmeisterschaft' : `Sprachmeisterschaft — ${moduleTitle}`;
  const userInitial = (profile.display_name || user?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className={`mac-shell min-h-screen text-foreground antialiased selection:bg-accent/20 selection:text-accent${reduceMotion ? ' reduce-motion' : ''}`}>
      {/* Desktop wallpaper (fixed, behind everything) */}
      <div className="mac-wallpaper" aria-hidden="true" />

      {/* Top menu bar */}
      <MacMenuBar
        moduleTitle={moduleTitle}
        onNavigate={handleNavigate}
        onMinimize={() => setWindowState('minimized')}
        onToggleMaximize={() => setMaximized((m) => !m)}
        onCloseWindow={() => setWindowState('closed')}
        onReopenWindow={() => setWindowState('open')}
        onOpenSpotlight={() => setSpotlightOpen(true)}
        onShowOnboarding={() => setShowOnboarding(true)}
        onLogout={handleLogout}
        maximized={maximized}
        isAdmin={userIsAdmin}
        userName={profile.display_name || user?.name}
        targetLevel={profile.target_level}
        reduceMotion={reduceMotion}
        onToggleReduceMotion={() => setReduceMotion((r) => !r)}
      />

      {/* Window or desktop */}
      <div className="relative z-10">
        {windowState === 'open' ? (
          <div className={maximized ? 'px-0 pt-10 pb-24' : 'px-2 sm:px-4 pt-12 pb-28'}>
            <div className={maximized ? 'w-full' : 'max-w-7xl mx-auto w-full'}>
              <MacWindow
                title={windowTitle}
                maximized={maximized}
                onClose={() => setWindowState('closed')}
                onMinimize={() => setWindowState('minimized')}
                onToggleMaximize={() => setMaximized((m) => !m)}
                onOpenSpotlight={() => setSpotlightOpen(true)}
                userInitial={userInitial}
                onGoMe={() => handleNavigate('/me')}
              >
                <main className="min-w-0 p-4 md:p-6 lg:p-8 animate-rise">
                  <CollectionToolbar />
                  {children}
                  <ScreenWordLookup />
                </main>
              </MacWindow>
            </div>
          </div>
        ) : (
          <div className="pt-10">
            <MacDesktop onOpen={handleNavigate} />
          </div>
        )}
      </div>

      {/* Bottom Dock (fixed pill — only icons scale) */}
      <MacDock
        items={dockItems}
        currentPath={currentPath}
        onSelect={handleNavigate}
        windowOpen={windowState !== 'closed'}
      />

      {/* Spotlight command palette */}
      <MacSpotlight
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Persistent 24/7 AI Floating Assistant Widget (only while the window is open) */}
      {windowState === 'open' && <FloatingAiAssistant />}

      {/* Personalized Onboarding Popup for First-Time Successful Login */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}

export default AppShell;
