import React, { useState } from 'react';
import { db } from '@/lib/db';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { StudioResult } from '@/components/ui/StudioResult';
import { speechMatchScore } from '@/lib/algorithms';
import { SKILL_POOLS } from '@/data/skills';
import { Volume2, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function DictationStudio({ onBack }) {
  const pool = SKILL_POOLS.dictation || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [resultScore, setResultScore] = useState(0);
  const [sessionScores, setSessionScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentItem = pool[currentIndex] || pool[0];

  const handleCheck = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const score = speechMatchScore(currentItem.de, userInput.trim());
    setResultScore(score);
    setChecked(true);
    setSessionScores((prev) => [...prev, score]);

    // Record activity
    db.studyLogs.recordActivity({ xp: Math.round(score / 10), minutes: 1 });
  };

  const handleNext = () => {
    setUserInput('');
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
        title: 'Luyện nghe chính tả (Dictation)',
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
        title="Kết quả Xưởng Nghe chính tả"
        score={avg}
        passed={avg >= 60}
        badgeText="Hören / Dictation"
        summary={`Bạn đã hoàn thành ${pool.length} câu chính tả với độ chuẩn xác trung bình ${avg}%.`}
        onRetry={() => {
          setCurrentIndex(0);
          setUserInput('');
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
        <div className="eyebrow">Hören • Câu {currentIndex + 1} / {pool.length}</div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-accent/10 text-accent font-semibold">
          Trình độ {currentItem.level}
        </span>
      </div>

      <div className="text-center py-6 space-y-3">
        <p className="font-body text-xs text-muted-foreground">
          Nhấn nút để nghe câu tiếng Đức, sau đó gõ lại chính xác từng từ:
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
            Kiểm tra đáp án
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-rise">
          <div className="p-4 rounded-sm border border-border bg-card/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">Độ chính xác:</span>
              <span className="font-display font-bold text-xl text-accent">{resultScore}%</span>
            </div>

            <div className="text-xs space-y-1 pt-2 border-t border-border">
              <div>
                <strong className="text-muted-foreground font-mono">Bạn đã gõ: </strong>
                <span className="font-heading">{userInput}</span>
              </div>
              <div>
                <strong className="text-accent font-mono">Đáp án đúng: </strong>
                <span className="font-heading font-semibold text-foreground">{currentItem.de}</span>
              </div>
              <div className="text-muted-foreground font-body italic pt-1">
                → Dịch nghĩa: {currentItem.vi}
              </div>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="tap w-full py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm"
          >
            {currentIndex + 1 < pool.length ? 'Tiếp tục câu sau →' : 'Xem tổng kết kết quả'}
          </button>
        </div>
      )}
    </div>
  );
}
