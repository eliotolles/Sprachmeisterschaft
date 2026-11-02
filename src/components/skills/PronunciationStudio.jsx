import React, { useState } from 'react';
import { db } from '@/lib/db';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { StudioResult } from '@/components/ui/StudioResult';
import { speechMatchScore } from '@/lib/algorithms';
import { SKILL_POOLS } from '@/data/skills';
import { Volume2, Mic, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function PronunciationStudio({ onBack }) {
  const words = SKILL_POOLS.pronunciation_words || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  if (words.length === 0) {
    return (
      <div className="surface p-8 max-w-xl mx-auto text-center space-y-4 rounded-sm border border-border animate-rise">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto">
          <Volume2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Chưa có từ luyện phát âm mẫu
          </h3>
          <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
            Dữ liệu mẫu đã được xóa sạch. Hãy import bộ từ vựng vào hệ thống để bắt đầu luyện phát âm.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={onBack}
            className="tap px-4 py-2 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted"
          >
            ← Quay lại kỹ năng
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex] || words[0];

  const handleRecord = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info('Trình duyệt không hỗ trợ Web SpeechRecognition. Đang mô phỏng chấm phát âm...');
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const match = Math.floor(Math.random() * 15) + 85;
        setScores((prev) => ({ ...prev, [currentIndex]: match }));
        db.studyLogs.recordActivity({ xp: 5, minutes: 1 });
      }, 1500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const match = speechMatchScore(currentWord.word, transcript);
        setScores((prev) => ({ ...prev, [currentIndex]: match }));
        db.studyLogs.recordActivity({ xp: Math.round(match / 15), minutes: 1 });
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast.error('Lỗi thu âm. Vui lòng kiểm tra micro.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
      console.error(e);
    }
  };

  const handleFinish = () => {
    const scoreVals = Object.values(scores);
    const avg = scoreVals.length > 0 ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : 85;

    db.skillSessions.create({
      skill: 'pronunciation',
      score: avg,
      title: 'Xưởng luyện phát âm âm khó',
      details: `Luyện phát âm ${words.length} từ khó tiếng Đức. Điểm trung bình: ${avg}%.`,
      duration_seconds: words.length * 45,
    });

    setIsFinished(true);
    toast.success(`Hoàn thành xưởng Phát âm! Điểm trung bình: ${avg}%`);
  };

  if (isFinished) {
    const scoreVals = Object.values(scores);
    const avg = scoreVals.length > 0 ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : 85;

    return (
      <StudioResult
        title="Kết quả Xưởng Phát âm (Aussprache)"
        score={avg}
        passed={avg >= 60}
        badgeText="Aussprache Studio"
        summary={`Bạn đã hoàn thành bài luyện phát âm cho các âm đặc thù tiếng Đức (ch, ö, ü, z, sp, st). Điểm chuẩn xác ngữ âm: ${avg}%.`}
        onRetry={() => {
          setCurrentIndex(0);
          setScores({});
          setIsFinished(false);
        }}
        onNext={onBack}
        nextLabel="Quay lại danh sách xưởng"
      />
    );
  }

  const currentScore = scores[currentIndex];

  return (
    <div className="surface p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-rise">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="eyebrow">Aussprache • Từ {currentIndex + 1} / {words.length}</div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-accent/10 text-accent font-semibold">
          {currentWord.level}
        </span>
      </div>

      <div className="p-6 rounded-sm border border-border bg-card/60 text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <span className="font-heading font-bold text-3xl md:text-4xl text-foreground">
            {currentWord.word}
          </span>
          <SpeakButton text={currentWord.word} size="lg" />
        </div>

        <div className="text-xs font-mono text-accent font-semibold">
          Phiên âm quốc tế: {currentWord.ipa}
        </div>

        <div className="text-sm font-display text-muted-foreground">
          Nghĩa: {currentWord.meaning}
        </div>

        {currentWord.tip && (
          <div className="p-3 rounded-sm bg-accent/5 border border-accent/20 text-xs font-body text-foreground max-w-md mx-auto text-left">
            💡 <strong>Mẹo đặt khẩu hình miệng:</strong> {currentWord.tip}
          </div>
        )}
      </div>

      {/* Record button */}
      <div className="text-center space-y-2">
        <button
          onClick={handleRecord}
          disabled={isRecording}
          className={`tap w-16 h-16 rounded-full border flex items-center justify-center mx-auto transition-all ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse border-rose-600'
              : 'bg-accent text-accent-foreground border-accent shadow-md hover:scale-105'
          }`}
        >
          <Mic className="w-7 h-7" />
        </button>
        <p className="text-xs font-mono text-muted-foreground">
          {isRecording ? 'Đang nghe... Hãy phát âm to và rõ ràng!' : 'Nhấn để thu âm giọng đọc của bạn'}
        </p>
      </div>

      {currentScore !== undefined && (
        <div className="p-4 rounded-sm border border-border bg-card/80 space-y-2 animate-rise">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">Độ chính xác ngữ âm:</span>
            <span className="font-display font-bold text-xl text-accent">{currentScore}%</span>
          </div>
          <div className="w-full bg-border h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                currentScore >= 80 ? 'bg-emerald-500' : currentScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${currentScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation between words */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card disabled:opacity-40"
        >
          ← Từ trước
        </button>

        {currentIndex + 1 < words.length ? (
          <button
            type="button"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="tap px-4 py-1.5 text-xs font-mono bg-accent text-accent-foreground font-semibold rounded-sm"
          >
            Từ tiếp theo →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="tap px-4 py-1.5 text-xs font-mono bg-accent text-accent-foreground font-semibold rounded-sm shadow-sm"
          >
            Hoàn thành xưởng phát âm ✓
          </button>
        )}
      </div>
    </div>
  );
}
