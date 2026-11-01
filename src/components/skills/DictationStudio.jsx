import React, { useState } from 'react';
import { db } from '@/lib/db';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { StudioResult } from '@/components/ui/StudioResult';
import { speechMatchScore } from '@/lib/algorithms';
import { auditDictationSentence } from '@/lib/ai-evaluator';
import { SKILL_POOLS } from '@/data/skills';
import {
  Volume2,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export function DictationStudio({ onBack }) {
  const pool = SKILL_POOLS.dictation || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [resultScore, setResultScore] = useState(0);
  const [auditInfo, setAuditInfo] = useState(null);
  const [sessionScores, setSessionScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentItem = pool[currentIndex] || pool[0];

  const handleCheck = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const score = speechMatchScore(currentItem.de, userInput.trim());
    const audit = auditDictationSentence({
      target: currentItem.de,
      user: userInput.trim(),
    });

    setResultScore(score);
    setAuditInfo(audit);
    setChecked(true);
    setSessionScores((prev) => [...prev, score]);

    // Record activity
    db.studyLogs.recordActivity({ xp: Math.round(score / 10), minutes: 1 });
  };

  const handleNext = () => {
    setUserInput('');
    setAuditInfo(null);
    setChecked(false);
    if (currentIndex + 1 < pool.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const avg = Math.round(
        [...sessionScores, resultScore].reduce((a, b) => a + b, 0) / pool.length
      );
      // Save SkillSession
      db.skillSessions.create({
        skill: 'listening',
        score: avg,
        title: 'Luyện nghe chính tả (Diktat)',
        details: `Đã hoàn thành ${pool.length} câu nghe chính tả với độ chính xác ${avg}%.`,
        duration_seconds: pool.length * 60,
      });
      setIsFinished(true);
      toast.success(`Hoàn thành xưởng Hören! Điểm trung bình: ${avg}%`);
    }
  };

  if (isFinished) {
    const avg = Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length);
    return (
      <StudioResult
        title="Kết quả Xưởng Nghe chính tả (Diktat)"
        score={avg}
        passed={avg >= 60}
        badgeText="Hören / Diktat"
        summary={`Bạn đã hoàn thành ${pool.length} câu chính tả với độ chuẩn xác trung bình ${avg}%.`}
        onRetry={() => {
          setCurrentIndex(0);
          setUserInput('');
          setAuditInfo(null);
          setChecked(false);
          setSessionScores([]);
          setIsFinished(false);
        }}
        onNext={onBack}
        nextLabel="Quay lại danh sách xưởng"
      />
    );
  }

  return (
    <div className="surface p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-rise">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="eyebrow">Hören • Diktat câu {currentIndex + 1} / {pool.length}</div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-accent/10 text-accent font-semibold">
          Trình độ {currentItem.level}
        </span>
      </div>

      <div className="text-center py-5 space-y-3">
        <p className="font-body text-xs text-muted-foreground">
          Bấm nút phát âm để nghe câu chuẩn tiếng Đức (de-DE), sau đó gõ lại chính xác từng từ:
        </p>
        <div className="flex justify-center">
          <SpeakButton text={currentItem.de} size="lg" />
        </div>
      </div>

      {!checked ? (
        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Gõ lại câu tiếng Đức bạn nghe được:
            </label>
            <textarea
              rows={3}
              required
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Gõ những gì bạn vừa nghe được vào đây..."
              className="w-full p-3 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-heading"
            />
          </div>
          <button
            type="submit"
            className="tap w-full py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm"
          >
            Kiểm tra & Đối chiếu chi tiết
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-rise">
          {/* Detailed Audit Container */}
          <div className="p-4 rounded-sm border border-border bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-muted-foreground">Độ chính xác âm học:</span>
                <div className="font-display font-bold text-2xl text-accent">{resultScore}%</div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-sm text-xs font-mono font-bold ${
                  resultScore >= 80
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {resultScore >= 80 ? 'Sehr gut' : 'Cần rèn thêm'}
              </span>
            </div>

            {/* Sentence comparison */}
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <div className="p-2.5 rounded bg-card border border-border">
                <span className="font-mono text-[10px] text-muted-foreground block">Bạn đã gõ:</span>
                <span className="font-heading text-sm text-foreground">{userInput}</span>
              </div>
              <div className="p-2.5 rounded bg-card border border-border">
                <span className="font-mono text-[10px] text-accent font-bold block">Đáp án nguồn chính thức:</span>
                <span className="font-heading text-sm font-semibold text-foreground">{currentItem.de}</span>
              </div>
              <div className="text-muted-foreground font-body italic text-xs pt-0.5">
                → Nghĩa tiếng Việt: {currentItem.vi}
              </div>
            </div>

            {/* Word-by-word Breakdown (Principle 7) */}
            {auditInfo && (
              <div className="space-y-2 pt-2 border-t border-border text-xs">
                <div className="font-mono text-[11px] font-bold text-foreground">
                  Phân tích đối chiếu từng từ:
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-muted/30 border border-border">
                    <span className="text-muted-foreground block">Từ nghe nhầm / viết sai:</span>
                    <strong className="text-rose-600">
                      {auditInfo.stats.misheardCount} từ
                    </strong>
                    {auditInfo.misheardWords.length > 0 && (
                      <div className="text-[10px] mt-1 space-y-0.5">
                        {auditInfo.misheardWords.map((w, i) => (
                          <div key={i}>
                            <span className="line-through text-rose-500">"{w.actual}"</span> →{' '}
                            <span className="text-emerald-600 font-bold">"{w.expected}"</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded bg-muted/30 border border-border">
                    <span className="text-muted-foreground block">Lỗi viết hoa danh từ:</span>
                    <strong className="text-amber-600">
                      {auditInfo.stats.capitalizationCount} từ
                    </strong>
                    {auditInfo.capitalizationErrors.length > 0 && (
                      <div className="text-[10px] mt-1 space-y-0.5">
                        {auditInfo.capitalizationErrors.map((c, i) => (
                          <div key={i}>
                            <span className="text-amber-600 font-bold">"{c.actual}"</span> → Viết đúng:{' '}
                            <span className="text-emerald-600 font-bold">"{c.expected}"</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acoustic tip */}
                <div className="p-2.5 rounded bg-accent/5 border border-accent/20 text-xs font-body text-accent">
                  <strong>💡 Mẹo âm thanh & Nhận dạng: </strong>
                  <span>{auditInfo.acousticTip}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            className="tap w-full py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2"
          >
            <span>{currentIndex + 1 < pool.length ? 'Tiếp tục câu sau' : 'Xem tổng kết kết quả'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default DictationStudio;
