import React, { useCallback, useEffect, useRef, useState } from 'react';

/* Dock rule (Elio, corrected 3x): the pill is FIXED — its width/height/position
   NEVER change. Only the icons scale, via transform: scale() anchored at the
   bottom edge. Base box 44px, gap 14px, pitch 58px. Max scale 1.5x under the
   cursor, cos^2 falloff over exactly one pitch, so icons can NEVER overlap
   (1.5x adds 11px per side < 14px gap). Scale is smoothed every animation
   frame (rAF + lerp), never set raw from mousemove. */

const PITCH = 58;
const MAX_SCALE = 1.5;

function targetScaleFor(distance) {
  if (distance >= PITCH) return 1;
  // cos^2 falloff: 1.5 at the cursor, 1.0 exactly one pitch away.
  const c = Math.cos((distance / PITCH) * (Math.PI / 2));
  return 1 + (MAX_SCALE - 1) * c * c;
}

export function MacDock({ items, currentPath, onSelect, windowOpen }) {
  const dockRef = useRef(null);
  const iconRefs = useRef([]);
  const centersRef = useRef([]);
  const scalesRef = useRef([]);
  const mouseXRef = useRef(null);
  const rafRef = useRef(null);
  const [bouncing, setBouncing] = useState(null);

  const measureCenters = useCallback(() => {
    const dock = dockRef.current;
    if (!dock) return;
    centersRef.current = iconRefs.current.map((el) => {
      if (!el) return 0;
      // offsetLeft is relative to the dock (positioned), plus half the icon width.
      return el.offsetLeft + el.offsetWidth / 2;
    });
    if (scalesRef.current.length !== items.length) {
      scalesRef.current = items.map(() => 1);
    }
  }, [items]);

  useEffect(() => {
    measureCenters();
    window.addEventListener('resize', measureCenters);
    return () => window.removeEventListener('resize', measureCenters);
  }, [measureCenters]);

  const tick = useCallback(() => {
    rafRef.current = null;
    const dock = dockRef.current;
    if (!dock) return;
    const fine = window.matchMedia('(pointer: fine)').matches && window.innerWidth > 680;
    let moving = false;
    centersRef.current.forEach((center, i) => {
      const el = iconRefs.current[i];
      if (!el) return;
      const target = !fine || mouseXRef.current === null
        ? 1
        : targetScaleFor(Math.abs(mouseXRef.current - center));
      const current = scalesRef.current[i] ?? 1;
      const next = current + (target - current) * 0.22;
      const settled = Math.abs(target - next) < 0.001 ? target : next;
      scalesRef.current[i] = settled;
      el.style.setProperty('--ms', String(settled));
      if (settled !== target) moving = true;
    });
    if (moving || mouseXRef.current !== null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const kick = useCallback(() => {
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = (e) => {
    const dock = dockRef.current;
    if (!dock) return;
    const rect = dock.getBoundingClientRect();
    mouseXRef.current = e.clientX - rect.left;
    kick();
  };

  const handleMouseLeave = () => {
    mouseXRef.current = null;
    kick();
  };

  const isRunning = (item) => {
    if (!windowOpen) return false;
    if (item.path === '/') return currentPath === '/';
    return currentPath === item.path || currentPath.startsWith(item.path + '/') || currentPath.startsWith(item.path);
  };

  return (
    <div className="mac-dock-wrap" aria-label="Dock">
      <div
        ref={dockRef}
        className="mac-dock"
        role="toolbar"
        aria-label="Ứng dụng"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          const running = isRunning(item);
          return (
            <React.Fragment key={item.path}>
              {item.separatorBefore && <div className="mac-dock-sep" aria-hidden="true" />}
              <button
                type="button"
                className={`mac-dock-item${running ? ' running' : ''}${bouncing === item.path ? ' bounce' : ''}`}
                onClick={() => {
                  setBouncing(item.path);
                  onSelect(item.path);
                }}
                onAnimationEnd={() => setBouncing((b) => (b === item.path ? null : b))}
                title={item.label}
                aria-label={item.label}
                aria-current={running ? 'true' : undefined}
              >
                <span
                  ref={(el) => { iconRefs.current[i] = el; }}
                  className="mac-dock-icon"
                  style={{ background: item.color, color: item.darkIcon ? '#1c1c1e' : '#fff' }}
                >
                  <Icon />
                </span>
                <span className="mac-dock-dot" aria-hidden="true" />
                <span className="mac-dock-tip" aria-hidden="true">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default MacDock;
