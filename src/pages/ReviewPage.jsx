import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { GenderText } from '@/components/ui/GenderText';
import { StudioResult } from '@/components/ui/StudioResult';
import { computeSrs, formatDate } from '@/lib/algorithms';
import { Check, RotateCcw, Volume2, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function ReviewPage() {
  const { navigate } = useRouter();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const today = formatDate();
    const due = db.vocabulary.findMany({ dueToday: true });
    // If no due cards, get up to 10 newest unmastered cards for review practice
    if (due.length > 0) {
      setCards(due);
    } else {
      const allCards = db.vocabulary.findMany();
      setCards(allCards.slice(0, 15));
    }
  }, []);

  const currentCard = cards[currentIndex];

  const handleGrade = (grade) => {
    if (!currentCard) return;

    // Calculate SM-2 SRS updates
    const updates = computeSrs(currentCard, grade);
    db.vocabulary.update(currentCard.id, updates);

    const record = {
      card: currentCard,
      grade,
      nextInterval: updates.interval_days,
    };
    const nextResults = [...sessionResults, record];
    setSessionResults(nextResults);
    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session finished
      const durationSecs = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const reviewedCount = nextResults.length;
      const xpEarned = reviewedCount * 3;
      const minutesSpent = Math.max(1, Math.round(durationSecs / 60));

      // Save StudyLog
      db.studyLogs.recordActivity({
        cardsReviewed: reviewedCount,
        xp: xpEarned,
        minutes: minutesSpent,
      });

      setIsFinished(true);
      toast.success(`Hoàn thành phiên ôn tập! +${xpEarned} XP`);
    }
  };

  // Preview next intervals for buttons
  const getIntervalPreview = (card, grade) => {
    if (!card) return '';
    const temp = computeSrs(card, grade);
    if (temp.interval_days === 0) return 'Hôm nay';
    if (temp.interval_days === 1) return '1 ngày';
    return `${temp.interval_days} ngày`;
  };

  if (cards.length === 0) {
    return (
      <div className="space-y-6 animate-rise">
        <PageHeader
          eyebrow="PHIÊN ÔN TẬP SRS"
          title="Ôn thẻ từ vựng"
          deTitle="Wiederholen"
          subtitle="Áp dụng thuật toán lặp lại gián đoạn SM-2 giúp ghi nhớ từ vựng vĩnh viễn."
        />
        <EmptyState
          icon={BookOpen}
          title="Không có thẻ nào cần ôn hôm nay!"
          description="Bạn đã ôn tập hoàn tất tất cả thẻ đến hạn. Bạn có thể thêm từ vựng mới từ thư viện 950 từ hoặc luyện các kỹ năng khác."
          actionLabel="Khám phá Thư viện 950 từ"
          onAction={() => navigate('/vocabulary/library')}
        />
      </div>
    );
  }

  if (isFinished) {
    const rememberedCount = sessionResults.filter((r) => r.grade >= 2).length;
    const accuracy = Math.round((rememberedCount / sessionResults.length) * 100);

    return (
      <div className="space-y-6 animate-rise">
        <PageHeader
          eyebrow="KẾT THÚC PHIÊN ÔN"
          title="Hoàn thành phiên ôn tập!"
          deTitle="Fertig"
          subtitle="Các thẻ đã được cập nhật chu kỳ ôn tập kế tiếp vào cơ sở dữ liệu."
        />
        <StudioResult
          title="Kết quả phiên học từ vựng"
          score={accuracy}
          maxScore={100}
          passed={accuracy >= 60}
          badgeText={`Đã ôn ${sessionResults.length} thẻ từ`}
          summary={`Bạn đã nhớ tốt ${rememberedCount}/${sessionResults.length} thẻ từ trong phiên này. Thuật toán SM-2 đã tự động dời lịch những từ bạn đã nhớ sang các ngày tới.`}
          onRetry={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
            setSessionResults([]);
            setIsFinished(false);
          }}
          onNext={() => navigate('/')}
          nextLabel="Về trang chủ"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="LẶP LẠI GIÁN ĐOẠN SM-2"
        title="Ôn thẻ từ vựng"
        deTitle="Wiederholen"
        subtitle={`Thẻ ${currentIndex + 1} / ${cards.length} trong phiên ôn hôm nay.`}
      />

      {/* Progress Bar */}
      <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard Component */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="surface min-h-[300px] md:min-h-[360px] p-6 md:p-10 flex flex-col justify-between cursor-pointer select-none transition-all hover:border-accent/40 relative shadow-sm"
      >
        {/* Card Header Info */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="uppercase tracking-wider">
            {currentCard.topic} • {currentCard.level}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-sm bg-muted/60 border border-border">
            {isFlipped ? 'Mặt sau (Nghĩa & Ví dụ)' : 'Mặt trước (Bấm để lật)'}
          </span>
        </div>

        {/* Card Body */}
        <div className="my-auto py-6 text-center">
          {!isFlipped ? (
            /* Front side */
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <GenderText
                  article={currentCard.article}
                  german={currentCard.german}
                  wordType={currentCard.word_type}
                  className="text-3xl md:text-5xl font-bold"
                />
                <SpeakButton text={currentCard.german} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground font-body italic mt-2">
                (Nhấn vào thẻ hoặc phím Cách để xem nghĩa)
              </p>
            </div>
          ) : (
            /* Back side */
            <div className="space-y-4 animate-rise">
              <div className="flex items-center justify-center gap-2">
                <GenderText
                  article={currentCard.article}
                  german={currentCard.german}
                  wordType={currentCard.word_type}
                  className="text-2xl md:text-3xl font-bold"
                />
                <SpeakButton text={currentCard.german} size="md" />
              </div>

              <div className="text-2xl md:text-3xl font-display font-semibold text-accent">
                {currentCard.vietnamese}
              </div>

              {currentCard.example_de && (
                <div className="mt-4 p-3 rounded-sm bg-muted/30 border border-border max-w-lg mx-auto text-left">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-heading text-sm text-foreground italic">
                      "{currentCard.example_de}"
                    </p>
                    <SpeakButton text={currentCard.example_de} size="sm" />
                  </div>
                  {currentCard.example_vi && (
                    <p className="text-xs text-muted-foreground mt-1 font-body">
                      → {currentCard.example_vi}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Footer Hint */}
        <div className="text-center text-xs font-mono text-muted-foreground/80">
          Repetitions: {currentCard.repetitions || 0} • Interval: {currentCard.interval_days || 0}d
        </div>
      </div>

      {/* 4 SM-2 Rating Buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 animate-rise">
          {/* Grade 0: Quên */}
          <button
            onClick={() => handleGrade(0)}
            className="tap p-3 rounded-sm border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 hover:bg-rose-100 flex flex-col items-center justify-center"
          >
            <span className="font-heading font-bold text-sm">Quên</span>
            <span className="text-[11px] font-mono opacity-80">
              ({getIntervalPreview(currentCard, 0)})
            </span>
          </button>

          {/* Grade 1: Khó */}
          <button
            onClick={() => handleGrade(1)}
            className="tap p-3 rounded-sm border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex flex-col items-center justify-center"
          >
            <span className="font-heading font-bold text-sm">Khó</span>
            <span className="text-[11px] font-mono opacity-80">
              ({getIntervalPreview(currentCard, 1)})
            </span>
          </button>

          {/* Grade 2: Được */}
          <button
            onClick={() => handleGrade(2)}
            className="tap p-3 rounded-sm border border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 hover:bg-blue-100 flex flex-col items-center justify-center"
          >
            <span className="font-heading font-bold text-sm">Được</span>
            <span className="text-[11px] font-mono opacity-80">
              ({getIntervalPreview(currentCard, 2)})
            </span>
          </button>

          {/* Grade 3: Dễ */}
          <button
            onClick={() => handleGrade(3)}
            className="tap p-3 rounded-sm border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 flex flex-col items-center justify-center"
          >
            <span className="font-heading font-bold text-sm">Dễ</span>
            <span className="text-[11px] font-mono opacity-80">
              ({getIntervalPreview(currentCard, 3)})
            </span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsFlipped(true)}
          className="tap w-full py-3 bg-accent text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm"
        >
          Lật thẻ xem đáp án
        </button>
      )}
    </div>
  );
}
