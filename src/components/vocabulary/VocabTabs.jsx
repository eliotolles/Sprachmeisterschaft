import React from 'react';
import { useRouter, Link } from '@/lib/router';
import { BookMarked, Library, Search, MessageSquare } from 'lucide-react';

export function VocabTabs() {
  const { currentPath } = useRouter();

  const tabs = [
    { path: '/vocabulary', label: 'Bộ thẻ của tôi', icon: BookMarked },
    { path: '/vocabulary/library', label: 'Thư viện 950 từ', icon: Library },
    { path: '/vocabulary/dictionary', label: 'Từ điển tra cứu', icon: Search },
    { path: '/vocabulary/situations', label: 'Tình huống giao tiếp', icon: MessageSquare },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPath === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`tap px-3.5 py-2 rounded-t-sm text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              isActive
                ? 'border-accent text-accent bg-accent/5 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
