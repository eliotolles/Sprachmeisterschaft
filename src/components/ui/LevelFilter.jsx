import React from 'react';
import { LEVEL_IDS } from '@/data/levels';

export function LevelFilter({ selectedLevel, onSelectLevel, includeAll = false, className = '' }) {
  const levels = includeAll ? ['ALL', ...LEVEL_IDS] : LEVEL_IDS;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {levels.map((lvl) => {
        const isSelected = selectedLevel === lvl;
        return (
          <button
            key={lvl}
            type="button"
            onClick={() => onSelectLevel(lvl)}
            className={`tap px-2.5 py-1 text-xs font-mono font-medium rounded-sm border transition-all ${
              isSelected
                ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
            }`}
          >
            {lvl === 'ALL' ? 'Tất cả' : lvl}
          </button>
        );
      })}
    </div>
  );
}
