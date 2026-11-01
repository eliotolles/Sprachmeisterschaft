import React from 'react';
import { BookOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = BookOpen,
  title = 'Chưa có dữ liệu',
  description = 'Bắt đầu hành động đầu tiên để lưu lại tiến trình học tập của bạn.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`surface p-8 md:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 text-accent">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-1">
        {title}
      </h3>
      <p className="font-body text-sm text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="tap px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium rounded-sm border border-accent/40 shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
