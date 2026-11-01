import React from 'react';

export function GenderText({ article, german, wordType, className = '' }) {
  const art = (article || '').toLowerCase().trim();

  // Color-coded token styling
  let badgeColor = 'text-muted-foreground bg-muted/40 border-muted';
  let articleColor = 'text-muted-foreground';

  if (art === 'der') {
    badgeColor = 'text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
    articleColor = 'text-blue-700 dark:text-blue-400 font-semibold';
  } else if (art === 'die') {
    badgeColor = 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    articleColor = 'text-rose-700 dark:text-rose-400 font-semibold';
  } else if (art === 'das') {
    badgeColor = 'text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800';
    articleColor = 'text-teal-700 dark:text-teal-400 font-semibold';
  }

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      {art ? (
        <span className={`text-xs font-mono uppercase px-1 py-0.2 rounded-sm border ${badgeColor}`}>
          {art}
        </span>
      ) : wordType ? (
        <span className="text-[11px] font-mono text-muted-foreground italic">
          ({wordType})
        </span>
      ) : null}
      <span className="font-heading font-semibold text-foreground tracking-tight">
        {german}
      </span>
    </span>
  );
}
