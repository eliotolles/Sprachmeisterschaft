import React from 'react';

export function StatCard({ label, value, hint, icon: Icon, badge, className = '' }) {
  return (
    <div className={`surface p-4 flex flex-col justify-between tap ${className}`}>
      <div className="flex items-center justify-between text-muted-foreground mb-2">
        <span className="text-xs uppercase tracking-wider font-mono font-medium">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-accent/80" />}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {badge && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent font-medium">
              {badge}
            </span>
          )}
        </div>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1 font-body">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
