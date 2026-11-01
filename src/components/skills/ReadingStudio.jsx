import React, { useState } from 'react';
import { db } from '@/lib/db';
import { StudioResult } from '@/components/ui/StudioResult';
import { ALL_EXAMS } from '@/data/all-exams';
import { CheckCircle2, XCircle, ArrowRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export function ReadingStudio({ onBack }) {
  // Grab reading passages from the exam collection
  const exam = ALL_EXAMS[0]; // Goethe B1 M1
  const passage = exam.reading[0];

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelectOption = (qIdx, opt) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: opt }));
  };

  const handleSubmit = () => {
    let correct = 0;
    passage.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correct++;
    });

    const finalScore = Math.round((correct / passage.questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);

    db.skillSessions.create({
      skill: 'reading',
      score: finalScore,
      title: `Đọc hiểu Lesesaal — ${passage.title.slice(0, 30)}`,
      details: `Đúng ${correct}/${passage.questions.length} câu hỏi.`,
      duration_seconds: 300,
    });

    db.studyLogs.recordActivity({
      xp: Math.round(finalScore / 5),
      minutes: 5,
    });

    toast.success(`Hoàn thành bài đọc! Đạt ${finalScore}%`);
  };

  return (
    <div className="surface p-6 md:p-8 max-w-3xl mx-auto space-y-6 animate-rise">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="eyebrow">Lesesaal • Xưởng đọc hiểu</div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-accent/10 text-accent font-semibold">
          Trình độ B1
        </span>
      </div>

      <h2 className="font-display text-2xl font-bold text-foreground">
        {passage.title}
      </h2>

      {/* Reading Passage */}
      <div className="p-4 md:p-6 rounded-sm bg-muted/20 border border-border font-body text-sm leading-relaxed text-foreground/90 space-y-2">
        <p>{passage.text}</p>
      </div>

      {/* Questions */}
      <div className="space-y-6 pt-4">
        {passage.questions.map((q, idx) => {
          const isChosen = selectedAnswers[idx];
          const isCorrect = isChosen === q.answer;

          return (
            <div key={idx} className="space-y-2">
              <div className="font-heading font-semibold text-sm text-foreground">
                {idx + 1}. {q.q}
              </div>

              <div className="space-y-1.5">
                {q.options.map((opt) => {
                  const selected = selectedAnswers[idx] === opt;
                  let optStyle = 'border-border bg-card text-foreground hover:bg-muted/40';

                  if (submitted) {
                    if (opt === q.answer) {
                      optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
                    } else if (selected && !isCorrect) {
                      optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200';
                    }
                  } else if (selected) {
                    optStyle = 'border-accent bg-accent/10 text-accent font-medium';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(idx, opt)}
                      className={`tap w-full p-2.5 text-left text-xs rounded-sm border transition-colors flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && opt === q.answer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {submitted && selected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action / Result */}
      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={Object.keys(selectedAnswers).length < passage.questions.length}
          className="tap w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm"
        >
          Nộp bài chấm điểm
        </button>
      ) : (
        <div className="p-4 rounded-sm border border-accent/30 bg-accent/5 text-center space-y-3">
          <div className="font-display text-2xl font-bold text-accent">
            Kết quả: {score}%
          </div>
          <p className="font-body text-xs text-muted-foreground">
            {score >= 60 ? 'Xuất sắc! Bạn đã vượt qua bài đọc hiểu.' : 'Hãy đọc lại văn bản kỹ hơn để tìm từ khóa.'}
          </p>
          <button
            onClick={onBack}
            className="tap px-6 py-2 bg-accent text-accent-foreground text-xs font-mono font-medium rounded-sm"
          >
            Quay lại danh sách kỹ năng
          </button>
        </div>
      )}
    </div>
  );
}
