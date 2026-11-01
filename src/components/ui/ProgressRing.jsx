import React from 'react';

export function ProgressRing({ progress = 0, size = 110, strokeWidth = 9, label, sublabel, color = 'text-accent' }) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track */}
        <circle
          className="text-border"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress */}
        <circle
          className={`${color} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display font-bold text-xl md:text-2xl text-foreground leading-none">
          {safeProgress}%
        </span>
        {label && <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>}
        {sublabel && <span className="text-[9px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}
