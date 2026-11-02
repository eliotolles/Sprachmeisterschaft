import React, { useState } from 'react';
import { db } from '@/lib/db';
import { evaluateWritingFull } from '@/lib/ai-evaluator';
import { SKILL_POOLS } from '@/data/skills';
import { getAllExams } from '@/data/all-exams';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  RotateCcw,
  ShieldAlert,
  Lightbulb,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export function WritingStudio({ onBack }) {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const defaultCustomTask = {
    id: 'custom_writing',
    title: 'Luyện viết theo chủ đề tùy chọn',
    level: 'B1',
    prompt: 'Nhập nội dung bài viết, email hoặc thư từ tiếng Đức bạn muốn luyện tập vào khung bên dưới. Hệ thống AI sẽ chấm điểm 4 tiêu chí CEFR và phân tích chi tiết từng lỗi sai.',
    hints: ['Diễn đạt rõ ràng, mạch lạc', 'Chú ý cấu trúc câu và vị trí động từ', 'Sử dụng Redemittel phù hợp'],
  };

  // Trích xuất toàn bộ các bài viết từ Kho đề dùng chung (Exams & Universal)
  const allExams = getAllExams();
  const examWritingTasks = allExams.flatMap((exam) => {
    let tasksList = [];
    if (Array.isArray(exam.writingTasks) && exam.writingTasks.length > 0) {
      tasksList = exam.writingTasks;
    } else if (Array.isArray(exam.writing?.tasks) && exam.writing.tasks.length > 0) {
      tasksList = exam.writing.tasks;
    } else if (exam.writing?.task) {
      tasksList = [
        {
          teil: 'Schreiben',
          title: 'Bài thi viết',
          prompt: exam.writing.task,
          hints: exam.writing.hints || [],
          wordCount: exam.level === 'B2' ? 100 : 80,
        },
      ];
    }
    return tasksList.map((t, idx) => ({
      id: `${exam.id}-schreiben-${idx}`,
      examId: exam.id,
      examTitle: exam.title,
      teil: t.teil || `Teil ${idx + 1}`,
      title: `[${exam.title}] ${t.teil || `Teil ${idx + 1}`}: ${t.title || 'Bài viết'}`,
      level: exam.level || 'B1',
      provider: exam.provider || 'Goethe',
      prompt: t.prompt,
      hints: t.hints || [],
      targetLength: t.wordCount || 80,
    }));
  });

  let universalTasks = [];
  try {
    universalTasks = db.universal.findMany({ type: 'writing' }).map((u) => ({
      id: u.id,
      title: u.title,
      level: u.level || 'B1',
      prompt: u.data?.rawText || u.title,
      hints: ['Viết câu mạch lạc', 'Đúng ngữ pháp CEFR'],
      targetLength: 80,
    }));
  } catch (e) {}

  const combinedTasks = [
    ...examWritingTasks,
    ...universalTasks,
    ...(SKILL_POOLS.writing_tasks || []),
  ];

  const tasks = combinedTasks.length > 0 ? combinedTasks : [defaultCustomTask];
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeSectionTab, setActiveSectionTab] = useState('overview'); // 'overview' | 'sentences' | 'errors' | 'rewrite' | 'model'

  const task = tasks[selectedTaskIndex] || tasks[0] || defaultCustomTask;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (wordCount < 15) {
      toast.error('Bài viết cần tối thiểu 15 từ để AI chấm điểm nghiêm túc.');
      return;
    }

    setLoading(true);
    try {
      const evaluation = await evaluateWritingFull({
        task: `${task.title}: ${task.prompt}`,
        text,
        level: task.level || 'B1',
        examProvider: 'Goethe / telc',
      });

      setResult(evaluation);

      // Score 0-20 to 100 scale
      const scaled100 = Math.round((evaluation.totalPracticeScore / 20) * 100);

      // Save SkillSession
      db.skillSessions.create({
        skill: 'writing',
        score: scaled100,
        title: `Schreibwerkstatt — ${task.title}`,
        details: JSON.stringify({
          wordCount,
          total20: evaluation.totalPracticeScore,
          criteria: evaluation.criteriaScores,
          errorCount: (evaluation.errorList || []).length,
        }),
        duration_seconds: 450,
      });

      // Save StudyLog
      db.studyLogs.recordActivity({
        xp: Math.round(scaled100 / 2),
        minutes: 8,
      });

      toast.success(`Đã hoàn tất thẩm định AI: ${evaluation.totalPracticeScore}/20 điểm (${scaled100}/100)!`);
    } catch (err) {
      console.error(err);
      toast.error('Không thể thẩm định lúc này. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface p-5 md:p-8 max-w-4xl mx-auto space-y-6 animate-rise">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div>
          <div className="eyebrow">Schreibwerkstatt • Xưởng viết luận & Thẩm định AI</div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
            Luyện Viết Chuẩn CEFR (A1 - C1)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-sm bg-accent/10 text-accent font-semibold border border-accent/20">
            Trình độ {task.level}
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-sm bg-card text-muted-foreground border border-border">
            Goethe / telc
          </span>
        </div>
      </div>

      {/* Task selector & Import action */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tasks.map((t, idx) => (
          <button
            key={t.id || idx}
            type="button"
            onClick={() => {
              setSelectedTaskIndex(idx);
              setResult(null);
            }}
            className={`tap px-3 py-1.5 rounded-sm border text-xs font-mono whitespace-nowrap transition-all ${
              selectedTaskIndex === idx
                ? 'bg-accent text-accent-foreground border-accent font-semibold shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.title}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setIsImportOpen(true)}
          className="tap px-3 py-1.5 rounded-sm border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/15 text-accent text-xs font-mono font-bold whitespace-nowrap flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Import thêm đề thi</span>
        </button>
      </div>

      {/* Task Prompt Card */}
      <div className="p-4 rounded-sm border border-border bg-card/60 space-y-2">
        <div className="font-heading font-semibold text-base text-foreground flex items-center justify-between">
          <span>Đề bài: {task.title}</span>
          <span className="text-[11px] font-mono text-accent">Yêu cầu tối thiểu ~80 từ</span>
        </div>
        <p className="font-body text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
          {task.prompt}
        </p>
        {task.hints && (
          <div className="text-xs font-body text-accent/90 pt-1 border-t border-border/60">
            <strong className="font-mono text-[11px]">Leitpunkte cần đạt (Các ý bắt buộc):</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-muted-foreground">
              {task.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Editor Form */}
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Bài làm của bạn (Tiếng Đức):</span>
              <span
                className={`font-semibold ${
                  wordCount < 40 ? 'text-amber-600' : 'text-accent'
                }`}
              >
                {wordCount} từ {wordCount < 40 ? '(Đề nghị ~80 từ)' : '✓ Đủ độ dài'}
              </span>
            </div>
            <textarea
              rows={10}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Sehr geehrte Damen und Herren, ich schreibe Ihnen, weil..."
              className="w-full p-4 text-sm font-heading rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-sm bg-muted/20 border border-border text-[11px] font-body text-muted-foreground flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <strong>Nguyên tắc chấm nghiêm ngặt:</strong> AI chấm công bằng theo 4 tiêu chí CEFR (Aufgabenerfüllung, Kohärenz, Wortschatz, Strukturen), không nâng điểm động viên, đối chiếu từng câu và bảo toàn ý định người học.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tap w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm flex items-center justify-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            <span>
              {loading
                ? 'AI đang phân tích 10 hạng mục chuyên sâu (A - J)...'
                : 'Thẩm định bài viết với AI ELIO'}
            </span>
          </button>
        </form>
      ) : (
        /* ================= 10-SECTION EVALUATION REPORT (A - J) ================= */
        <div className="space-y-6 animate-rise">
          {/* Top Score Summary Banner */}
          <div className="surface p-6 border-accent/30 bg-accent/5 rounded-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="eyebrow">Hồ sơ thẩm định bài viết CEFR</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="font-display text-4xl font-bold text-accent">
                    {result.totalPracticeScore} <span className="text-xl text-muted-foreground font-mono">/ 20</span>
                  </h3>
                  <span className="text-sm font-mono text-muted-foreground">
                    (Quy đổi: {Math.round((result.totalPracticeScore / 20) * 100)}/100)
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`px-3 py-1 rounded-sm text-xs font-mono font-bold ${
                    result.totalPracticeScore >= 12
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {result.totalPracticeScore >= 12 ? 'Bestanden (Đạt yêu cầu)' : 'Noch nicht bestanden (Chưa đạt)'}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Số từ thực tế: {result.genreCheck?.wordCount || wordCount} từ
                </span>
              </div>
            </div>

            {/* A. Nhận xét tổng quan */}
            <div className="pt-2 border-t border-border/80">
              <div className="text-[11px] font-mono font-bold text-accent uppercase mb-1">
                A. Nhận xét tổng quan
              </div>
              <p className="font-body text-xs text-foreground leading-relaxed">
                {result.generalRemarks}
              </p>
            </div>
          </div>

          {/* Sub Navigation for Report Sections */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-1">
            {[
              { id: 'overview', label: 'B & C. Dàn ý & Thể thức' },
              { id: 'rubric', label: 'D. Thang 4 Tiêu chí' },
              { id: 'sentences', label: 'E. Soát từng câu' },
              { id: 'errors', label: `F. Chi tiết lỗi (${(result.errorList || []).length})` },
              { id: 'rewrite', label: 'G & I. Bản sửa & Từ vựng' },
              { id: 'model', label: 'H & J. Bài mẫu & Kế hoạch' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSectionTab(tab.id)}
                className={`tap px-3 py-2 text-xs font-mono whitespace-nowrap rounded-t-sm border-b-2 transition-all ${
                  activeSectionTab === tab.id
                    ? 'border-accent text-accent font-bold bg-accent/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: B & C. Dàn ý & Thể thức */}
          {activeSectionTab === 'overview' && (
            <div className="space-y-4">
              {/* B. Đối chiếu từng Leitpunkt */}
              <div className="surface p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="eyebrow">B. Đối chiếu từng Leitpunkt (Nhiệm vụ đề bài)</div>
                  <span className="text-[11px] font-mono text-muted-foreground">Chuẩn CEFR</span>
                </div>
                <div className="space-y-2">
                  {(result.leitpunkte || []).map((lp, idx) => {
                    const isPassed = lp.status?.toLowerCase().includes('đạt') && !lp.status?.toLowerCase().includes('một phần');
                    const isPartial = lp.status?.toLowerCase().includes('một phần');
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-sm border border-border bg-card space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-xs text-foreground">
                            {idx + 1}. {lp.point}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : isPartial
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                            }`}
                          >
                            {lp.status}
                          </span>
                        </div>
                        <div className="text-xs font-body text-muted-foreground">
                          <strong>Bằng chứng trích từ bài:</strong> {lp.evidence || 'Chưa tìm thấy dẫn chứng rõ ràng trong bài viết.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* C. Thể loại, xưng hô, bố cục và số từ */}
              <div className="surface p-5 space-y-3">
                <div className="eyebrow">C. Thể loại, xưng hô, bố cục & số từ</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-sm border border-border bg-card">
                    <span className="font-mono text-[10px] text-muted-foreground block">Thể loại văn bản:</span>
                    <strong className="text-foreground">{result.genreCheck?.genre || 'Thư từ / Bài luận'}</strong>
                  </div>
                  <div className="p-3 rounded-sm border border-border bg-card">
                    <span className="font-mono text-[10px] text-muted-foreground block">Lời chào mở đầu (Anrede):</span>
                    <strong className="text-foreground">{result.genreCheck?.salutation || 'Đầy đủ'}</strong>
                  </div>
                  <div className="p-3 rounded-sm border border-border bg-card">
                    <span className="font-mono text-[10px] text-muted-foreground block">Lời chào kết thúc (Grußformel):</span>
                    <strong className="text-foreground">{result.genreCheck?.closing || 'Đầy đủ'}</strong>
                  </div>
                  <div className="p-3 rounded-sm border border-border bg-card">
                    <span className="font-mono text-[10px] text-muted-foreground block">Nhất quán xưng hô (du / Sie):</span>
                    <strong className="text-foreground">{result.genreCheck?.formOfAddress || 'Đạt'}</strong>
                  </div>
                  <div className="p-3 rounded-sm border border-border bg-card sm:col-span-2">
                    <span className="font-mono text-[10px] text-muted-foreground block">Đánh giá độ dài & số từ:</span>
                    <strong className="text-accent">{result.genreCheck?.wordCountAssessment || 'Đạt chuẩn độ dài yêu cầu'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: D. Thang 4 Tiêu chí 0-5 */}
          {activeSectionTab === 'rubric' && (
            <div className="surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="eyebrow">D. Thang điểm 4 tiêu chí CEFR (Mỗi tiêu chí 0 - 5 điểm)</div>
                  <h4 className="font-display text-lg font-bold text-foreground">
                    Tổng 20 điểm luyện tập chuẩn Quốc Tế
                  </h4>
                </div>
                <span className="font-mono text-xs text-accent font-bold">
                  {result.totalPracticeScore} / 20 Điểm
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(result.criteriaScores || {}).map(([key, c]) => (
                  <div
                    key={key}
                    className="p-4 rounded-sm border border-border bg-card space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-foreground">
                        {c.label || key}
                      </span>
                      <span className="font-display font-bold text-lg text-accent">
                        {c.score} <span className="text-xs font-mono text-muted-foreground">/ 5</span>
                      </span>
                    </div>

                    <div className="text-xs font-body text-muted-foreground space-y-1">
                      <div>
                        <strong className="text-foreground">Minh chứng trong bài:</strong> {c.evidence}
                      </div>
                      <div className="text-accent pt-1 border-t border-border/60">
                        <strong>Cách lên bậc điểm tiếp theo:</strong> {c.improvement}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: E. Soát từng câu */}
          {activeSectionTab === 'sentences' && (
            <div className="surface p-5 space-y-3">
              <div className="eyebrow">E. Nhận xét chi tiết từng câu (Sentence-by-sentence)</div>
              <p className="font-body text-xs text-muted-foreground">
                Duyệt qua từng câu trong bài viết của bạn. Câu đúng được khen ngợi; câu có lỗi được gợi ý bản sửa và mẫu câu (Redemittel) nâng cao.
              </p>

              <div className="space-y-3 pt-2">
                {(result.sentenceAnalysis || []).map((s, idx) => {
                  const isCorrect = s.status === 'correct';
                  const isMinor = s.status === 'minor_flaw';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-sm border space-y-2 text-xs ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                          : isMinor
                          ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20'
                          : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-foreground">Câu #{s.sentenceIndex || idx + 1}</span>
                        <span
                          className={`font-semibold ${
                            isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {isCorrect ? '✓ Câu đúng & tự nhiên' : isMinor ? '⚠ Cần cải thiện' : '✗ Có lỗi ngữ pháp'}
                        </span>
                      </div>

                      <div className="font-heading text-sm text-foreground">
                        "{s.originalSentence}"
                      </div>

                      {s.praise && (
                        <div className="text-emerald-700 dark:text-emerald-400 font-body text-[11px]">
                          <strong>Khen ngợi:</strong> {s.praise}
                        </div>
                      )}

                      {!isCorrect && s.correction && (
                        <div className="text-foreground font-body text-[11px] pt-1 border-t border-border/60">
                          <strong className="text-accent font-mono">Bản sửa chuẩn: </strong>
                          <span className="font-heading font-semibold text-accent">{s.correction}</span>
                        </div>
                      )}

                      {s.suggestedRedemittel && (
                        <div className="text-muted-foreground font-body text-[11px]">
                          <strong>Redemittel đề xuất: </strong>
                          <span className="italic">{s.suggestedRedemittel}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: F. Danh sách lỗi chi tiết (Mục 3) */}
          {activeSectionTab === 'errors' && (
            <div className="surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="eyebrow">F. Danh sách lỗi chi tiết theo chuẩn Mục 3</div>
                <span className="text-xs font-mono font-bold text-accent">
                  {(result.errorList || []).length} điểm cần lưu ý
                </span>
              </div>

              {(result.errorList || []).length === 0 ? (
                <div className="p-6 text-center text-emerald-600 font-mono text-xs">
                  ✓ Xuất sắc! Không phát hiện lỗi sai nghiêm trọng nào trong bài viết.
                </div>
              ) : (
                <div className="space-y-3">
                  {result.errorList.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-sm border border-border bg-card space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Vị trí: Câu #{err.sentenceNumber || '—'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold ${
                            err.isStilImprovement
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          }`}
                        >
                          {err.isStilImprovement ? 'Gợi ý phong cách (Stil)' : 'Lỗi sai thật (Fehler)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300">
                          <span className="font-mono text-[10px] block">Trích dẫn trong bài:</span>
                          <span className="font-heading font-semibold line-through">"{err.quote}"</span>
                        </div>
                        <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                          <span className="font-mono text-[10px] block">Sửa lại đúng chuẩn:</span>
                          <span className="font-heading font-semibold">"{err.corrected}"</span>
                        </div>
                      </div>

                      <div className="text-foreground/90 font-body text-xs pt-1 space-y-1">
                        <div><strong>Vì sao sai:</strong> {err.whyWrong}</div>
                        <div><strong>Quy tắc ngữ pháp / nghĩa:</strong> {err.rule}</div>
                        <div className="text-accent"><strong>Cách tự nhận biết lần sau:</strong> {err.preventionTip}</div>
                        {err.alternatives && (
                          <div className="text-muted-foreground italic">
                            <strong>Từ/cụm từ thay thế:</strong> {err.alternatives}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: G & I. Bản sửa hoàn chỉnh & Từ vựng */}
          {activeSectionTab === 'rewrite' && (
            <div className="space-y-4">
              {/* G. Bản sửa hoàn chỉnh */}
              <div className="surface p-5 space-y-3">
                <div className="eyebrow">G. Bản sửa hoàn chỉnh (Vẫn giữ nguyên 100% ý bạn)</div>
                <p className="font-body text-xs text-muted-foreground">
                  Bản sửa này khắc phục toàn bộ lỗi chính tả và ngữ pháp, nhưng tôn trọng tuyệt đối cốt truyện, ý kiến và phong cách xưng hô của bạn.
                </p>
                <div className="p-4 rounded-sm border border-emerald-300 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 font-heading text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {result.fullRevisedText}
                </div>
              </div>

              {/* I. Từ, cụm từ, cấu trúc thay thế */}
              <div className="surface p-5 space-y-3">
                <div className="eyebrow">I. Từ & Redemittel thay thế nâng cao</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(result.alternativePhrases || []).map((p, idx) => (
                    <div key={idx} className="p-3 rounded-sm border border-border bg-card text-xs space-y-1">
                      <div className="line-through text-muted-foreground font-mono text-[11px]">
                        {p.original}
                      </div>
                      <div className="text-accent font-heading font-bold text-sm">
                        → {p.suggested}
                      </div>
                      <div className="text-muted-foreground font-body text-[11px]">
                        Ngữ cảnh: {p.context}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: H & J. Bài mẫu & Kế hoạch */}
          {activeSectionTab === 'model' && (
            <div className="space-y-4">
              {/* H. Bài mẫu tham khảo chuẩn CEFR */}
              <div className="surface p-5 space-y-3">
                <div className="eyebrow">H. Bài mẫu tham khảo chuẩn CEFR (Mustertext)</div>
                <p className="font-body text-xs text-muted-foreground">
                  Bài mẫu tiêu chuẩn đạt điểm tối đa từ vựng và cấu trúc theo chuẩn Goethe / telc:
                </p>
                <div className="p-4 rounded-sm border border-accent/30 bg-accent/5 font-heading text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {result.modelEssay}
                </div>
              </div>

              {/* J. Hướng dẫn sửa & kế hoạch làm bài */}
              <div className="surface p-5 space-y-3">
                <div className="eyebrow">J. Kế hoạch sửa bài & Hướng dẫn từng bước</div>
                
                <div className="p-3 rounded-sm bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs">
                  <div className="font-mono font-bold text-rose-800 dark:text-rose-300 mb-1">
                    3 Lỗi cần ưu tiên sửa nhất:
                  </div>
                  <ul className="list-decimal list-inside space-y-0.5 text-rose-700 dark:text-rose-200">
                    {(result.priorityFixes || []).map((pf, idx) => (
                      <li key={idx}>{pf}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-sm border border-border bg-card text-xs space-y-1">
                  <div className="font-mono font-bold text-accent">
                    Từng bước lập dàn ý và kiểm tra cho lần sau:
                  </div>
                  <p className="font-body text-muted-foreground leading-relaxed">
                    {result.stepByStepGuide}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setResult(null)}
              className="tap flex-1 py-2.5 rounded-sm border border-border bg-card text-xs font-mono font-medium hover:bg-muted flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Viết lại bài khác</span>
            </button>
            <button
              onClick={onBack}
              className="tap flex-1 py-2.5 bg-accent text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 flex items-center justify-center gap-2"
            >
              <span>Quay lại danh sách xưởng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="exam"
      />
    </div>
  );
}

export default WritingStudio;
