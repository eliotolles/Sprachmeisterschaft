import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import {progressCoreActive} from '@/lib/elio-progress-runtime';
import {useCoreProgress} from '@/lib/use-core-progress';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { computeReadiness } from '@/lib/algorithms';
import { vocabTargetFor } from '@/data/levels';
import { examAdvice } from '@/lib/elio-ai';
import {
  Gauge,
  BookMarked,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';

export function ReadinessPage() {
  const coreActive=progressCoreActive();
  const [profile] = useState(() => db.learnerProfile.get());
  const [cards, setCards] = useState(() => coreActive?(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]):db.vocabulary.findMany());
  const [sessions, setSessions] = useState(() => coreActive?[]:db.skillSessions.findMany());
  const [exams, setExams] = useState(() => coreActive?[]:db.examResults.findMany());

  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useCoreProgress(db,{cards:setCards,sessions:setSessions,exams:setExams});

  useEffect(() => {
    const handleDbChange = () => {
      if(progressCoreActive()){setCards(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]);return;}
      setCards(db.vocabulary.findMany());
      setSessions(db.skillSessions.findMany());
      setExams(db.examResults.findMany());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  const targetLevel = profile.target_level || 'B1';
  const readiness = computeReadiness(cards, sessions, exams, targetLevel);

  const handleGetAiAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const advice = await examAdvice({
        results: exams,
        weakSkills: readiness.skills.weakestSkill ? [readiness.skills.weakestSkill] : ['listening'],
        level: targetLevel,
      });
      setAiAdvice(advice);
      toast.success('AI ELIO đã phân tích xong chỉ số sẵn sàng!');
    } catch (e) {
      toast.error('Lỗi khi tải phân tích AI.');
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="CHỈ SỐ SẴN SÀNG THI"
        title="Đo lường độ sẵn sàng"
        deTitle="Prüfungsreife"
        subtitle={`Đánh giá khách quan năng lực ngôn ngữ theo chuẩn kỳ thi quốc tế trình độ ${targetLevel}.`}
      />

      {/* Main Readiness Ring & 3 Component Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Readiness Ring Card */}
        <div className="surface p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="eyebrow">CHỈ SỐ TỔNG HỢP</div>
          <ProgressRing progress={readiness.total} size={160} strokeWidth={12} label="Sẵn sàng" sublabel={targetLevel} />
          <div>
            <div className="font-display font-bold text-xl text-foreground">
              {readiness.total >= 75
                ? 'Đã sẵn sàng thi xuất sắc!'
                : readiness.total >= 60
                ? 'Đủ điều kiện đỗ kỳ thi'
                : 'Cần bổ sung kiến thức thêm'}
            </div>
            <p className="font-body text-xs text-muted-foreground mt-1 max-w-xs">
              Công thức CEFR: Vốn từ (30%) + 7 Kỹ năng (40%) + Đề thi thực tế (30%).
            </p>
          </div>
        </div>

        {/* 3 Component Breakdown */}
        <div className="surface p-6 lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="eyebrow">3 TRỤ CỘT ĐÁNH GIÁ NĂNG LỰC</div>

          <div className="space-y-5">
            {/* Component 1: Vocab */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4 text-accent" />
                  Trụ cột 1: Vốn từ vựng SRS ({readiness.vocab.score}%)
                </span>
                <span className="text-muted-foreground">
                  {readiness.vocab.learned} đã học / Mục tiêu {readiness.vocab.target} từ ({targetLevel})
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500"
                  style={{ width: `${readiness.vocab.score}%` }}
                />
              </div>
              <p className="text-[11px] font-body text-muted-foreground">
                Gồm {readiness.vocab.mastered} từ đã thuộc vững (chu kỳ ≥ 21 ngày).
              </p>
            </div>

            {/* Component 2: Skills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Trụ cột 2: 7 Phòng kỹ năng ({readiness.skills.score}%)
                </span>
                <span className="text-muted-foreground">
                  Đã luyện {readiness.skills.practicedCount}/7 kỹ năng
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500"
                  style={{ width: `${readiness.skills.score}%` }}
                />
              </div>
              <p className="text-[11px] font-body text-muted-foreground">
                Tính theo trung bình điểm lần luyện gần nhất nhân với hệ số đa dạng kỹ năng.
              </p>
            </div>

            {/* Component 3: Exams */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-accent" />
                  Trụ cột 3: Kết quả làm đề thi ({readiness.exams.score}%)
                </span>
                <span className="text-muted-foreground">
                  Đã làm {readiness.exams.takenCount} lượt đề thi
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500"
                  style={{ width: `${readiness.exams.score}%` }}
                />
              </div>
              <p className="text-[11px] font-body text-muted-foreground">
                Dựa trên điểm trung bình của tối đa 3 đề thi gần đây nhất.
              </p>
            </div>
          </div>

          {/* Weakest skill alert */}
          {readiness.skills.weakestSkill && (
            <div className="p-3 rounded-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Kỹ năng đang cần bồi dưỡng thêm: <strong>{readiness.skills.weakestSkill.toUpperCase()}</strong>. Hãy dành 15 phút luyện tập phòng này hôm nay.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Advice Section */}
      <div className="surface p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="eyebrow mb-0.5">LỜI KHUYÊN CHIẾN LƯỢC TỪ AI ELIO</div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Phân tích & Hành động tuần
              </h3>
            </div>
          </div>

          <button
            onClick={handleGetAiAdvice}
            disabled={loadingAdvice}
            className="tap px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm inline-flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loadingAdvice ? 'Đang phân tích...' : 'Lấy phân tích AI mới nhất'}</span>
          </button>
        </div>

        {aiAdvice ? (
          <div className="space-y-4 pt-2 border-t border-border animate-rise">
            <div className="p-4 rounded-sm bg-muted/20 border border-border font-body text-sm leading-relaxed text-foreground">
              {aiAdvice.advice}
            </div>

            <div className="space-y-2">
              <div className="font-heading font-semibold text-xs text-accent">
                3 Hành động trọng tâm trong 7 ngày tới:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiAdvice.actions.map((act, idx) => (
                  <div key={idx} className="p-3 rounded-sm border border-border bg-card text-xs space-y-1">
                    <div className="font-mono text-accent font-bold">Bước {idx + 1}</div>
                    <div className="font-body text-muted-foreground">{act}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="font-body text-xs text-muted-foreground pt-2 border-t border-border">
            Bấm nút phía trên để gia sư AI ELIO tổng hợp dữ liệu học tập của bạn và xuất bản lộ trình khắc phục điểm yếu phù hợp nhất cho kỳ thi {targetLevel}.
          </p>
        )}
      </div>
    </div>
  );
}
