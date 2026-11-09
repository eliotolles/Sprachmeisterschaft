import React from 'react';
import { useRouter } from '@/lib/router';
import { EXAM_CATEGORIES, examCategory } from '@/lib/exam-categories';
import { Award, ChevronDown } from 'lucide-react';

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

export function ExamCategoryNav({ value, onChange, showLabel = true, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showLabel && (
        <label className="text-xs font-mono text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
          <Award className="w-3.5 h-3.5 text-accent" />
          <span>Kỳ thi:</span>
        </label>
      )}
      <div className="relative inline-block">
        <select
          aria-label="Kỳ thi & Mục tiêu chứng chỉ"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none pl-2.5 pr-7 py-1 text-xs font-mono font-semibold rounded-md border border-border bg-card text-foreground hover:border-accent/40 focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer shadow-2xs transition-colors"
        >
          {EXAM_CATEGORIES.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
