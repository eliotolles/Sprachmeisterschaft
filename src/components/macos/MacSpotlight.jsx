import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar, RotateCw, BookMarked, Layers, Library, BookOpen, MessagesSquare,
  Briefcase, Sparkles, Headphones, User, Gamepad2, FileCheck2, Gauge,
  GraduationCap, Bot, TrendingUp, UserCheck, Settings, NotebookPen, Compass,
  Archive, ShieldCheck, Home, Search,
} from 'lucide-react';

/* Spotlight — Cmd+K / Ctrl+K command palette. Searches every route of the
   real app (diacritics-insensitive), arrow keys + Enter to open. */

const ROUTES = [
  { label: 'Hôm nay', path: '/', icon: Calendar, keywords: 'home trang chu today' },
  { label: 'Ôn thẻ', path: '/review', icon: RotateCw, keywords: 'on the flashcard leitner' },
  { label: 'Từ vựng', path: '/vocabulary', icon: BookMarked, keywords: 'tu vung wortschatz vocabulary' },
  { label: 'Cấp độ từ vựng', path: '/vocabulary/levels', icon: Layers, keywords: 'cap do level' },
  { label: 'Thư viện từ vựng', path: '/vocabulary/library', icon: Library, keywords: 'thu vien library' },
  { label: 'Từ điển', path: '/vocabulary/dictionary', icon: BookOpen, keywords: 'tu dien dictionary' },
  { label: 'Tình huống giao tiếp', path: '/vocabulary/situations', icon: MessagesSquare, keywords: 'tinh huong giao tiep situation' },
  { label: 'Từ vựng chuyên ngành', path: '/vocabulary/specialties', icon: Briefcase, keywords: 'chuyen nganh beruf' },
  { label: 'Kỹ năng', path: '/skills', icon: Sparkles, keywords: 'ky nang skill' },
  { label: 'Luyện nghe', path: '/skills/listening', icon: Headphones, keywords: 'luyen nghe listening horen' },
  { label: 'Video cá nhân', path: '/skills/listening/personal', icon: User, keywords: 'video ca nhan personal' },
  { label: 'Trò chơi', path: '/game', icon: Gamepad2, keywords: 'tro choi game' },
  { label: 'Luyện thi', path: '/exams', icon: FileCheck2, keywords: 'luyen thi exam prufung' },
  { label: 'Sẵn sàng thi', path: '/readiness', icon: Gauge, keywords: 'san sang thi readiness' },
  { label: 'Lộ trình B2', path: '/b2', icon: GraduationCap, keywords: 'lo trinh b2 telc plan roadmap' },
  { label: 'AI ELIO', path: '/elio', icon: Bot, keywords: 'ai elio chat tro ly' },
  { label: 'Tiến độ', path: '/progress', icon: TrendingUp, keywords: 'tien do progress statistik' },
  { label: 'Meine Seiten', path: '/me', icon: UserCheck, keywords: 'meine seiten toi ca nhan' },
  { label: 'Cài đặt', path: '/me/settings', icon: Settings, keywords: 'cai dat settings' },
  { label: 'Ghi chú', path: '/me/notes', icon: NotebookPen, keywords: 'ghi chu notes' },
  { label: 'Học & khám phá', path: '/explore', icon: Compass, keywords: 'hoc kham pha explore' },
  { label: 'Các bộ học', path: '/collections/all', icon: Archive, keywords: 'cac bo hoc collections' },
  { label: 'Quản trị viên', path: '/admin', icon: ShieldCheck, keywords: 'quan tri vien admin' },
  { label: 'Trang bìa', path: '/landing', icon: Home, keywords: 'trang bia landing' },
];

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

export function MacSpotlight({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return ROUTES;
    return ROUTES.filter((r) => norm(`${r.label} ${r.keywords} ${r.path}`).includes(q));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open ]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') {
        const r = results[active];
        if (r) { onNavigate(r.path); onClose(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, onClose, onNavigate]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <>
      <div className="mac-spotlight-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mac-spotlight mac-glass-strong" role="dialog" aria-modal="true" aria-label="Tìm kiếm Spotlight">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm trong Sprachmeisterschaft…"
            aria-label="Tìm kiếm"
          />
        </div>
        <div ref={listRef} className="max-h-[46vh] overflow-y-auto px-2 pb-2">
          {results.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">Không tìm thấy mục nào cho “{query}”.</p>
          )}
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <button
                key={r.path}
                type="button"
                className="mac-spotlight-row"
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => { onNavigate(r.path); onClose(); }}
              >
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{r.label}</span>
                <span className="ml-auto text-xs opacity-60 font-mono truncate">{r.path}</span>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-border text-[11px] font-mono text-muted-foreground">
          ↑↓ để chọn · Enter để mở · Esc để đóng
        </div>
      </div>
    </>
  );
}

export default MacSpotlight;
