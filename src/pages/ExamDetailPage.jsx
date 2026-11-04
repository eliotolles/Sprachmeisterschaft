import { LookupText } from '@/components/vocabulary/WordDetail';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import {newExamBinding,examCoreActive} from '@/lib/elio-exam-runtime';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { evaluateWritingFull, auditFullExamResults } from '@/lib/ai-evaluator';
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
  ShieldAlert,
  RotateCcw,
  Sparkles,
  HelpCircle,
  FileText,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

export function ExamDetailPage({ examId }) {
  const { navigate } = useRouter();
  const coreActive=examCoreActive();
  const [core]=useState(newExamBinding);
  const [coreExam,setCoreExam]=useState(null);
  const [restart,setRestart]=useState(0);
  const [deadline,setDeadline]=useState(null),[clockOffset,setClockOffset]=useState(0);
  const scopeRef=useRef(0),submitRef=useRef(null),submitBusy=useRef(false),answerRef=useRef({reading:{},listening:{}});
  const exam = coreActive?coreExam:getExamById(examId);

  const [activeTab, setActiveTab] = useState('reading'); // reading, listening, writing, speaking
  const [timeLeft, setTimeLeft] = useState(exam?.minutes ? exam.minutes * 60 : 3600);

  // Reading answers: key can be `${sIdx}_${qIdx}` or index
  const [readingAnswers, setReadingAnswers] = useState({});

  // Listening answers
  const [listeningAnswers, setListeningAnswers] = useState({});

  // Writing text & AI evaluation
  const [writingText, setWritingText] = useState('');
  const [writingEvaluation, setWritingEvaluation] = useState(null);
  const [gradingWriting, setGradingWriting] = useState(false);

  // Final submission state
  const [submitted, setSubmitted] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [startTime] = useState(Date.now());
  const [evaluatingExam, setEvaluatingExam] = useState(false);
  const [resultSubTab, setResultSubTab] = useState('summary'); // 'summary' | 'lesen' | 'hoeren' | 'schreiben'

  useEffect(()=>{if(!coreActive)return;let cancelled=false;const load=async()=>{const epoch=++scopeRef.current;core.reset();setCoreExam(null);setActiveTab('reading');setDeadline(null);setReadingAnswers({});setListeningAnswers({});setWritingText('');setWritingEvaluation(null);setSubmitted(false);setAuditResult(null);answerRef.current={reading:{},listening:{}};submitBusy.current=false;setEvaluatingExam(false);try{const catalog=await core.catalog(),selected=catalog.find(e=>e.id===examId);if(!selected)throw Error('Không có đề thi được phép đọc.');const started=await core.begin(selected);if(cancelled||epoch!==scopeRef.current)return;const reading={},listening={};started.exam.reading.forEach((t,i)=>t.questions.forEach((q,j)=>{if(started.answers[q.id]!==undefined)reading[i+'_'+j]=started.answers[q.id];}));started.exam.listening.forEach((q,i)=>{if(started.answers[q.id]!==undefined)listening[i]=started.answers[q.id];});answerRef.current={reading,listening};setReadingAnswers(reading);setListeningAnswers(listening);setCoreExam(started.exam);setDeadline(started.deadline);setClockOffset(Number.isFinite(started.serverNow)?started.serverNow-Date.now():0);setTimeLeft(Math.max(0,Math.ceil((started.deadline-(started.serverNow||Date.now()))/1000)));}catch(error){if(!cancelled)toast.error(error.message);}};load();window.addEventListener('sprach_auth_change',load);return()=>{cancelled=true;scopeRef.current++;core.reset();window.removeEventListener('sprach_auth_change',load);};},[coreActive,examId,restart]);
  const handleCoreChoice=(kind,key,value)=>{const epoch=scopeRef.current;answerRef.current={...answerRef.current,[kind]:{...answerRef.current[kind],[key]:value}};(kind==='reading'?setReadingAnswers:setListeningAnswers)(answerRef.current[kind]);core.persist(exam,answerRef.current.reading,answerRef.current.listening).catch(error=>{if(epoch===scopeRef.current)toast.error(error.message);});};

  // Timer countdown
  useEffect(() => {
    if (submitted) return;
    if(coreActive){if(!deadline)return;const timer=setInterval(()=>{const remaining=Math.max(0,Math.ceil((deadline-Date.now()-clockOffset)/1000));setTimeLeft(remaining);if(!remaining){clearInterval(timer);submitRef.current?.();}},1000);return()=>clearInterval(timer);}
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
  }, [submitted,coreActive,deadline,clockOffset]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!exam) {
    return (
      <div className="surface p-8 text-center space-y-4">
        <h3 className="font-display text-xl font-bold">{coreActive?'Đang tải đề thi hoặc chưa có quyền truy cập':'Không tìm thấy đề thi'}</h3>
        <button
          onClick={() => navigate('/exams')}
          className="px-4 py-2 bg-accent text-accent-foreground text-xs font-mono rounded"
        >
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  const allReadingQuestions = (exam.reading || []).flatMap((r) => r.questions || []);
  const allListeningQuestions = exam.listening || [];
  const totalMCQuestions = allReadingQuestions.length + allListeningQuestions.length;

  const handleGradeWritingNow = async () => {
    if(coreActive)return toast.error('Phiên này chỉ chấm trắc nghiệm; luyện viết dùng xưởng Schreiben.');
    if (!writingText.trim() || writingText.trim().split(/\s+/).length < 15) {
      toast.error('Vui lòng viết tối thiểu 15 từ trước khi thẩm định.');
      return;
    }

    setGradingWriting(true);
    try {
      const evaluation = await evaluateWritingFull({
        task: `${exam.title} - ${exam.writing?.task || 'Schreiben'}`,
        text: writingText,
        level: exam.level,
        examProvider: exam.provider,
      });
      setWritingEvaluation(evaluation);
      toast.success(`AI đã thẩm định bài viết: ${evaluation.totalPracticeScore}/20 điểm!`);
    } catch (e) {
      toast.error('Lỗi khi thẩm định bài viết.');
    } finally {
      setGradingWriting(false);
    }
  };

  const handleSubmitExam = async () => {
    if(coreActive){if(submitted||submitBusy.current)return;const epoch=scopeRef.current;submitBusy.current=true;setEvaluatingExam(true);try{const result=await core.submit(exam,answerRef.current.reading,answerRef.current.listening);if(epoch===scopeRef.current){setAuditResult(result);setSubmitted(true);}}catch(error){if(epoch===scopeRef.current)toast.error(error.message);}finally{if(epoch===scopeRef.current){submitBusy.current=false;setEvaluatingExam(false);}}return;}
    if (submitted || evaluatingExam) return;
    setEvaluatingExam(true);

    try {
      // 1. Audit full exam using central AI evaluator
      const audit = await auditFullExamResults({
        exam,
        readingAnswers,
        listeningAnswers,
        writingText,
        writingEval: writingEvaluation,
      });

      setAuditResult(audit);

      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      // 2. Save Exam Result
      db.examResults.create({
        exam_id: exam.id,
        provider: exam.provider,
        title: exam.title,
        level: exam.level,
        mc_score: audit.mcCorrect,
        mc_total: audit.mcTotal,
        writing_score: audit.writingScaled100,
        total: audit.compositeScore100,
        passed: audit.passed,
        duration_seconds: durationSeconds,
        feedback: `Đúng ${audit.mcCorrect}/${audit.mcTotal} câu trắc nghiệm (${audit.mcPercent}%). Viết: ${audit.writingPracticeScore}/20 (${audit.writingScaled100}%).`,
      });

      // 3. Save StudyLog
      db.studyLogs.recordActivity({
        xp: Math.round(audit.compositeScore100 / 2),
        minutes: Math.max(1, Math.round(durationSeconds / 60)),
      });

      setSubmitted(true);
      toast.success(
        `Đã hoàn tất chấm thi! Tổng điểm: ${audit.compositeScore100}/100 (${
          audit.passed ? 'Bestanden' : 'Noch nicht bestanden'
        })`
      );
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi trong quá trình tổng hợp kết quả bài thi.');
    } finally {
      setEvaluatingExam(false);
    }
  };

  // ================= RENDER DETAILED EXAM RESULT =================
  submitRef.current=handleSubmitExam;
  if (submitted && auditResult) {
    const readingAudits = (auditResult.questionAudits || []).filter((q) =>
      q.section.includes('Lesen')
    );
    const listeningAudits = (auditResult.questionAudits || []).filter((q) =>
      q.section.includes('Hören')
    );

    return (
      <div className="space-y-6 animate-rise max-w-4xl mx-auto">
        <PageHeader
          eyebrow={`${coreActive?'BÁO CÁO LUYỆN TẬP':'BÁO CÁO THẨM ĐỊNH KỲ THI'} ${exam.provider.toUpperCase()} ${exam.level}`}
          title={
            coreActive?'Kết quả luyện tập trắc nghiệm':auditResult.passed
              ? 'Bestanden! (Đậu chuẩn CEFR)'
              : 'Noch nicht bestanden (Cần rèn luyện thêm)'
          }
          deTitle={coreActive?"Übungsbericht":"Offizieller Prüfungsbericht"}
          subtitle={coreActive?'Chấm trắc nghiệm theo đáp án nguồn đã lưu; không xác định kết quả chứng chỉ.':`Hồ sơ phân tích chi tiết từng phần, từng câu theo quy chuẩn khảo thí Đức.`}
        />

        {/* Top Composite Banner */}
        <div className="surface p-6 border-accent/30 bg-accent/5 rounded-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="eyebrow">Tổng điểm tổng hợp (Khớp chính xác từng phần)</div>
              <div className="flex items-baseline gap-3 mt-1">
                <h3 className="font-display text-4xl font-bold text-accent">
                  {auditResult.compositeScore100}{' '}
                  <span className="text-xl text-muted-foreground font-mono">/ 100</span>
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  {coreActive?'(Ngưỡng luyện tập: 60/100)':'(Điểm chuẩn đạt: 60/100)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span
                className={`px-3 py-1 rounded-sm text-xs font-mono font-bold ${
                  auditResult.passed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {coreActive?'Điểm luyện tập · không phải kết quả chứng chỉ':auditResult.passed ? '✓ Bestanden' : '✗ Noch nicht bestanden'}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {coreActive?`Chỉ tính trắc nghiệm (${auditResult.mcPercent}%). Phần viết chưa đánh giá.`:`Công thức: 70% Trắc nghiệm (${auditResult.mcPercent}%) + 30% Viết (${auditResult.writingScaled100}%)`}
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border">
            <div className="p-2.5 rounded-sm bg-card border border-border text-center">
              <span className="text-[10px] font-mono text-muted-foreground block">Đúng</span>
              <strong className="text-emerald-600 font-display text-lg">
                {auditResult.mcCorrect} <span className="text-xs font-mono text-muted-foreground">/{auditResult.mcTotal}</span>
              </strong>
            </div>
            <div className="p-2.5 rounded-sm bg-card border border-border text-center">
              <span className="text-[10px] font-mono text-muted-foreground block">Sai</span>
              <strong className="text-rose-600 font-display text-lg">
                {auditResult.mcIncorrect}
              </strong>
            </div>
            <div className="p-2.5 rounded-sm bg-card border border-border text-center">
              <span className="text-[10px] font-mono text-muted-foreground block">Chưa làm / Bỏ trống</span>
              <strong className="text-amber-600 font-display text-lg">
                {auditResult.mcBlank}
              </strong>
            </div>
            <div className="p-2.5 rounded-sm bg-card border border-border text-center">
              <span className="text-[10px] font-mono text-muted-foreground block">Điểm bài viết</span>
              <strong className="text-accent font-display text-lg">
                {auditResult.writingPracticeScore} <span className="text-xs font-mono text-muted-foreground">/20</span>
              </strong>
            </div>
          </div>

          <div className="p-3 rounded-sm bg-muted/20 border border-border text-[11px] font-body text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
            <span>
              <strong>Nguyên tắc khảo thí:</strong> Đáp án nguồn quyết định điểm hiển thị chính thức. Dưới đây là đối chiếu chi tiết từng câu và lý do vì sao đáp án đúng, phương án sai và bẫy đề thi.
            </span>
          </div>
        </div>

        {/* Results Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-1">
          {[
            { id: 'summary', label: '1. Tổng quan & Thống kê' },
            { id: 'lesen', label: `2. Đọc hiểu - Lesen (${readingAudits.length} câu)` },
            { id: 'hoeren', label: `3. Nghe hiểu - Hören (${listeningAudits.length} câu)` },
            { id: 'schreiben', label: '4. Viết luận - Schreiben (10 mục CEFR)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setResultSubTab(tab.id)}
              className={`tap px-3.5 py-2 text-xs font-mono rounded-t-sm border-b-2 transition-all whitespace-nowrap ${
                resultSubTab === tab.id
                  ? 'border-accent text-accent font-bold bg-accent/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* RESULT SUB-TAB 1: Summary */}
        {resultSubTab === 'summary' && (
          <div className="space-y-4">
            <div className="surface p-5 space-y-3">
              <div className="eyebrow">Báo cáo đánh giá tổng thể</div>
              <p className="font-body text-xs text-foreground leading-relaxed">
                Đề thi <strong>{exam.title}</strong> thuộc trình độ <strong>{exam.level}</strong> theo khung tham chiếu châu Âu CEFR. Bài làm của bạn đạt tổng <strong>{auditResult.compositeScore100}/100 điểm</strong> ({coreActive?'Luyện tập, không xác định đậu chứng chỉ':auditResult.passed ? 'Đạt chuẩn' : 'Chưa đạt chuẩn'}).
              </p>

              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-sm border border-border bg-card flex items-center justify-between text-xs">
                  <span>Kỹ năng Đọc hiểu & Nghe hiểu (Trắc nghiệm):</span>
                  <strong className="font-mono text-accent">
                    {auditResult.mcCorrect}/{auditResult.mcTotal} câu ({auditResult.mcPercent}%)
                  </strong>
                </div>
                <div className="p-3 rounded-sm border border-border bg-card flex items-center justify-between text-xs">
                  <span>Kỹ năng Viết luận (Schreiben):</span>
                  <strong className="font-mono text-accent">
                    {auditResult.writingPracticeScore}/20 điểm luyện tập ({auditResult.writingScaled100}%)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULT SUB-TAB 2: Lesen Detailed Audits */}
        {resultSubTab === 'lesen' && (
          <div className="surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="eyebrow">Đối chiếu chi tiết phần Đọc hiểu (Lesen)</div>
              <span className="text-xs font-mono text-muted-foreground">
                {readingAudits.filter((q) => q.isCorrect).length}/{readingAudits.length} câu đúng
              </span>
            </div>

            <div className="space-y-4">
              {readingAudits.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-sm border space-y-2.5 text-xs ${
                    q.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10'
                      : q.isBlank
                      ? 'border-amber-200 bg-amber-50/20 dark:border-amber-950 dark:bg-amber-950/10'
                      : 'border-rose-200 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold text-foreground">
                      Câu #{q.questionIndex}: {q.teil}
                    </span>
                    <span
                      className={`font-bold ${
                        q.isCorrect
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : q.isBlank
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {q.isCorrect ? '✓ Đúng' : q.isBlank ? '⚠ Bỏ trống' : '✗ Sai'}
                    </span>
                  </div>

                  <div className="font-heading font-semibold text-sm text-foreground">
                    {q.questionText}
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 rounded bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">Bạn đã chọn:</span>
                      <strong className={q.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                        {q.chosenAnswer}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">{coreActive?'Đáp án nguồn đã lưu:':'Đáp án nguồn chính thức:'}</span>
                      <strong className="text-accent">{q.sourceAnswer}</strong>
                    </div>
                  </div>

                  {/* Evidence quote */}
                  <div className="p-2.5 rounded bg-muted/20 border border-border/60 text-xs font-body text-foreground/90">
                    <strong className="font-mono text-accent text-[11px] block mb-0.5">
                      {coreActive?'Thông tin nguồn đáp án:':'Dẫn chứng từ văn bản bài đọc:'}
                    </strong>
                    <span className="italic">"{q.evidence}"</span>
                  </div>

                  {/* Explanation & Trap */}
                  <div className="text-muted-foreground font-body text-xs space-y-1">
                    <div>
                      <strong className="text-foreground">Giải thích: </strong>
                      {q.explanation}
                    </div>
                    <div className="text-accent/90 text-[11px] italic">
                      💡 Mẹo & bẫy: Cẩn thận từ đồng nghĩa hoặc câu mang hàm ý phủ định gián tiếp trong đề thi.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT SUB-TAB 3: Hören Detailed Audits */}
        {resultSubTab === 'hoeren' && (
          <div className="surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="eyebrow">Đối chiếu chi tiết phần Nghe hiểu (Hören)</div>
              <span className="text-xs font-mono text-muted-foreground">
                {listeningAudits.filter((q) => q.isCorrect).length}/{listeningAudits.length} câu đúng
              </span>
            </div>

            <div className="space-y-4">
              {listeningAudits.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-sm border space-y-2.5 text-xs ${
                    q.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10'
                      : q.isBlank
                      ? 'border-amber-200 bg-amber-50/20 dark:border-amber-950 dark:bg-amber-950/10'
                      : 'border-rose-200 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold text-foreground">
                      Câu #{q.questionIndex}: {q.teil}
                    </span>
                    <span
                      className={`font-bold ${
                        q.isCorrect
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : q.isBlank
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {q.isCorrect ? '✓ Đúng' : q.isBlank ? '⚠ Bỏ trống' : '✗ Sai'}
                    </span>
                  </div>

                  <div className="font-heading font-semibold text-sm text-foreground">
                    {q.questionText}
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 rounded bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">Bạn đã chọn:</span>
                      <strong className={q.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                        {q.chosenAnswer}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">{coreActive?'Đáp án nguồn đã lưu:':'Đáp án nguồn chính thức:'}</span>
                      <strong className="text-accent">{q.sourceAnswer}</strong>
                    </div>
                  </div>

                  {/* Transcript quote */}
                  <div className="p-2.5 rounded bg-muted/20 border border-border/60 text-xs font-body text-foreground/90">
                    <strong className="font-mono text-accent text-[11px] block mb-0.5">
                      {coreActive?'Thông tin nguồn đáp án:':'Trích đoạn âm thanh (Audio Transcript):'}
                    </strong>
                    <span className="italic">"{q.evidence}"</span>
                  </div>

                  {/* Explanation */}
                  <div className="text-muted-foreground font-body text-xs">
                    <strong className="text-foreground">Giải thích: </strong>
                    {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT SUB-TAB 4: Schreiben 10-Item Full Report */}
        {resultSubTab === 'schreiben' && (
          <div className="space-y-4">
            {auditResult.writingEvaluation ? (
              <div className="surface p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="eyebrow">Thẩm định bài Viết tự luận (10 Mục Chuẩn CEFR)</div>
                  <span className="text-xs font-mono font-bold text-accent">
                    {auditResult.writingPracticeScore} / 20 Điểm ({auditResult.writingScaled100}%)
                  </span>
                </div>

                {/* General remarks */}
                <div className="p-3 rounded-sm bg-accent/5 border border-accent/20 text-xs font-body text-foreground leading-relaxed">
                  <strong>A. Nhận xét tổng quan: </strong>
                  {auditResult.writingEvaluation.generalRemarks}
                </div>

                {/* 4 Rubric Criteria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(auditResult.writingEvaluation.criteriaScores || {}).map(
                    ([k, c]) => (
                      <div key={k} className="p-3 rounded-sm border border-border bg-card">
                        <div className="flex items-center justify-between font-heading font-bold text-foreground">
                          <span>{c.label || k}</span>
                          <span className="text-accent font-mono">{c.score}/5</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {c.evidence}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Faithful rewrite */}
                <div className="space-y-1 pt-2">
                  <div className="eyebrow">G. Bản sửa hoàn chỉnh (Bảo toàn ý người học)</div>
                  <div className="p-3.5 rounded-sm border border-emerald-300 dark:border-emerald-900 bg-emerald-50/20 text-xs font-heading leading-relaxed whitespace-pre-line text-foreground">
                    {auditResult.writingEvaluation.fullRevisedText}
                  </div>
                </div>

                {/* Model Essay */}
                <div className="space-y-1 pt-2">
                  <div className="eyebrow">H. Bài mẫu chuẩn CEFR tham khảo</div>
                  <div className="p-3.5 rounded-sm border border-accent/30 bg-accent/5 text-xs font-heading leading-relaxed whitespace-pre-line text-foreground">
                    {auditResult.writingEvaluation.modelEssay}
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface p-6 text-center text-muted-foreground text-xs font-mono">
                Thí sinh không làm bài viết cho phần thi này.
              </div>
            )}
          </div>
        )}

        {/* Retry or Back Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if(coreActive){setCoreExam(null);setDeadline(null);setRestart(n=>n+1);return;}
              setSubmitted(false);
              setAuditResult(null);
              setReadingAnswers({});
              setListeningAnswers({});
              setWritingText('');
              setWritingEvaluation(null);
              setTimeLeft(exam.minutes * 60);
            }}
            className="tap flex-1 py-2.5 rounded-sm border border-border bg-card text-xs font-mono font-medium hover:bg-muted flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại đề thi này</span>
          </button>
          <button
            onClick={() => navigate('/exams')}
            className="tap flex-1 py-2.5 bg-accent text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 flex items-center justify-center gap-2"
          >
            <span>Danh sách đề thi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ================= RENDER TAKING EXAM =================
  return (
    <div className="space-y-6 animate-rise max-w-4xl mx-auto">
      {/* Top Bar with Timer and Submit */}
      <div className="surface p-4 flex items-center justify-between sticky top-14 md:top-4 z-30 shadow-md">
        <div>
          <span className="eyebrow text-[9px] uppercase">
            {exam.provider} • {exam.level}
          </span>
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
            disabled={evaluatingExam}
            className="tap px-4 py-1.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm"
          >
            {evaluatingExam ? 'Đang tổng hợp điểm...' : 'Nộp bài thi'}
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
              <div>
                <div className="eyebrow">{section.teil || `Teil ${sIdx + 1}`}</div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {section.title}
                </h3>
              </div>

              {section.text && (
                <div className="p-4 rounded-sm border border-border bg-card/60 font-body text-xs md:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {section.text}
                </div>
              )}

              {/* Questions */}
              <div className="space-y-4 pt-2">
                {(section.questions || []).map((q, qIdx) => {
                  const qKey = `${sIdx}_${qIdx}`;
                  const selectedAnswer = readingAnswers[qKey];
                  return (
                    <div
                      key={qIdx}
                      className="p-4 rounded-sm border border-border bg-card space-y-3"
                    >
                      <div className="font-heading font-semibold text-sm text-foreground">
                        {qIdx + 1}. <LookupText text={q.question} />
                      </div>

                      <div className="space-y-2">
                        {(q.options || []).map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`tap p-2.5 rounded-sm border flex items-center gap-3 cursor-pointer text-xs font-heading transition-all ${
                              selectedAnswer === opt
                                ? 'border-accent bg-accent/10 font-bold text-foreground'
                                : 'border-border bg-background hover:bg-muted/40 text-foreground/90'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`reading_${qKey}`}
                              value={opt}
                              checked={selectedAnswer === opt}
                              disabled={evaluatingExam||(coreActive&&timeLeft<=0)}
                              onChange={() => coreActive?handleCoreChoice('reading',qKey,opt):
                                setReadingAnswers((prev) => ({
                                  ...prev,
                                  [qKey]: opt,
                                }))
                              }
                              className="accent-accent"
                            />
                            <span>{coreActive&&q.optionTexts?.[opt]?opt+'. '+q.optionTexts[opt]:opt}</span>
                          </label>
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
          <div className="surface p-6 space-y-4">
            <div>
              <div className="eyebrow">HÖRVERSTEHEN</div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Phần thi Nghe hiểu
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Bấm nút loa để nghe đoạn hội thoại hoặc thông báo âm thanh, sau đó chọn phương án đúng.
              </p>
            </div>

            <div className="space-y-4">
              {(exam.listening || []).map((q, lIdx) => {
                const selectedAnswer = listeningAnswers[lIdx];
                return (
                  <div
                    key={lIdx}
                    className="p-4 rounded-sm border border-border bg-card space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-accent font-bold">
                        {q.teil || `Câu ${lIdx + 1}`}
                      </span>
                      {q.audioText && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-muted-foreground">Nghe:</span>
                          <SpeakButton text={q.audioText} size="sm" />
                        </div>
                      )}
                    </div>

                    <div className="font-heading font-semibold text-sm text-foreground">
                      <LookupText text={q.question} />
                    </div>

                    <div className="space-y-2">
                      {(q.options || []).map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className={`tap p-2.5 rounded-sm border flex items-center gap-3 cursor-pointer text-xs font-heading transition-all ${
                            selectedAnswer === opt
                              ? 'border-accent bg-accent/10 font-bold text-foreground'
                              : 'border-border bg-background hover:bg-muted/40 text-foreground/90'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`listening_${lIdx}`}
                            value={opt}
                            checked={selectedAnswer === opt}
                            disabled={evaluatingExam||(coreActive&&timeLeft<=0)}
                            onChange={() => coreActive?handleCoreChoice('listening',lIdx,opt):
                              setListeningAnswers((prev) => ({
                                ...prev,
                                [lIdx]: opt,
                              }))
                            }
                            className="accent-accent"
                          />
                          <span>{coreActive&&q.optionTexts?.[opt]?opt+'. '+q.optionTexts[opt]:opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                  <strong>Gợi ý các điểm cần viết (Leitpunkte):</strong>
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
                rows={10}
                value={writingText}
                disabled={coreActive}
                onChange={(e) => setWritingText(e.target.value)}
                placeholder="Sehr geehrte Damen und Herren, ich schreibe Ihnen, weil..."
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
                {gradingWriting ? 'Đang thẩm định 10 mục...' : 'Thẩm định bài viết này trước'}
              </button>
            </div>

            {writingEvaluation && (
              <div className="p-4 rounded-sm bg-accent/5 border border-accent/30 space-y-2 animate-rise">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-accent">
                    Điểm phần viết: {writingEvaluation.totalPracticeScore}/20 (Quy đổi: {Math.round((writingEvaluation.totalPracticeScore / 20) * 100)}/100)
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Sẽ chiếm 30% tổng điểm đề thi
                  </span>
                </div>
                <p className="text-xs font-body text-foreground">
                  {writingEvaluation.generalRemarks}
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
                <div
                  key={pIdx}
                  className="p-4 rounded-sm border border-border bg-card/60 space-y-2"
                >
                  <div className="font-heading font-semibold text-sm text-foreground">
                    {part.part}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    <LookupText text={part.prompt} />
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
              Để luyện tập tương tác trực tiếp với giám khảo AI ELIO từng lượt, bạn hãy vào mục{' '}
              <strong>Kỹ năng → Interview</strong> trên thanh điều hướng.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamDetailPage;
