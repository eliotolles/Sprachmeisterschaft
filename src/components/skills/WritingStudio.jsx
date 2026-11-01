import React, { useState } from 'react';
import { db } from '@/lib/db';
import { gradeWriting } from '@/lib/elio-ai';
import { StudioResult } from '@/components/ui/StudioResult';
import { SKILL_POOLS } from '@/data/skills';
import { PenTool, Sparkles, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function WritingStudio({ onBack }) {
  const tasks = SKILL_POOLS.writing_tasks || [];
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(1); // Default B1 email
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const task = tasks[selectedTaskIndex] || tasks[0];
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (wordCount < 15) {
      toast.error('Bài viết cần tối thiểu 15 từ để AI chấm điểm.');
      return;
    }

    setLoading(true);
    try {
      const evaluation = await gradeWriting({
        task: task.prompt,
        text,
        level: task.level,
      });

      setResult(evaluation);

      // Save SkillSession
      db.skillSessions.create({
        skill: 'writing',
        score: evaluation.score,
        title: `Schreibwerkstatt — ${task.title}`,
        details: JSON.stringify({
          wordCount,
          taskCompletion: evaluation.criteria.taskCompletion.score,
          vocabulary: evaluation.criteria.vocabulary.score,
          grammar: evaluation.criteria.grammar.score,
          coherence: evaluation.criteria.coherence.score,
        }),
        duration_seconds: 450,
      });

      // Save StudyLog
      db.studyLogs.recordActivity({
        xp: Math.round(evaluation.score / 2),
        minutes: 8,
      });

      toast.success(`Đã hoàn tất chấm điểm: ${evaluation.score}/100!`);
    } catch (err) {
      toast.error('Không thể chấm bài lúc này. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface p-6 md:p-8 max-w-3xl mx-auto space-y-6 animate-rise">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="eyebrow">Schreibwerkstatt • Xưởng viết luận</div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-accent/10 text-accent font-semibold">
          Trình độ {task.level}
        </span>
      </div>

      {/* Task selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tasks.map((t, idx) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelectedTaskIndex(idx);
              setResult(null);
            }}
            className={`tap px-3 py-1.5 rounded-sm border text-xs font-mono whitespace-nowrap ${
              selectedTaskIndex === idx
                ? 'bg-accent text-accent-foreground border-accent font-semibold'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Prompt Card */}
      <div className="p-4 rounded-sm border border-border bg-card/60 space-y-2">
        <div className="font-heading font-semibold text-base text-foreground">
          Đề bài: {task.title}
        </div>
        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          {task.prompt}
        </p>
        {task.hints && (
          <div className="text-xs font-body text-accent/90 pt-1">
            <strong>Gợi ý dàn ý:</strong>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-muted-foreground">
              {task.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Writing Editor */}
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Bài làm của bạn:</span>
              <span className={`font-semibold ${wordCount < 40 ? 'text-amber-600' : 'text-accent'}`}>
                {wordCount} từ {wordCount < 40 ? '(Đề nghị ~80 từ)' : '✓ Đủ độ dài'}
              </span>
            </div>
            <textarea
              rows={8}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Sehr geehrte Damen und Herren, ich schreibe Ihnen, weil..."
              className="w-full p-4 text-sm font-heading rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tap w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            <span>{loading ? 'AI ELIO đang phân tích & chấm bài...' : 'Gửi bài cho AI ELIO chấm điểm'}</span>
          </button>
        </form>
      ) : (
        /* Evaluation Results */
        <div className="space-y-6 animate-rise">
          <div className="surface p-6 border-accent/30 bg-accent/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Kết quả đánh giá AI</div>
                <h3 className="font-display text-3xl font-bold text-accent">
                  {result.score} / 100 điểm
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-sm bg-accent text-accent-foreground font-semibold">
                {result.score >= 60 ? 'Bestanden (Đạt)' : 'Cần rèn thêm'}
              </span>
            </div>

            <p className="font-body text-xs text-foreground leading-relaxed">
              {result.summary}
            </p>

            {/* 4 Criteria breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              {Object.entries(result.criteria).map(([key, c]) => (
                <div key={key} className="p-2.5 rounded-sm bg-card border border-border text-xs">
                  <div className="text-muted-foreground font-mono text-[10px]">{c.label}</div>
                  <div className="font-display font-bold text-base text-foreground mt-0.5">
                    {c.score} <span className="text-[11px] font-mono text-muted-foreground">/{c.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corrections */}
          {result.corrections && result.corrections.length > 0 && (
            <div className="surface p-5 space-y-3">
              <h4 className="font-display text-lg font-bold text-foreground">
                Sửa lỗi ngữ pháp & diễn đạt chi tiết
              </h4>
              <div className="space-y-2">
                {result.corrections.map((corr, idx) => (
                  <div key={idx} className="p-3 rounded-sm border border-border bg-card text-xs space-y-1">
                    <div className="line-through text-rose-600 font-heading">
                      ✗ {corr.original}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-heading font-semibold">
                      ✓ {corr.improved}
                    </div>
                    <div className="text-muted-foreground font-body italic text-[11px]">
                      💡 {corr.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Essay */}
          {result.sample && (
            <div className="surface p-5 space-y-2 bg-muted/10">
              <div className="eyebrow">Bài mẫu chuẩn tham khảo</div>
              <h4 className="font-display text-lg font-bold text-foreground">
                Musterbrief (~80 từ)
              </h4>
              <p className="font-heading italic text-xs text-foreground/90 whitespace-pre-line leading-relaxed p-3 rounded-sm bg-card border border-border">
                {result.sample}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setResult(null)}
              className="tap flex-1 py-2.5 rounded-sm border border-border bg-card text-xs font-mono font-medium hover:bg-muted"
            >
              Viết lại bài khác
            </button>
            <button
              onClick={onBack}
              className="tap flex-1 py-2.5 bg-accent text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40"
            >
              Quay lại danh sách xưởng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
