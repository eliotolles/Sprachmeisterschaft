import React, { useEffect, useState } from 'react';
import { Headphones, GraduationCap, BookMarked, Bot, Gamepad2 } from 'lucide-react';

/* macOS window frame: traffic lights + centered title + actions.
   The title bar is sticky (CSS) so it stays visible while the page scrolls. */

export function MacWindow({ title, maximized, onClose, onMinimize, onToggleMaximize, onOpenSpotlight, userInitial, onGoMe, children }) {
  return (
    <div className={`mac-window${maximized ? ' mac-window--maximized' : ''}`}>
      <div className="mac-titlebar">
        <div className="mac-traffic" role="group" aria-label="Điều khiển cửa sổ">
          <button type="button" className="mac-tl-close" onClick={onClose} title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
            <svg viewBox="0 0 8 8"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          </button>
          <button type="button" className="mac-tl-min" onClick={onMinimize} title="Thu nhỏ vào Dock" aria-label="Thu nhỏ vào Dock">
            <svg viewBox="0 0 8 8"><path d="M1 4h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          </button>
          <button type="button" className="mac-tl-max" onClick={onToggleMaximize} title={maximized ? 'Khôi phục cửa sổ' : 'Phóng to cửa sổ'} aria-label={maximized ? 'Khôi phục cửa sổ' : 'Phóng to cửa sổ'}>
            <svg viewBox="0 0 8 8"><path d="M1 5V1h4M7 3v4H3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none" /></svg>
          </button>
        </div>
        <div className="mac-titlebar-title">{title}</div>
        <div className="mac-titlebar-actions">
          <button type="button" onClick={onOpenSpotlight} title="Tìm kiếm (⌘K)" aria-label="Tìm kiếm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          </button>
          <button type="button" onClick={onGoMe} title="Tài khoản của tôi" aria-label="Tài khoản của tôi">
            <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center font-display font-bold text-accent text-[11px]">
              {userInitial || 'U'}
            </span>
          </button>
        </div>
      </div>
      <div className="mac-window-body">{children}</div>
    </div>
  );
}

export default MacWindow;

/* Desktop shown when the window is closed / minimized. Real live clock,
   real calendar month, real B2 plan day, Capi, and quick-launch icons. */

export function MacDesktop({ onOpen }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 13 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const timeLabel = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateFull = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const cells = [
    ...Array.from({ length: firstWeekday }, (_, i) => ({ key: `pad-${i}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ key: `d-${i + 1}`, day: i + 1, today: i + 1 === now.getDate() })),
  ];

  const quick = [
    { path: '/skills/listening', label: 'Luyện nghe', icon: Headphones, color: '#ff375f' },
    { path: '/b2', label: 'Lộ trình B2', icon: GraduationCap, color: '#5856d6' },
    { path: '/vocabulary', label: 'Từ vựng', icon: BookMarked, color: '#ff9f0a' },
    { path: '/elio', label: 'AI ELIO', icon: Bot, color: '#34c9a3' },
    { path: '/game', label: 'Trò chơi', icon: Gamepad2, color: '#af52de' },
  ];

  return (
    <div className="mac-desktop">
      <div className="text-center">
        <div className="mac-desktop-clock tabular-nums">{timeLabel}</div>
        <div className="mac-desktop-date mt-1">{dateFull}</div>
        <p className="text-white/80 text-sm mt-2" style={{ textShadow: '0 1px 8px rgba(0,0,0,.4)' }}>
          {greeting} — bấm vào biểu tượng trên Dock để mở lại Sprachmeisterschaft.
        </p>
      </div>

      <div className="mac-desktop-widgets">
        <div className="mac-desktop-widget mac-glass-strong">
          <div className="flex items-center gap-3">
            <img src="/mascot/capi-hero.svg" alt="Capi — linh vật capybara" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div className="min-w-0">
              <div className="font-heading font-semibold text-sm">Capi nói:</div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                “Hôm nay học tiếp nhé! Mở Lộ trình B2 để xem bài của ngày hôm nay.”
              </p>
              <button type="button" onClick={() => onOpen('/b2')} className="tap mt-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                Mở lộ trình B2
              </button>
            </div>
          </div>
        </div>

        <div className="mac-desktop-widget mac-glass-strong">
          <div className="text-sm font-semibold mb-2">{monthLabel}</div>
          <div className="mac-desktop-cal">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <span key={d} className="mac-cal-head">{d}</span>
            ))}
            {cells.map((c) => (
              c.empty
                ? <span key={c.key} />
                : <span key={c.key} className={c.today ? 'mac-cal-today' : ''}>{c.day}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mac-desktop-icons" aria-label="Lối tắt trên màn hình">
        {quick.map((q) => {
          const Icon = q.icon;
          return (
            <button key={q.path} type="button" className="mac-desktop-icon" onClick={() => onOpen(q.path)}>
              <span className="mac-dock-icon" style={{ background: q.color }}>
                <Icon />
              </span>
              <span>{q.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
