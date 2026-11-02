import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '@/lib/router';
import { db } from '@/lib/db';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Calendar,
  RotateCw,
  BookMarked,
  Sparkles,
  Gamepad2,
  FileCheck2,
  Gauge,
  Bot,
  TrendingUp,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Compass,
  BookOpen,
  Headphones,
  Video,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export function AppShell({ children }) {
  const { currentPath, navigate } = useRouter();
  const [user, setUser] = useState(() => db.auth.getUser());
  const [profile, setProfile] = useState(() => db.learnerProfile.get());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => db.studyPlan?.shouldShowOnboarding() || false);

  // Sidebar Collapse / Expand State (Controlled explicitly by user and persisted)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sprach_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sprach_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

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

  const navGroups = [
    {
      group: 'Học / Lernen',
      items: [
        { path: '/', label: 'Hôm nay', de: 'Heute', icon: Calendar },
        { path: '/review', label: 'Ôn thẻ', de: 'Wiederholen', icon: RotateCw },
        { path: '/vocabulary', label: 'Từ vựng', de: 'Wortschatz', icon: BookMarked },
      ],
    },
    {
      group: 'Luyện / Trainieren',
      items: [
        { path: '/skills', label: 'Kỹ năng', de: 'Fertigkeiten', icon: Sparkles },
        { path: '/skills/listening', label: 'Luyện nghe', de: 'Hörverstehen', icon: Headphones },
        { path: '/skills/listening/personal', label: 'Video cá nhân', de: 'Eigene Videos', icon: Video },
        { path: '/game', label: 'Trò chơi', de: 'Der/Die/Das', icon: Gamepad2 },
        { path: '/exams', label: 'Luyện thi', de: 'Prüfung', icon: FileCheck2 },
        { path: '/readiness', label: 'Sẵn sàng thi', de: 'Prüfungsreife', icon: Gauge },
        { path: '/elio', label: 'AI ELIO', de: 'KI-Tutor', icon: Bot },
      ],
    },
    {
      group: 'Tôi / Persönlich',
      items: [
        { path: '/progress', label: 'Tiến độ', de: 'Fortschritt', icon: TrendingUp },
        { path: '/me', label: 'Meine Seiten', de: 'Mein Bereich', icon: UserCheck },
        { path: '/admin', label: 'Quản trị viên', de: 'Admin Panel', icon: ShieldCheck },
      ],
    },
  ];

  // Mobile bottom navigation (5 core tabs)
  const mobileNavItems = [
    { path: '/', label: 'Hôm nay', icon: Calendar },
    { path: '/review', label: 'Ôn thẻ', icon: RotateCw },
    { path: '/skills', label: 'Kỹ năng', icon: Sparkles },
    { path: '/exams', label: 'Luyện thi', icon: FileCheck2 },
    { path: '/elio', label: 'ELIO', icon: Bot },
  ];

  const handleLogout = () => {
    db.auth.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground antialiased selection:bg-accent/20 selection:text-accent">
      {/* Desktop Sidebar with Clean Explicit Toggle & Zero Lag */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card/85 backdrop-blur-md sticky top-0 h-screen overflow-y-auto shrink-0 select-none transition-[width] duration-200 ease-in-out z-30 ${
          isCollapsed ? 'w-16' : 'w-60 lg:w-64'
        }`}
      >
        {/* Brand / Logo + Collapse Toggle Button */}
        <div className={`border-b border-border transition-all ${isCollapsed ? 'p-3 text-center' : 'p-4'}`}>
          <div className="flex items-center justify-between gap-2">
            {!isCollapsed ? (
              <Link to="/" className="block group min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="eyebrow text-accent">Sprachplattform</span>
                </div>
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors leading-none truncate">
                  Sprachmeisterschaft
                </h1>
                <p className="font-heading italic text-xs text-muted-foreground mt-0.5">
                  DeutschMaster A1–C2
                </p>
              </Link>
            ) : (
              <Link to="/" className="mx-auto block" title="Sprachmeisterschaft">
                <span className="w-8 h-8 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center font-display font-bold text-accent text-sm">
                  SM
                </span>
              </Link>
            )}

            {/* Toggle Collapse Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-accent" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isCollapsed && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-xs font-mono text-accent">
              <span>Mục tiêu:</span>
              <strong className="font-bold">{profile.target_level || 'B1'}</strong>
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className={`flex-1 py-3 space-y-5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navGroups.map((group) => (
            <div key={group.group}>
              {!isCollapsed && (
                <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  {group.group}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentPath === item.path ||
                    (item.path !== '/' && currentPath.startsWith(item.path));

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        title={isCollapsed ? item.label : undefined}
                        className={`tap flex items-center rounded-sm text-sm font-medium transition-colors ${
                          isCollapsed
                            ? 'justify-center p-2.5'
                            : 'px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-accent text-accent-foreground shadow-sm font-semibold'
                            : 'text-foreground/80 hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-accent-foreground' : 'text-accent/80'
                            }`}
                          />
                          {!isCollapsed && (
                            <span className="font-heading truncate">{item.label}</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`border-t border-border bg-card/90 space-y-3 ${isCollapsed ? 'p-2 text-center' : 'p-3.5'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center font-display font-bold text-accent shrink-0">
                {(profile.display_name || 'U').charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {profile.display_name || user?.name || 'Học viên'}
                    </span>
                    {db.auth.isAdmin() ? (
                      <button
                        onClick={() => {
                          db.auth.toggleAdminMode();
                        }}
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-500/25 shrink-0"
                        title="Bấm để chuyển sang vai trò Học viên"
                      >
                        👑 Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          db.auth.toggleAdminMode();
                        }}
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted border border-border text-muted-foreground hover:text-foreground shrink-0"
                        title="Bấm để bật chế độ Quản trị viên (Super Admin)"
                      >
                        🎓 Học viên
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">
                    {profile.target_level || 'B1'} • D-
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(profile.exam_date || Date.now()) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && <ThemeToggle />}
          </div>

          {!isCollapsed ? (
            <div className="flex items-center justify-between pt-1 text-xs font-mono text-muted-foreground">
              <Link
                to="/landing"
                className="hover:text-foreground inline-flex items-center gap-1 p-1 hover:bg-muted rounded-sm transition-colors"
                title="Xem Trang bìa giới thiệu"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Trang bìa</span>
              </Link>
              <Link
                to="/me/settings"
                className="hover:text-foreground inline-flex items-center gap-1 p-1 hover:bg-muted rounded-sm"
                title="Cài đặt hệ thống"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài đặt</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-accent inline-flex items-center gap-1 p-1 hover:bg-muted rounded-sm transition-colors"
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center pt-1">
              <ThemeToggle />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur-md border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-display font-bold text-lg text-foreground">
            Sprachmeisterschaft
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-accent/10 text-accent font-semibold">
            {profile.target_level || 'B1'}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-sm border border-border text-foreground hover:bg-muted"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Full Dropdown Menu (When hamburger tapped) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] bottom-[56px] z-50 bg-background/95 backdrop-blur-md p-4 overflow-y-auto border-b border-border">
          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.group}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  {group.group}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`tap p-2.5 rounded-sm border text-xs font-medium flex items-center gap-2 ${
                          isActive
                            ? 'bg-accent text-accent-foreground border-accent font-semibold'
                            : 'bg-card border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono">
              <Link
                to="/me/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4" />
                Cài đặt
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="inline-flex items-center gap-1.5 text-accent hover:underline"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 pb-20 md:pb-8 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-rise">
        {children}
      </main>

      {/* Mobile Bottom Navigation (5 quick items) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around py-1.5 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`tap flex flex-col items-center justify-center py-1 px-2.5 rounded-sm text-[10px] font-mono ${
                isActive ? 'text-accent font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'scale-110' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Personalized Onboarding Popup for First-Time Successful Login */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}

export default AppShell;
