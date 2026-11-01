import React from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export function StudioResult({
  title,
  score,
  maxScore = 100,
  passed,
  badgeText,
  summary,
  details,
  onRetry,
  onNext,
  nextLabel = 'Tiếp tục luyện tập',
  className = '',
}) {
  React.useEffect(() => {
    if (passed || score >= 60) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#7f1d1d', '#991b1b', '#d97706', '#15803d'],
        });
      } catch (e) {}
    }
  }, [passed, score]);

  const isSuccess = passed ?? (score >= 60);

  return (
    <div className={`surface p-6 md:p-8 max-w-xl mx-auto my-6 text-center animate-rise ${className}`}>
      <div className="flex justify-center mb-3">
        {isSuccess ? (
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300">
            <XCircle className="w-8 h-8" />
          </div>
        )}
      </div>

      <div className="eyebrow mb-1">
        {badgeText || (isSuccess ? 'Bestanden / Đạt yêu cầu' : 'Noch nicht bestanden / Chưa đạt')}
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
        {title}
      </h2>

      <div className="my-4 inline-flex items-baseline gap-1 py-1 px-4 rounded-sm bg-accent/5 border border-accent/20">
        <span className="font-display text-4xl md:text-5xl font-bold text-accent">
          {score}
        </span>
        <span className="text-sm font-mono text-muted-foreground">/{maxScore}</span>
      </div>

      {summary && (
        <p className="font-body text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          {summary}
        </p>
      )}

      {details && <div className="text-left my-6 p-4 rounded-sm bg-muted/30 border border-border">{details}</div>}

      <div className="flex items-center justify-center gap-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="tap px-4 py-2 border border-border bg-card hover:bg-muted/50 text-foreground text-sm font-medium rounded-sm inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Luyện lại
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="tap px-5 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium rounded-sm inline-flex items-center gap-2 shadow-sm border border-accent/40"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
