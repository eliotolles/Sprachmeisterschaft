import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sprach_theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sprach_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sprach_theme', 'light');
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
      className={`tap inline-flex items-center gap-2 px-2.5 py-1.5 rounded-sm border border-border bg-card/60 hover:bg-muted/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-accent" />}
      <span>{isDark ? 'Tối' : 'Sáng'}</span>
    </button>
  );
}
