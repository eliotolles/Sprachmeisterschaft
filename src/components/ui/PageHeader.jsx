import React from 'react';

export function PageHeader({ eyebrow, title, deTitle, subtitle, actions, className = '' }) {
  return (
    <header className={`mb-6 ${className}`}>
      {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-[42px] font-bold tracking-tight text-foreground leading-tight">
            {title}
            {deTitle && (
              <span className="text-muted-foreground font-normal text-2xl md:text-3xl ml-3 font-display italic">
                / {deTitle}
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="font-body text-sm md:text-base text-muted-foreground mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      <div className="rule-double" />
    </header>
  );
}
