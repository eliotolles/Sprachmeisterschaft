import {activeCollectionId} from '@/lib/collection-types';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { StudioResult } from '@/components/ui/StudioResult';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { WORDS } from '@/data/vocabulary';
import { Gamepad2, Flame, RotateCcw, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function GamePage() {
  const { navigate } = useRouter();

  const [sourceCards,setSourceCards]=useState(()=>db.vocabulary.findMany());
  const nextQuestionTimer=useRef(null);
  useEffect(()=>{
    const refresh=()=>setSourceCards(db.vocabulary.findMany());
    window.addEventListener('sprach_db_change',refresh);
    return()=>{window.removeEventListener('sprach_db_change',refresh);if(nextQuestionTimer.current)clearTimeout(nextQuestionTimer.current);};
  },[]);
  const collectionId=activeCollectionId();
  const nounPool=useMemo(()=>{
    const cards=collectionId?sourceCards:[...WORDS,...sourceCards];
    return cards.filter(word=>['der','die','das'].includes((word.article||'').toLowerCase()));
  },[sourceCards,collectionId]);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerState, setAnswerState] = useState(null); // { chosen, correct, isCorrect }
  const [isFinished, setIsFinished] = useState(false);

  // Initialize 15 random nouns
  const initGame = useCallback(() => {
    const shuffled = [...nounPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 15);
    setQuestions(selected);
    setCurrentIndex(0);
    setTimeLeft(6);
    setCurrentCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setAnswerState(null);
    setIsFinished(false);
  },[nounPool]);

  useEffect(() => {
    initGame();
  }, [initGame]);


  const currentQ = questions[currentIndex];

  // 6-second countdown timer
  useEffect(() => {
    if (isFinished || answerState !== null || !currentQ) return;

    if (timeLeft <= 0) {
      handleAnswer('timeout');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, answerState, currentQ]);

  const handleAnswer = (articleChosen) => {
    if (answerState !== null || !currentQ) return;

    const correctArticle = currentQ.article.toLowerCase();
    const isCorrect = articleChosen === correctArticle;

    let newCombo = currentCombo;
    let newMax = maxCombo;
    let newCorrect = correctCount;

    if (isCorrect) {
      newCombo = currentCombo + 1;
      newCorrect = correctCount + 1;
      if (newCombo > newMax) newMax = newCombo;
    } else {
      newCombo = 0;
    }

    setCurrentCombo(newCombo);
    setMaxCombo(newMax);
    setCorrectCount(newCorrect);
    setAnswerState({ chosen: articleChosen, correct: correctArticle, isCorrect });

    // Move to next question after 800ms
    if(nextQuestionTimer.current)clearTimeout(nextQuestionTimer.current);
    nextQuestionTimer.current=setTimeout(() => {
      setAnswerState(null);
      setTimeLeft(6);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Game complete
        const finalScore = Math.round((newCorrect / questions.length) * 100);
        const xpEarned = newCorrect * 5;

        // Save SkillSession
        db.skillSessions.create({
          skill: 'game',
          score: finalScore,
          title: 'Trò chơi phản xạ Der/Die/Das',
          details: `Đúng ${newCorrect}/${questions.length} câu. Combo tối đa: ${newMax}.`,
          duration_seconds: 120,
        });

        // Save StudyLog
        db.studyLogs.recordActivity({
          xp: xpEarned,
          minutes: 2,
        });

        setIsFinished(true);
        toast.success(`Kết thúc lượt chơi! +${xpEarned} XP`);
      }
    }, 800);
  };

  if (nounPool.length === 0) {
    return (
      <div className="surface p-8 max-w-xl mx-auto text-center space-y-4 rounded-sm border border-border animate-rise my-8">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Chưa có danh từ nào để chơi game Der / Die / Das
          </h3>
          <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
            Toàn bộ data mẫu đã được xóa sạch. Hãy import bộ từ vựng (chứa mạo từ der/die/das) vào hệ thống để bắt đầu trò chơi phản xạ mạo từ.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => navigate('/vocabulary')}
            className="tap px-4 py-2 text-xs font-mono font-semibold rounded-sm bg-accent text-accent-foreground shadow-sm"
          >
            Đến Quản lý Từ vựng
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const finalScore = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="space-y-6 animate-rise">
        <PageHeader
          eyebrow="MINIGAME PHẢN XẠ"
          title="Kết quả Der / Die / Das"
          deTitle="Ergebnis"
          subtitle="Trò chơi phản xạ mạo từ rèn luyện trí nhớ tiềm thức."
        />
        <StudioResult
          title="Tổng kết vòng đấu 15 câu"
          score={finalScore}
          maxScore={100}
          passed={finalScore >= 60}
          badgeText={`Đúng ${correctCount}/15 câu • Combo cao nhất: ${maxCombo}x`}
          summary={`Bạn đạt độ chính xác ${finalScore}% và tích lũy được ${correctCount * 5} XP vào StudyLog hôm nay.`}
          onRetry={initGame}
          onNext={() => navigate('/')}
          nextLabel="Quay lại trang chủ"
        />
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="surface p-6 md:p-10 max-w-xl mx-auto space-y-8 animate-rise">
      {/* Game Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-accent" />
          <span className="font-heading font-bold text-base text-foreground">
            Der / Die / Das
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            ({currentIndex + 1}/15)
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Combo Badge */}
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-sm border border-amber-300 dark:border-amber-800">
            <Flame className="w-3.5 h-3.5" />
            <span>Combo: {currentCombo}x</span>
          </div>

          {/* 6-second timer */}
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-accent">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 linear ${
            timeLeft <= 2 ? 'bg-rose-500' : 'bg-accent'
          }`}
          style={{ width: `${(timeLeft / 6) * 100}%` }}
        />
      </div>

      {/* Word Showcase */}
      <div className="py-6 text-center space-y-3">
        <div className="eyebrow uppercase text-[10px] text-muted-foreground">
          {currentQ.topic} • {currentQ.level}
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="font-heading font-bold text-3xl md:text-5xl text-foreground">
            {currentQ.german}
          </span>
          <SpeakButton text={`${currentQ.article} ${currentQ.german}`} size="lg" />
        </div>
        <div className="font-display font-medium text-lg text-accent">
          {currentQ.vietnamese}
        </div>

        {answerState && (
          <div className="pt-2 animate-rise">
            {answerState.isCorrect ? (
              <span className="text-sm font-mono font-bold text-emerald-600">
                ✓ Chính xác! ({answerState.correct.toUpperCase()} {currentQ.german})
              </span>
            ) : (
              <span className="text-sm font-mono font-bold text-rose-600">
                ✗ Sai rồi! Đáp án đúng: {answerState.correct.toUpperCase()} {currentQ.german}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3 Large Action Buttons: DER / DIE / DAS */}
      <div className="grid grid-cols-3 gap-3">
        {/* DER (Blue) */}
        <button
          onClick={() => handleAnswer('der')}
          disabled={answerState !== null}
          className="tap py-4 rounded-sm border-2 border-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-200 font-display font-bold text-2xl transition-all shadow-sm active:scale-95"
        >
          der
        </button>

        {/* DIE (Red / Burgundy) */}
        <button
          onClick={() => handleAnswer('die')}
          disabled={answerState !== null}
          className="tap py-4 rounded-sm border-2 border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-900 dark:text-rose-200 font-display font-bold text-2xl transition-all shadow-sm active:scale-95"
        >
          die
        </button>

        {/* DAS (Teal / Green) */}
        <button
          onClick={() => handleAnswer('das')}
          disabled={answerState !== null}
          className="tap py-4 rounded-sm border-2 border-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-900 dark:text-teal-200 font-display font-bold text-2xl transition-all shadow-sm active:scale-95"
        >
          das
        </button>
      </div>
    </div>
  );
}
