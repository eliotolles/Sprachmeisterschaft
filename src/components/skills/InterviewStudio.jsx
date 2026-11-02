import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { interviewTurn, interviewFeedback } from '@/lib/elio-ai';
import { getAllExams } from '@/data/all-exams';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { StudioResult } from '@/components/ui/StudioResult';
import {
  Bot,
  User,
  Send,
  Mic,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Plus,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export function InterviewStudio({ onBack }) {
  const [profile] = useState(() => db.learnerProfile.get());
  const allExams = getAllExams();
  const [selectedExamId, setSelectedExamId] = useState(allExams[0]?.id || 'free_mode');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [part, setPart] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const chatEndRef = useRef(null);

  const currentExam = allExams.find((e) => e.id === selectedExamId);
  const speakingTasks = currentExam?.speakingTasks || (Array.isArray(currentExam?.speaking) ? currentExam.speaking : []);
  const currentTask = speakingTasks[part - 1] || null;

  useEffect(() => {
    // Initial examiner turn
    const startPart = async () => {
      setLoading(true);
      const firstTurn = await interviewTurn({
        part,
        messages: [],
        level: currentExam?.level || profile.target_level || 'B1',
        topicPrompt: currentTask?.prompt || '',
        examTitle: currentExam?.title || '',
      });
      setMessages([{ role: 'assistant', content: firstTurn }]);
      setLoading(false);
    };
    startPart();
  }, [part, selectedExamId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const examinerReply = await interviewTurn({
        part,
        messages: nextMessages,
        level: currentExam?.level || profile.target_level || 'B1',
        topicPrompt: currentTask?.prompt || '',
        examTitle: currentExam?.title || '',
      });
      setMessages([...nextMessages, { role: 'assistant', content: examinerReply }]);
      db.studyLogs.recordActivity({ xp: 5, minutes: 1 });
    } catch (e) {
      toast.error('Lỗi kết nối AI giám khảo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setLoading(true);
    try {
      const result = await interviewFeedback({
        part,
        messages,
        level: profile.target_level || 'B1',
      });
      setFeedback(result);

      // Save SkillSession
      db.skillSessions.create({
        skill: 'interview',
        score: result.score,
        title: `Interview Sprechen — Teil ${part}`,
        details: JSON.stringify(result),
        duration_seconds: 300,
      });

      db.studyLogs.recordActivity({
        xp: Math.round(result.score / 2),
        minutes: 6,
      });

      toast.success(`Đã nhận đánh giá thi nói: ${result.score}/100 điểm!`);
    } catch (e) {
      toast.error('Không thể tổng kết bài thi lúc này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface p-6 md:p-8 max-w-3xl mx-auto space-y-6 animate-rise">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="eyebrow">MÔ PHỎNG THI NÓI CHUẨN GOETHE / TELC</div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Sprechen Interview — Teil {part}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPart(p);
                setFeedback(null);
                setMessages([]);
              }}
              className={`tap px-3 py-1 rounded-sm text-xs font-mono font-bold border transition-all ${
                part === p
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Teil {p}
            </button>
          ))}
        </div>
      </div>

      {/* Central Repository Exam Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-sm text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BookOpen className="w-4 h-4 text-accent shrink-0" />
          <span className="font-bold text-foreground shrink-0">Bộ đề thi:</span>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setFeedback(null);
              setMessages([]);
            }}
            className="px-2 py-1 bg-card border border-border rounded-sm text-foreground font-mono text-xs truncate flex-1"
          >
            {allExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.provider} · {ex.level})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsImportOpen(true)}
          className="tap px-2.5 py-1 rounded bg-accent/10 border border-accent/30 text-accent font-bold hover:bg-accent/20 flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Import thêm đề</span>
        </button>
      </div>

      {/* Current Speaking Task Prompt & Guidelines */}
      {currentTask && (
        <div className="p-4 rounded-sm border border-accent/20 bg-accent/5 space-y-2">
          <div className="font-heading font-bold text-sm text-foreground flex items-center justify-between">
            <span>🗣️ Đề bài: {currentTask.title}</span>
            <span className="text-[11px] font-mono text-accent">{currentTask.teil}</span>
          </div>
          <p className="font-body text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
            {currentTask.prompt}
          </p>
          {currentTask.hints && currentTask.hints.length > 0 && (
            <div className="text-[11px] font-body text-muted-foreground pt-1 border-t border-accent/15">
              <strong>Gợi ý: </strong>
              {currentTask.hints.join(' • ')}
            </div>
          )}
        </div>
      )}

      {/* Principle 9 Transparency Alert */}
      <div className="p-3 rounded-sm bg-muted/20 border border-border text-[11px] font-body text-muted-foreground flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <strong>Quy chuẩn thẩm định thi nói (Mục 9):</strong> Hệ thống đánh giá dựa trên mức độ đáp ứng yêu cầu, khả năng đối thoại và tính chính xác của từ vựng / ngữ pháp. <em>Chưa thể đánh giá phát âm trực tiếp qua văn bản nếu không xử lý audio thực tế.</em>
        </div>
      </div>

      {!feedback ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>Giám khảo AI ELIO (CEFR {profile.target_level || 'B1'})</span>
            {messages.filter((m) => m.role === 'user').length >= 2 && (
              <button
                type="button"
                onClick={handleEndInterview}
                disabled={loading}
                className="tap px-2.5 py-1 rounded-sm bg-accent/10 border border-accent/30 text-accent font-semibold hover:bg-accent/20"
              >
                Kết thúc & Nhận thẩm định
              </button>
            )}
          </div>

          {/* Dialogue Area */}
          <div className="p-4 rounded-sm border border-border bg-card/60 min-h-[340px] max-h-[500px] overflow-y-auto space-y-3">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-sm max-w-[80%] font-heading leading-relaxed ${
                      isAssistant
                        ? 'bg-muted/40 border border-border text-foreground'
                        : 'bg-accent text-accent-foreground font-medium'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{m.content}</p>
                      {isAssistant && <SpeakButton text={m.content} size="sm" />}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 items-center text-xs font-mono text-muted-foreground">
                <Bot className="w-4 h-4 animate-spin text-accent" />
                <span>Giám khảo đang lắng nghe và phản hồi...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu trả lời bằng tiếng Đức của bạn..."
              className="flex-1 px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-heading"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="tap px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-medium text-xs rounded-sm border border-accent/40 shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trả lời</span>
            </button>
          </form>
        </div>
      ) : (
        /* Final Interview Feedback */
        <div className="space-y-6 animate-rise">
          <div className="surface p-6 border-accent/30 bg-accent/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Đánh giá phần thi nói mô phỏng</div>
                <h3 className="font-display text-3xl font-bold text-accent">
                  {feedback.score} / 100 điểm
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-sm bg-accent text-accent-foreground font-semibold">
                {feedback.passed ? 'Bestanden (Đạt)' : 'Cần rèn luyện thêm'}
              </span>
            </div>

            <p className="font-body text-xs text-foreground leading-relaxed">
              {feedback.summary}
            </p>
          </div>

          {/* Strengths */}
          <div className="surface p-4 space-y-2">
            <h4 className="font-display text-lg font-bold text-foreground">
              Điểm mạnh thể hiện được:
            </h4>
            <ul className="space-y-1 text-xs font-body text-emerald-700 dark:text-emerald-400">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="surface p-4 space-y-2">
            <h4 className="font-display text-lg font-bold text-foreground">
              3 Điểm cần cải thiện để nâng band điểm:
            </h4>
            <ul className="space-y-1 text-xs font-body text-muted-foreground list-decimal list-inside">
              {feedback.improvements.map((imp, i) => (
                <li key={i}>{imp}</li>
              ))}
            </ul>
          </div>

          {/* Model Phrases */}
          <div className="surface p-4 space-y-2 bg-muted/10">
            <h4 className="font-display text-lg font-bold text-foreground">
              Mẫu câu Redemittel ăn điểm nên dùng:
            </h4>
            <div className="space-y-1.5">
              {feedback.phrases.map((phrase, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-sm bg-card border border-border text-xs flex items-center justify-between gap-2"
                >
                  <span className="font-heading italic text-foreground font-medium">
                    "{phrase}"
                  </span>
                  <SpeakButton text={phrase} size="sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setFeedback(null);
                setMessages([]);
              }}
              className="tap flex-1 py-2 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted"
            >
              Luyện lại phần này
            </button>
            <button
              onClick={onBack}
              className="tap flex-1 py-2 bg-accent text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40"
            >
              Quay lại danh sách xưởng
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

export default InterviewStudio;
