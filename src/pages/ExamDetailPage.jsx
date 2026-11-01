import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { StudioResult } from '@/components/ui/StudioResult';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { gradeWriting } from '@/lib/elio-ai';
import { getExamById } from '@/data/all-exams';
import {
  Clock,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export function ExamDetailPage({ examId }) {
  const { navigate } = useRouter();
  const exam = getExamById(examId);

  const [activeTab, setActiveTab] = useState('reading'); // reading, listening, writing, speaking
  const [timeLeft, setTimeLeft] = useState(exam.minutes * 60);

  // Reading answers
  const [readingAnswers, setReadingAnswers] = useState({});

  // Listening answers
  const [listeningAnswers, setListeningAnswers] = useState({});

  // Writing text & AI evaluation
  const [writingText, setWritingText] = useState('');
  const [writingEvaluation, setWritingEvaluation] = useState(null);
  const [gradingWriting, setGradingWriting] = useState(false);

  // Final submission state
  const [submitted, setSubmitted] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [startTime] = useState(Date.now());

  // Timer countdown
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Multiple choice questions total calculation
  const allReadingQuestions = (exam.reading || []).flatMap((r) => r.questions || []);
  const allListeningQuestions = exam.listening || [];
  const totalMCQuestions = allReadingQuestions.length + allListeningQuestions.length;

  const handleGradeWritingNow = async () => {
    if (!writingText.trim() || writingText.trim().split(/\s+/).length < 20) {
      toast.error('Vui lòng viết tối thiểu 20 từ trước khi chấm điểm.');
      return;
    }

    setGradingWriting(true);
    try {
      const evaluation = await gradeWriting({
        task: exam.writing?.task || 'Schreiben',
        text: writingText,
        level: exam.level,
      });
      setWritingEvaluation(evaluation);
      toast.success(`AI đã chấm bài viết: ${evaluation.score}/100!`);
    } catch (e) {
      toast.error('Lỗi khi chấm bài viết.');
    } finally {
      setGradingWriting(false);
    }
  };

  const handleSubmitExam = async () => {
    if (submitted) return;

    // 1. Calculate MC score
    let correctMC = 0;
    allReadingQuestions.forEach((q, idx) => {
      if (readingAnswers[idx] === q.answer) correctMC++;
    });
    allListeningQuestions.forEach((q, idx) => {
      if (listeningAnswers[idx] === q.answer) correctMC++;
    });

    const mcPercent = totalMCQuestions > 0 ? Math.round((correctMC / totalMCQuestions) * 100) : 100;

    // 2. Writing score
    let writingScore = writingEvaluation?.score;
    if (writingScore === undefined && writingText.trim().length > 30) {
      // Auto-evaluate if not manually graded yet
      const evaluation = await gradeWriting({
        task: exam.writing?.task || '',
        text: writingText,
        level: exam.level,
      });
      writingScore = evaluation.score;
      setWritingEvaluation(evaluation);
    }

    // 3. Compute total: total = mc% * 0.7 + writing * 0.3 (or mc% if no writing)
    let totalScore = mcPercent;
    if (writingScore !== undefined) {
      totalScore = Math.round(mcPercent * 0.7 + writingScore * 0.3);
    }

    const passed = totalScore >= 60;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const savedRecord = db.examResults.create({
      exam_id: exam.id,
      provider: exam.provider,
      title: exam.title,
      level: exam.level,
      mc_score: correctMC,
      mc_total: totalMCQuestions,
      writing_score: writingScore || 0,
      total: totalScore,
      passed,
      duration_seconds: durationSeconds,
      feedback: `Đúng ${correctMC}/${totalMCQuestions} câu trắc nghiệm (${mcPercent}%). Viết: ${writingScore || 0}đ.`,
    });

    // Save StudyLog
    db.studyLogs.recordActivity({
      xp: Math.round(totalScore / 2),
      minutes: Math.max(1, Math.round(durationSeconds / 60)),
    });

    setExamResult({
      ...savedRecord,
      correctMC,
      totalMCQuestions,
      mcPercent,
      writingScore: writingScore || 0,
    });
    setSubmitted(true);
    toast.success(`Đã nộp bài! Tổng điểm: ${totalScore}/100 (${passed ? 'Bestanden' : 'Chưa đạt'})`);
  };

  if (submitted && examResult) {
    return (
      <div className="space-y-6 animate-rise">
        <PageHeader
          eyebrow={`KẾT QUẢ KỲ THI ${exam.provider.toUpperCase()} ${exam.level}`}
          title={examResult.passed ? 'Bestanden! (Đậu kỳ thi)' : 'Noch nicht bestanden (Chưa đạt)'}
          deTitle="Prüfungsergebnis"
          subtitle={`Bạn đã hoàn thành đề thi ${exam.title}. Dữ liệu đã được ghi nhận vào hồ sơ năng lực.`}
        />
        <StudioResult
          title={exam.title}
          score={examResult.total}
          maxScore={100}
          passed={examResult.passed}
          badgeText={examResult.passed ? 'Bestanden / Đạt chuẩn CEFR' : 'Noch nicht bestanden'}
          summary={`Tổng điểm: ${examResult.total}/100. Phần trắc nghiệm Đọc/Nghe: ${examResult.correctMC}/${examResult.totalMCQuestions} câu (${examResult.mcPercent}%). Phần Viết: ${examResult.writingScore}/100.`}
          onRetry={() => {
            setSubmitted(false);
            setExamResult(null);
            setReadingAnswers({});
            setListeningAnswers({});
            setWritingText('');
            setWritingEvaluation(null);
            setTimeLeft(exam.minutes * 60);
          }}
          onNext={() => navigate('/exams')}
          nextLabel="Quay lại danh sách đề thi"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise max-w-4xl mx-auto">
      {/* Top Bar with Timer and Submit */}
      <div className="surface p-4 flex items-center justify-between sticky top-14 md:top-4 z-30 shadow-md">
        <div>
          <span className="eyebrow text-[9px] uppercase">{exam.provider} • {exam.level}</span>
          <h2 className="font-display font-bold text-lg md:text-xl text-foreground truncate max-w-xs md:max-w-md">
            {exam.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-bold">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={handleSubmitExam}
            className="tap px-4 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm"
          >
            Nộp bài thi
          </button>
        </div>
      </div>

      {/* 4 Skill Tabs inside Exam */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-1">
        {[
          { id: 'reading', label: '1. Lesen (Đọc hiểu)', icon: BookOpen },
          { id: 'listening', label: '2. Hören (Nghe hiểu)', icon: Headphones },
          { id: 'writing', label: '3. Schreiben (Viết luận)', icon: PenTool },
          { id: 'speaking', label: '4. Sprechen (Thi nói)', icon: Mic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tap px-3.5 py-2 text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-accent text-accent bg-accent/5 font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Lesen */}
      {activeTab === 'reading' && (
        <div className="space-y-6 animate-rise">
          {(exam.reading || []).map((section, sIdx) => (
            <div key={sIdx} className="surface p-6 space-y-4">
              <h3 className="font-display text-xl font-bold text-foreground">
                {section.title}
              </h3>
              <div className="p-4 rounded-sm bg-muted/20 border border-border font-body text-sm leading-relaxed text-foreground">
                <p>{section.text}</p>
              </div>

              <div className="space-y-4 pt-2">
                {section.questions.map((q, qIdx) => {
                  const globalIdx = sIdx * 10 + qIdx;
                  return (
                    <div key={qIdx} className="space-y-2">
                      <div className="font-heading font-semibold text-xs text-foreground">
                        {qIdx + 1}. {q.q}
                      </div>
                      <div className="space-y-1.5">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setReadingAnswers((prev) => ({ ...prev, [globalIdx]: opt }))
                            }
                            className={`tap w-full p-2.5 text-left text-xs rounded-sm border transition-colors ${
                              readingAnswers[globalIdx] === opt
                                ? 'border-accent bg-accent/10 text-accent font-semibold'
                                : 'border-border bg-card text-foreground hover:bg-muted/40'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Hören */}
      {activeTab === 'listening' && (
        <div className="space-y-6 animate-rise">
          <div className="surface p-6 space-y-6">
            <div>
              <div className="eyebrow">HÖRVERSTEHEN</div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Phần thi Nghe hiểu
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Nhấn loa để nghe từng đoạn hội thoại hoặc thông báo công cộng, sau đó chọn đáp án đúng.
              </p>
            </div>

            <div className="space-y-6">
              {(exam.listening || []).map((item, idx) => (
                <div key={idx} className="p-4 rounded-sm border border-border bg-card/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-xs text-accent">
                      Audio thông báo số {idx + 1}
                    </span>
                    <SpeakButton text={item.script} size="md" />
                  </div>

                  <div className="font-heading font-semibold text-sm text-foreground">
                    {idx + 1}. {item.question}
                  </div>

                  <div className="space-y-1.5">
                    {item.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setListeningAnswers((prev) => ({ ...prev, [idx]: opt }))
                        }
                        className={`tap w-full p-2.5 text-left text-xs rounded-sm border transition-colors ${
                          listeningAnswers[idx] === opt
                            ? 'border-accent bg-accent/10 text-accent font-semibold'
                            : 'border-border bg-card text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Schreiben */}
      {activeTab === 'writing' && (
        <div className="space-y-6 animate-rise">
          <div className="surface p-6 space-y-4">
            <div>
              <div className="eyebrow">SCHRIFTLICHER AUSDRUCK</div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Phần thi Viết luận
              </h3>
            </div>

            <div className="p-4 rounded-sm border border-border bg-muted/20 space-y-2">
              <div className="font-heading font-semibold text-sm text-foreground">
                Đề bài:
              </div>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                {exam.writing?.task || 'Schreiben Sie eine E-Mail.'}
              </p>
              {exam.writing?.hints && (
                <div className="text-xs font-body text-accent pt-1">
                  <strong>Gợi ý các điểm cần viết:</strong>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-muted-foreground">
                    {exam.writing.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Khung bài làm:</span>
                <span className="text-accent font-semibold">
                  {writingText.trim().split(/\s+/).filter(Boolean).length} từ
                </span>
              </div>
              <textarea
                rows={9}
                value={writingText}
                onChange={(e) => setWritingText(e.target.value)}
                placeholder="Sehr geehrte Damen und Herren..."
                className="w-full p-4 text-sm font-heading rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={gradingWriting || !writingText.trim()}
                onClick={handleGradeWritingNow}
                className="tap px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm"
              >
                {gradingWriting ? 'Đang chấm bài...' : 'Chấm điểm phần viết này trước'}
              </button>
            </div>

            {writingEvaluation && (
              <div className="p-4 rounded-sm bg-accent/5 border border-accent/30 space-y-2 animate-rise">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-accent">
                    Điểm phần viết: {writingEvaluation.score}/100
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Sẽ chiếm 30% tổng điểm đề thi
                  </span>
                </div>
                <p className="text-xs font-body text-foreground">
                  {writingEvaluation.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Sprechen */}
      {activeTab === 'speaking' && (
        <div className="space-y-6 animate-rise">
          <div className="surface p-6 space-y-4">
            <div>
              <div className="eyebrow">MÜNDLICHE PRÜFUNG</div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                3 Phần thi nói mô phỏng
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Các chủ đề và câu hỏi mở thường gặp trong phòng thi thực tế.
              </p>
            </div>

            <div className="space-y-4">
              {(exam.speaking || []).map((part, pIdx) => (
                <div key={pIdx} className="p-4 rounded-sm border border-border bg-card/60 space-y-2">
                  <div className="font-heading font-semibold text-sm text-foreground">
                    {part.part}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {part.prompt}
                  </p>
                  {part.tips && (
                    <div className="text-[11px] font-mono text-accent pt-1">
                      💡 Mẹo: {part.tips.join(' • ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-sm bg-muted/20 border border-border text-xs font-body text-muted-foreground text-center">
              Để luyện tập tương tác trực tiếp với giám khảo AI ELIO từng lượt, bạn hãy vào mục <strong>Kỹ năng → Interview</strong> trên thanh điều hướng.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
