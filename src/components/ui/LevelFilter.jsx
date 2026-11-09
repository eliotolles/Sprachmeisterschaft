import React from 'react';
import { LEVEL_IDS } from '@/data/levels';
import { Layers, ChevronDown } from 'lucide-react';

export function LevelFilter({ selectedLevel, onSelectLevel, includeAll = false, showLabel = true, className = '' }) {
  const levels = includeAll ? ['ALL', ...LEVEL_IDS] : LEVEL_IDS;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showLabel && (
        <label className="text-xs font-mono text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>Cấp độ:</span>
        </label>
      )}
      <div className="relative inline-block">
        <select
          aria-label="Lọc theo cấp độ"
          value={selectedLevel}
          onChange={(e) => onSelectLevel(e.target.value)}
          className="appearance-none pl-2.5 pr-7 py-1 text-xs font-mono font-semibold rounded-md border border-border bg-card text-foreground hover:border-accent/40 focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer shadow-2xs transition-colors"
        >
          {levels.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl === 'ALL' ? 'Tất cả cấp độ' : `Cấp độ ${lvl}`}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
