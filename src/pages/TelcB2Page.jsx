// Lộ trình telc B2 — section tích hợp native trong Sprachmeisterschaft (route /b2).
// Port từ app gốc "Học telc B2" (artifact hoc-telc-b2): 60 ngày, chẩn đoán Ngày 1,
// ngữ pháp B2 + nền B1, 600 cụm từ + 56 từ chẩn đoán, công cụ, điểm số.
// Tiến độ lưu localStorage theo người dùng (xem src/lib/telc-b2-progress.js).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { defaultTelcB2Progress, loadTelcB2Progress, saveTelcB2Progress } from '@/lib/telc-b2-progress';
import { LEITNER_INTERVALS } from '@/data/telc-b2/entries';
import { RoadmapTab } from '@/components/telc-b2/RoadmapTab';
import { DiagnosticTab } from '@/components/telc-b2/DiagnosticTab';
import { GrammarTab } from '@/components/telc-b2/GrammarTab';
import { VocabTab } from '@/components/telc-b2/VocabTab';
import { ToolkitTab } from '@/components/telc-b2/ToolkitTab';
import { ScoresTab } from '@/components/telc-b2/ScoresTab';
import { CalendarDays, ClipboardCheck, BookOpen, Layers, Wrench, BarChart3 } from 'lucide-react';

const TABS = [
  { id: 'roadmap', label: 'Lộ trình', icon: CalendarDays },
  { id: 'diagnostic', label: 'Chẩn đoán', icon: ClipboardCheck },
  { id: 'grammar', label: 'Ngữ pháp', icon: BookOpen },
  { id: 'vocab', label: 'Từ vựng', icon: Layers },
  { id: 'toolkit', label: 'Công cụ', icon: Wrench },
  { id: 'scores', label: 'Điểm số', icon: BarChart3 },
];

export function TelcB2Page() {
  const userId = useMemo(() => {
    try { return db.auth.getUser()?.id || null; } catch { return null; }
  }, []);
  const [progress, setProgress] = useState(() => loadTelcB2Progress(userId));
  const [tab, setTab] = useState('roadmap');

  useEffect(() => {
    setProgress(loadTelcB2Progress(userId));
  }, [userId]);

  const update = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(prev);
      saveTelcB2Progress(userId, next);
      return next;
    });
  }, [userId]);

  const toggleBlock = useCallback((day, blockId) => {
    update((p) => {
      const checks = [...(p.checks || [])];
      const i = checks.findIndex((c) => c.day === day && c.blockId === blockId);
      if (i >= 0) checks.splice(i, 1);
      else checks.push({ day, blockId });
      return { ...p, checks };
    });
  }, [update]);

  const completeDay = useCallback((day) => {
    update((p) => {
      const completedDays = [...new Set([...(p.completedDays || []), day])];
      return { ...p, completedDays };
    });
  }, [update]);

  const saveDiagnostic = useCallback((result) => {
    update((p) => ({ ...p, diagnostics: [...(p.diagnostics || []), result] }));
  }, [update]);

  const toggleGrammar = useCallback((topicId) => {
    update((p) => {
      const grammarLearned = [...(p.grammarLearned || [])];
      const i = grammarLearned.indexOf(topicId);
      if (i >= 0) grammarLearned.splice(i, 1);
      else grammarLearned.push(topicId);
      return { ...p, grammarLearned };
    });
  }, [update]);

  const toggleVocab = useCallback((topicId, itemIndex, mastered) => {
    update((p) => {
      const masteredList = [...(p.mastered || [])];
      const i = masteredList.findIndex((m) => m.topicId === topicId && m.itemIndex === itemIndex);
      if (mastered && i < 0) masteredList.push({ topicId, itemIndex });
      if (!mastered && i >= 0) masteredList.splice(i, 1);
      return { ...p, mastered: masteredList };
    });
  }, [update]);

  // Leitner: biết → lên hộp, giãn cách theo [1,2,4,7,14,30] ngày; chưa biết → về hộp 0, mai ôn lại.
  const reviewVocab = useCallback((topicId, itemIndex, known) => {
    update((p) => {
      const reviews = [...(p.reviews || [])];
      const i = reviews.findIndex((r) => r.topicId === topicId && r.itemIndex === itemIndex);
      const prev = i >= 0 ? reviews[i] : { topicId, itemIndex, box: 0, dueAt: new Date().toISOString() };
      const box = known ? Math.min((prev.box || 0) + 1, LEITNER_INTERVALS.length - 1) : 0;
      const dueAt = new Date(Date.now() + LEITNER_INTERVALS[box] * 86400000).toISOString();
      const next = { topicId, itemIndex, box, dueAt };
      if (i >= 0) reviews[i] = next; else reviews.push(next);
      // Đánh dấu đã thuộc khi trả lời đúng lần đầu (box >= 1).
      const masteredList = [...(p.mastered || [])];
      if (known && !masteredList.some((m) => m.topicId === topicId && m.itemIndex === itemIndex)) {
        masteredList.push({ topicId, itemIndex });
      }
      return { ...p, reviews, mastered: masteredList };
    });
  }, [update]);

  const addScore = useCallback((score) => {
    update((p) => ({ ...p, scores: [...(p.scores || []), score] }));
  }, [update]);

  const deleteScore = useCallback((id) => {
    update((p) => ({ ...p, scores: (p.scores || []).filter((s) => s.id !== id) }));
  }, [update]);

  const addError = useCallback((error) => {
    update((p) => ({ ...p, errors: [...(p.errors || []), error] }));
  }, [update]);

  const deleteError = useCallback((id) => {
    update((p) => ({ ...p, errors: (p.errors || []).filter((e) => e.id !== id) }));
  }, [update]);

  const completedDays = (progress.completedDays || []).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lộ trình telc B2"
        subtitle="60 ngày · 4 giờ/ngày — từ B1 chưa vững tới đỗ telc B2. Đề chẩn đoán Ngày 1, 600 cụm từ, ngữ pháp B2 + nền B1, khung viết & nói, bảng điểm thi thử."
        action={
          <div className="flex items-center gap-3">
            <img src="/mascot/red-panda-mini.png" alt="Pandi" className="h-12 w-12 rounded-full object-cover border border-border" />
            <span className="text-sm text-muted-foreground">Đã hoàn thành<br /><b className="text-foreground text-base">{completedDays}/60 ngày</b></span>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mục telc B2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'roadmap' && <RoadmapTab progress={progress} onToggleBlock={toggleBlock} onCompleteDay={completeDay} />}
      {tab === 'diagnostic' && <DiagnosticTab progress={progress} onSaveDiagnostic={saveDiagnostic} />}
      {tab === 'grammar' && <GrammarTab progress={progress} onToggleGrammar={toggleGrammar} />}
      {tab === 'vocab' && <VocabTab progress={progress} onToggleVocab={toggleVocab} onReviewVocab={reviewVocab} />}
      {tab === 'toolkit' && <ToolkitTab />}
      {tab === 'scores' && <ScoresTab progress={progress} onAddScore={addScore} onDeleteScore={deleteScore} onAddError={addError} onDeleteError={deleteError} />}
    </div>
  );
}

export default TelcB2Page;
