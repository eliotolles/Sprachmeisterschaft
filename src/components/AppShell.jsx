import {elioClient,elioAuthentication} from '@/lib/elio-auth-runtime';
import {ScreenWordLookup} from '@/components/vocabulary/ScreenWordLookup';
import {CollectionToolbar} from '@/components/common/CollectionTools';
import {toast} from 'sonner';
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [telcImport,setTelcImport]=useState('');
  useEffect(()=>{
   if(!elioAuthentication()?.isActive()||!['admin','super_admin'].includes(user?.role))return;let active=true;
   (async()=>{for(let batch=0;batch<30&&active;batch++){const result=await elioClient.installTelc18();if(!active)return;if(result.remaining)setTelcImport('Đang nhập bộ TELC: '+result.installed+'/'+result.total+' phần');else{setTelcImport('');window.dispatchEvent(new CustomEvent('sprach_core_imported'));if(batch||result.inserted)toast.success('Đã nhập bộ TELC 18 đề vào đúng mô-đun; mở đề để luyện ngay.');return;}}})().catch(error=>{if(active)setTelcImport('Nhập bộ TELC chưa hoàn tất: '+error.message+' · mở lại trang để tiếp tục.');});
   return()=>{active=false;};
  },[user?.id,user?.role]);
  const [profile, setProfile] = useState(() => db.learnerProfile.get());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => db.studyPlan?.shouldShowOnboarding() || false);

  // Auto-collapse / Expand State with Auto-Hover Reveal
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sprach_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Auto-collapse when entering immersive pages (Listening Studio / Exam testing)
  useEffect(() => {
    const isImmersivePage =
      (currentPath.startsWith('/skills/listening/') && currentPath.split('/').length > 3) ||
      (currentPath.startsWith('/exams/') && currentPath !== '/exams');
    if (isImmersivePage) {
      setIsCollapsed(true);
      setIsHovered(false);
    }
  }, [currentPath]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      setIsHovered(false);
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

  const userIsAdmin = Boolean(user?.role === 'admin' || db.auth.isAdmin());

  const navGroups = useMemo(() => [
    {
      group: 'Học / Lernen',
      items: [
        { path: '/', label: 'Hôm nay', icon: Calendar },
        { path: '/review', label: 'Ôn thẻ', icon: RotateCw },
        { path: '/vocabulary', label: 'Từ vựng', icon: BookMarked },
        { path: '/explore', label: 'Học & khám phá', icon: Compass },
        { path: '/collections/all', label: 'Các bộ học', icon: BookOpen },
      ],
    },
    {
      group: 'Luyện / Trainieren',
      items: [
        { path: '/skills', label: 'Kỹ năng', icon: Sparkles },
        { path: '/skills/listening', label: 'Luyện nghe', icon: Headphones },
        { path: '/skills/listening/personal', label: 'Video cá nhân', icon: Video },
        { path: '/game', label: 'Trò chơi', icon: Gamepad2 },
        { path: '/exams', label: 'Luyện thi', icon: FileCheck2 },
        { path: '/readiness', label: 'Sẵn sàng thi', icon: Gauge },
        { path: '/elio', label: 'AI ELIO', icon: Bot },
      ],
    },
    {
      group: 'Tôi / Persönlich',
      items: [
        { path: '/progress', label: 'Tiến độ', icon: TrendingUp },
        { path: '/me', label: 'Meine Seiten', icon: UserCheck },
        // Quản trị viên chỉ hiển thị duy nhất khi tài khoản có quyền Admin
        ...(userIsAdmin
          ? [{ path: '/admin', label: 'Quản trị viên', icon: ShieldCheck, adminOnly: true }]
          : []),
      ],
    },
  ], [userIsAdmin]);

  // Mobile bottom navigation (5 core tabs)
  const mobileNavItems = [
    { path: '/', label: 'Hôm nay', icon: Calendar },
    { path: '/review', label: 'Ôn thẻ', icon: RotateCw },
    { path: '/skills', label: 'Kỹ năng', icon: Sparkles },
    { path: '/exams', label: 'Luyện thi', icon: FileCheck2 },
    { path: '/elio', label: 'ELIO', icon: Bot },
  ];

  const handleLogout = async () => {
    try {await db.auth.logout();navigate('/login');}
    catch(error){toast.error(error.message || 'Chưa đăng xuất được.');}
  };

  const handleMouseEnter = () => {
    if (!isCollapsed) return;
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 140);
  };

  // When collapsed, hovering smoothly expands the sidebar as an overlay without shifting layout
  const effectiveExpanded = !isCollapsed || isHovered;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground antialiased selection:bg-accent/20 selection:text-accent">
      {/* Desktop Sidebar Static Placeholder: Guarantees Zero Layout Shift for Page Content */}
      <div
        className={`hidden md:block shrink-0 transition-[width] duration-200 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-60 lg:w-64'
        }`}
      />

      {/* Desktop Sidebar with Auto-Hover Overlay & Clean Explicit Toggle */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex flex-col border-r border-border bg-card/95 backdrop-blur-md fixed top-0 left-0 h-screen overflow-y-auto overflow-x-hidden shrink-0 select-none transition-[width,box-shadow] duration-200 ease-in-out ${
          isCollapsed && isHovered
            ? 'w-60 lg:w-64 shadow-2xl z-50 ring-1 ring-border/80'
            : isCollapsed
            ? 'w-16 z-30'
            : 'w-60 lg:w-64 z-30'
        }`}
      >
        {/* Brand / Logo + Collapse Toggle Button */}
        <div className={`border-b border-border transition-all ${!effectiveExpanded ? 'p-3 text-center' : 'p-4'}`}>
          <div className="flex items-center justify-between gap-2">
            {effectiveExpanded ? (
              <Link to="/" className="block group min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="eyebrow text-accent">Sprachplattform</span>
                </div>
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors leading-none truncate">
                  Sprachmeisterschaft
                </h1>
                <p className="font-heading text-xs text-muted-foreground mt-0.5">
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
              title={isCollapsed ? 'Mở rộng và ghim thanh bên' : 'Thu gọn thanh bên (Tự động mở khi rê chuột)'}
            >
              {!effectiveExpanded ? (
                <PanelLeftOpen className="w-4 h-4 text-accent" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {effectiveExpanded && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-xs font-mono text-accent">
              <span>Mục tiêu:</span>
              <strong className="font-bold">{profile.target_level || 'B1'}</strong>
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className={`flex-1 py-3 space-y-5 ${!effectiveExpanded ? 'px-2' : 'px-3'}`}>
          {navGroups.map((group) => (
            <div key={group.group}>
              {effectiveExpanded && (
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
                        title={!effectiveExpanded ? item.label : undefined}
                        className={`tap flex items-center rounded-sm text-sm font-medium transition-colors ${
                          !effectiveExpanded
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
                          {effectiveExpanded && (
                            <span className="font-heading truncate whitespace-nowrap">{item.label}</span>
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
        <div className={`border-t border-border bg-card/90 space-y-3 ${!effectiveExpanded ? 'p-2 text-center' : 'p-3.5'}`}>
          <div className={`flex items-center ${!effectiveExpanded ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center font-display font-bold text-accent shrink-0">
                {(profile.display_name || 'U').charAt(0).toUpperCase()}
              </div>
              {effectiveExpanded && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {profile.display_name || user?.name || 'Học viên'}
                    </span>
                    {userIsAdmin ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                        👑 Admin
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        🎓 Học viên
                      </span>
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
            {effectiveExpanded && <ThemeToggle />}
          </div>

          {effectiveExpanded ? (
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
                className="hover:text-foreground inline-flex items-center gap-1 p-1 hover:bg-muted rounded-sm transition-colors"
                title="Cài đặt cá nhân"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài đặt</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hover:text-rose-600 inline-flex items-center gap-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-sm transition-colors text-rose-500"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Thoát</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
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
        <CollectionToolbar/>
        {telcImport&&<p role="status" className="surface border border-border p-3 mb-4 font-body text-sm">{telcImport}</p>}
        {children}
        <ScreenWordLookup/>
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
