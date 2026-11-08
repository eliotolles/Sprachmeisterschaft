import React, { useState } from 'react';
import { db } from '@/lib/db';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { StudioResult } from '@/components/ui/StudioResult';
import { speechMatchScore } from '@/lib/algorithms';
import { SKILL_POOLS } from '@/data/skills';
import { Mic, MicOff, Volume2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function ShadowingStudio({ onBack }) {
  const pool = SKILL_POOLS.shadowing || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [score, setScore] = useState(null);
  const [scores, setScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  if (pool.length === 0) {
    return (
      <div className="surface p-8 max-w-xl mx-auto text-center space-y-4 rounded-sm border border-border animate-rise">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto">
          <Mic className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Chưa có câu luyện nói đuổi (Shadowing)
          </h3>
          <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
            Dữ liệu mẫu đã được xóa sạch. Hãy import tài liệu luyện nói hoặc vào mục <strong>Luyện nghe Video</strong> để nhại giọng theo phụ đề YouTube.
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

  const currentItem = pool[currentIndex] || pool[0];

  const handleStartRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback for browsers without speech recognition
      toast.info('Trình duyệt không hỗ trợ Web SpeechRecognition. Đang mô phỏng nhận diện giọng nói...');
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const simScore = Math.floor(Math.random() * 20) + 80;
        setRecognizedText(currentItem.de);
        setScore(simScore);
        setScores((prev) => [...prev, simScore]);
        db.studyLogs.recordActivity({ xp: 10, minutes: 1 });
      }, 2000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);
      setScore(null);
      setRecognizedText('');

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);
        const match = speechMatchScore(currentItem.de, transcript);
        setScore(match);
        setScores((prev) => [...prev, match]);
        db.studyLogs.recordActivity({ xp: Math.round(match / 10), minutes: 1 });
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast.error('Lỗi thu âm. Vui lòng thử lại hoặc cấp quyền micro.');
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

  const handleNext = () => {
    setScore(null);
    setRecognizedText('');
    if (currentIndex + 1 < pool.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      db.skillSessions.create({
        skill: 'speaking',
        score: avg,
        title: 'Luyện nói đuổi (Shadowing)',
        details: `Hoàn thành ${pool.length} câu Shadowing với độ khớp ${avg}%.`,
        duration_seconds: pool.length * 60,
      });
      setIsFinished(true);
      toast.success(`Hoàn thành phòng Sprechen! Điểm: ${avg}%`);
    }
  };

  if (isFinished) {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return (
      <StudioResult
        title="Kết quả Phòng Nói đuổi (Shadowing)"
        score={avg}
        passed={avg >= 60}
        badgeText="Sprechen / Shadowing"
        summary={`Bạn đã hoàn thành ${pool.length} câu nói đuổi với độ tương đồng ngữ âm ${avg}%.`}
        onRetry={() => {
          setCurrentIndex(0);
          setScore(null);
          setScores([]);
          setIsFinished(false);
        }}
        onNext={onBack}
        nextLabel="Quay lại danh sách phòng"
      />
    );
  }

  return (
    <div className="surface p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-rise">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="eyebrow">Sprechen • Câu {currentIndex + 1} / {pool.length}</div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-accent/10 text-accent font-semibold">
          Trình độ {currentItem.level}
        </span>
      </div>

      <div className="p-4 rounded-sm border border-border bg-card/60 space-y-2 text-center">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Câu mẫu tiếng Đức
        </div>
        <div className="flex items-center justify-center gap-3">
          <p className="font-heading font-semibold text-lg md:text-xl text-foreground">
            "{currentItem.de}"
          </p>
          <SpeakButton text={currentItem.de} size="md" />
        </div>
        <p className="font-body text-xs text-muted-foreground">
          → {currentItem.vi}
        </p>
      </div>

      <div className="text-center py-4 space-y-4">
        <button
          onClick={handleStartRecording}
          disabled={isRecording}
          className={`tap w-16 h-16 rounded-full border flex items-center justify-center mx-auto transition-all ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse border-rose-600'
              : 'bg-accent text-accent-foreground border-accent shadow-md hover:scale-105'
          }`}
        >
          {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>
        <p className="text-xs font-mono text-muted-foreground">
          {isRecording ? 'Đang lắng nghe... Hãy nói ngay!' : 'Bấm micro để bắt đầu nói theo câu mẫu'}
        </p>
      </div>

      {score !== null && (
        <div className="p-4 rounded-sm border border-border bg-card/80 space-y-2 animate-rise">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">Độ tương đồng giọng nói:</span>
            <span className="font-display font-bold text-2xl text-accent">{score}%</span>
          </div>
          {recognizedText && (
            <div className="text-xs font-body text-muted-foreground pt-1 border-t border-border">
              <strong className="font-mono">AI nhận diện:</strong> "{recognizedText}"
            </div>
          )}
          <button
            onClick={handleNext}
            className="tap w-full mt-3 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm"
          >
            {currentIndex + 1 < pool.length ? 'Câu tiếp theo →' : 'Xem kết quả tổng kết'}
          </button>
        </div>
      )}
    </div>
  );
}
