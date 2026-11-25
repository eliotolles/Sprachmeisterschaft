import React, { useEffect, useState } from 'react';
import {
  Apple, Search, Sun, Moon, Wifi, BatteryMedium, SlidersHorizontal,
  Info, Settings, LogOut, User, Sparkles, GraduationCap, CalendarDays,
  ChevronRight, MonitorDown, Maximize2, Minimize2, X, HelpCircle,
} from 'lucide-react';
import { currentPlanDay } from '@/components/telc-b2/RoadmapTab';

/* Top menu bar — frosted glass, always visible. Every menu item does something
   real (navigate / theme / window control / search). No dead entries. */

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sprach_theme') === 'dark';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('sprach_theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  return [isDark, () => setIsDark((d) => !d)];
}

/* Menu primitives — module-level so they never remount when the menu bar
   re-renders (a remount would restart the dropdown animation). */
function MenuItem({ icon: Icon, label, kbd, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}>
      {Icon && <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />}
      <span className="truncate">{label}</span>
      {kbd && <span className="mac-menu-kbd">{kbd}</span>}
    </button>
  );
}
function MenuSep() {
  return <div className="mac-menu-sep" />;
}
function Menu({ id, label, bold, openMenu, onToggle, children }) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`mac-menu-item${bold ? ' mac-menu-item--bold' : ''}`}
        data-open={openMenu === id}
        onClick={() => onToggle(id)}
        aria-haspopup="true"
        aria-expanded={openMenu === id}
      >
        {label}
      </button>
      {openMenu === id && <div className="mac-menu-dropdown mac-glass-strong">{children}</div>}
    </div>
  );
}

/* Live clock — isolated in its own component so the per-second tick only
   re-renders the clock, never the whole menu bar (an open dropdown must
   not remount every second). */
function MacClock({ open, onToggle, onNavigate }) {
  const now = useNow(1000);
  const timeLabel = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateShort = now.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
  const dateFull = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const planDay = currentPlanDay();
  return (
    <div className="relative">
      <button
        type="button"
        className="mac-menu-item"
        data-open={open}
        onClick={onToggle}
        aria-label="Đồng hồ và ngày"
        aria-expanded={open}
      >
        <span className="hidden sm:inline">{dateShort}</span>
        <span className="font-medium tabular-nums">{timeLabel}</span>
      </button>
      {open && (
        <div className="mac-menu-dropdown mac-glass-strong" style={{ right: 0, left: 'auto', minWidth: 270 }}>
          <div className="px-2.5 pt-1.5 text-sm font-semibold">{dateFull}</div>
          <div className="px-2.5 pb-1 text-3xl font-extralight tabular-nums">{timeLabel}</div>
          <div className="px-2.5 pb-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            Lộ trình telc B2: Tag {planDay}/60
          </div>
          <div className="mac-menu-sep" />
          <button type="button" onClick={() => onNavigate('/b2')}>
            <CalendarDays className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Mở lộ trình B2 hôm nay</span>
          </button>
          <button type="button" onClick={() => onNavigate('/')}>
            <span className="truncate">Về trang Hôm nay</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function MacMenuBar({
  moduleTitle, onNavigate, onMinimize, onToggleMaximize, onCloseWindow,
  onReopenWindow, onOpenSpotlight, onShowOnboarding, onLogout, maximized,
  isAdmin, userName, targetLevel, reduceMotion, onToggleReduceMotion,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [controlOpen, setControlOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isDark, toggleDark] = useDarkMode();

  const closeAll = () => {
    setOpenMenu(null);
    setControlOpen(false);
    setClockOpen(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeAll();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        closeAll();
        onOpenSpotlight();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenSpotlight]);

  const toggleFullscreen = () => {
    closeAll();
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const go = (path) => {
    closeAll();
    onNavigate(path);
  };


  return (
    <>
      <header className="mac-menubar" role="menubar" aria-label="Thanh menu macOS">
        {/* Apple menu */}
        <div className="relative">
          <button
            type="button"
            className="mac-menu-item"
            data-open={openMenu === 'apple'}
            onClick={() => setOpenMenu(openMenu === 'apple' ? null : 'apple')}
            aria-label="Menu Apple"
            aria-haspopup="true"
            aria-expanded={openMenu === 'apple'}
          >
            <Apple className="w-4 h-4" />
          </button>
          {openMenu === 'apple' && (
            <div className="mac-menu-dropdown mac-glass-strong">
              <MenuItem icon={Info} label="Giới thiệu về Sprachmeisterschaft" onClick={() => { closeAll(); setShowAbout(true); }} />
              <MenuItem icon={Settings} label="Cài đặt hệ thống…" onClick={() => go('/me/settings')} />
              <MenuSep />
              <MenuItem icon={LogOut} label="Đăng xuất…" onClick={() => { closeAll(); onLogout(); }} />
            </div>
          )}
        </div>

        {/* App name + current module */}
        <span className="mac-menu-item mac-menu-item--bold" title="Sprachmeisterschaft">
          Sprachmeisterschaft
        </span>
        <span className="hidden sm:inline text-[13px] text-muted-foreground truncate">{moduleTitle}</span>

        {/* Desktop menus */}
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Menu ứng dụng">
          <Menu id="file" label="File" openMenu={openMenu} onToggle={(id) => setOpenMenu(openMenu === id ? null : id)}>
            <MenuItem label="Trang chủ" onClick={() => go('/')} />
            <MenuItem label="Ôn thẻ" onClick={() => go('/review')} />
            <MenuItem label="Từ vựng" onClick={() => go('/vocabulary')} />
            <MenuItem label="Luyện nghe" onClick={() => go('/skills/listening')} />
          </Menu>
          <Menu id="view" label="View" openMenu={openMenu} onToggle={(id) => setOpenMenu(openMenu === id ? null : id)}>
            <MenuItem icon={isDark ? Sun : Moon} label={isDark ? 'Chế độ sáng' : 'Chế độ tối'} onClick={() => { toggleDark(); }} />
            <MenuSep />
            <MenuItem icon={MonitorDown} label="Thu nhỏ cửa sổ" onClick={() => { closeAll(); onMinimize(); }} />
            <MenuItem icon={maximized ? Minimize2 : Maximize2} label={maximized ? 'Khôi phục cửa sổ' : 'Phóng to cửa sổ'} onClick={() => { closeAll(); onToggleMaximize(); }} />
            <MenuItem icon={Maximize2} label="Toàn màn hình" onClick={toggleFullscreen} />
          </Menu>
          <Menu id="go" label="Go" openMenu={openMenu} onToggle={(id) => setOpenMenu(openMenu === id ? null : id)}>
            <MenuItem label="Kỹ năng" onClick={() => go('/skills')} />
            <MenuItem label="Học & khám phá" onClick={() => go('/explore')} />
            <MenuItem label="Các bộ học" onClick={() => go('/collections/all')} />
            <MenuItem label="Trò chơi" onClick={() => go('/game')} />
            <MenuItem label="Luyện thi" onClick={() => go('/exams')} />
            <MenuItem label="Lộ trình B2" onClick={() => go('/b2')} />
            <MenuItem label="Sẵn sàng thi" onClick={() => go('/readiness')} />
            <MenuItem label="AI ELIO" onClick={() => go('/elio')} />
            <MenuItem label="Tiến độ" onClick={() => go('/progress')} />
            <MenuItem label="Meine Seiten" onClick={() => go('/me')} />
            <MenuItem label="Ghi chú" onClick={() => go('/me/notes')} />
            {isAdmin && (<><MenuSep /><MenuItem label="Quản trị viên" onClick={() => go('/admin')} /></>)}
          </Menu>
          <Menu id="window" label="Window" openMenu={openMenu} onToggle={(id) => setOpenMenu(openMenu === id ? null : id)}>
            <MenuItem icon={MonitorDown} label="Thu nhỏ" onClick={() => { closeAll(); onMinimize(); }} />
            <MenuItem icon={maximized ? Minimize2 : Maximize2} label={maximized ? 'Phóng to' : 'Khôi phục'} onClick={() => { closeAll(); onToggleMaximize(); }} />
            <MenuItem icon={X} label="Đóng cửa sổ" onClick={() => { closeAll(); onCloseWindow(); }} />
            <MenuSep />
            <MenuItem label="Mở lại cửa sổ" onClick={() => { closeAll(); onReopenWindow(); }} />
          </Menu>
          <Menu id="help" label="Help" openMenu={openMenu} onToggle={(id) => setOpenMenu(openMenu === id ? null : id)}>
            <MenuItem icon={Search} label="Tìm kiếm…" kbd="⌘K" onClick={() => { closeAll(); onOpenSpotlight(); }} />
            <MenuItem icon={HelpCircle} label="Hướng dẫn sử dụng" onClick={() => { closeAll(); onShowOnboarding(); }} />
            <MenuSep />
            <MenuItem icon={Info} label="Giới thiệu" onClick={() => { closeAll(); setShowAbout(true); }} />
          </Menu>
        </nav>

        <div className="flex-1" />

        {/* Right side: theme, control center, spotlight, wifi, battery, clock */}
        <button
          type="button"
          className="mac-menu-item"
          onClick={toggleDark}
          title={isDark ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
          aria-label="Đổi giao diện sáng / tối"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button
            type="button"
            className="mac-menu-item"
            data-open={controlOpen}
            onClick={() => { setControlOpen(!controlOpen); setOpenMenu(null); setClockOpen(false); }}
            title="Trung tâm điều khiển"
            aria-label="Trung tâm điều khiển"
            aria-expanded={controlOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {controlOpen && (
            <div className="mac-menu-dropdown mac-glass-strong" style={{ right: 0, left: 'auto', minWidth: 260 }}>
              <div className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">Trung tâm điều khiển</div>
              <MenuItem icon={isDark ? Sun : Moon} label={isDark ? 'Giao diện: Tối' : 'Giao diện: Sáng'} onClick={toggleDark} />
              <Item
                icon={Sparkles}
                label={reduceMotion ? 'Chuyển động: Đã giảm' : 'Chuyển động: Đầy đủ'}
                onClick={onToggleReduceMotion}
              />
              <MenuSep />
              <button type="button" onClick={() => go('/me')}>
                <User className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{userName || 'Học viên'} · Mục tiêu {targetLevel || 'B1'}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
              </button>
              <MenuItem icon={Settings} label="Cài đặt…" onClick={() => go('/me/settings')} />
            </div>
          )}
        </div>

        <button
          type="button"
          className="mac-menu-item"
          onClick={() => { closeAll(); onOpenSpotlight(); }}
          title="Tìm kiếm (⌘K)"
          aria-label="Tìm kiếm Spotlight"
        >
          <Search className="w-4 h-4" />
        </button>

        <span className="hidden sm:inline-flex items-center gap-3 px-1 text-muted-foreground" title="Đã kết nối mạng">
          <Wifi className="w-4 h-4" />
          <BatteryMedium className="w-4 h-4" />
        </span>

        <MacClock
          open={clockOpen}
          onToggle={() => { setClockOpen(!clockOpen); setOpenMenu(null); setControlOpen(false); }}
          onNavigate={go}
        />
      </header>

      {/* Click-away backdrop for menus / panels */}
      {(openMenu || controlOpen || clockOpen) && (
        <div
          className="fixed inset-0 z-[55] cursor-default"
          onClick={closeAll}
          aria-hidden="true"
        />
      )}

      {/* About dialog */}
      {showAbout && (
        <div className="mac-about" role="dialog" aria-modal="true" aria-label="Giới thiệu" onClick={() => setShowAbout(false)}>
          <div className="mac-about-card mac-glass-strong" onClick={(e) => e.stopPropagation()}>
            <img src="/mascot/capi-hero.svg" alt="Capi — linh vật capybara" className="w-28 h-28 mx-auto rounded-2xl object-cover" />
            <h2 className="font-display text-xl font-bold mt-3">Sprachmeisterschaft</h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">Phiên bản 1.0.0 · DeutschMaster A1–C2</p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Học tiếng Đức cho kỳ thi telc B2 — từ vựng, ngữ pháp, luyện nghe,
              trò chơi và lộ trình 60 ngày. Cùng Capi, chú capybara đeo tai nghe.
            </p>
            <button
              type="button"
              onClick={() => setShowAbout(false)}
              className="tap mt-5 px-5 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MacMenuBar;
