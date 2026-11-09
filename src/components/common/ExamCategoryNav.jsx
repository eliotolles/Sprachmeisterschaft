import React from 'react';
import { useRouter } from '@/lib/router';
import { EXAM_CATEGORIES, examCategory } from '@/lib/exam-categories';

export function useExamCategory(fallback = 'general') {
  const { currentPath, search, navigate } = useRouter();
  const params = new URLSearchParams(search);
  return [
    examCategory(params.get('exam')) || fallback,
    (value) => {
      params.set('exam', value);
      params.delete('level');
      navigate(currentPath + '?' + params.toString());
    },
  ];
}

export function ExamCategoryNav({ value, onChange }) {
  return (
    <nav
      aria-label="Kỳ thi"
      className="flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-none py-0.5"
    >
      {EXAM_CATEGORIES.map(([id, label]) => {
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(id)}
            className={`tap px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs ${
              isActive
                ? 'border-accent bg-accent text-accent-foreground shadow-xs font-bold'
                : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/40 hover:bg-muted/40'
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
