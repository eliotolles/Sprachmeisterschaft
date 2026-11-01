import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { interviewTurn, interviewFeedback } from '@/lib/elio-ai';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { StudioResult } from '@/components/ui/StudioResult';
import { Bot, User, Send, Mic, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function InterviewStudio({ onBack }) {
  const [profile] = useState(() => db.learnerProfile.get());
  const [part, setPart] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Initial examiner turn
    const startPart = async () => {
      setLoading(true);
      const firstTurn = await interviewTurn({ part, messages: [], level: profile.target_level || 'B1' });
      setMessages([{ role: 'assistant', content: firstTurn }]);
      setLoading(false);
    };
    startPart();
  }, [part]);

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
        level: profile.target_level || 'B1',
      });
      setMessages([...nextMessages, { role: 'assistant', content: examinerReply }]);
      db.studyLogs.recordActivity({ xp: 5, minutes: 1 });
    } catch (err) {
      toast.error('Lỗi kết nối giám khảo AI.');
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
      <div className="flex items-center justify-between border-b border-border pb-3">
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
              onClick={() => {
                setPart(p);
                setFeedback(null);
              }}
              className={`tap px-2.5 py-1 text-xs font-mono rounded-sm border ${
                part === p
                  ? 'bg-accent text-accent-foreground border-accent font-semibold'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Phần {p}
            </button>
          ))}
        </div>
      </div>

      {!feedback ? (
        <div className="space-y-4">
          <div className="p-3 rounded-sm bg-muted/20 border border-border text-xs font-body text-muted-foreground flex items-center justify-between">
            <span>Giám khảo AI đóng vai người bản xứ Đức, đặt câu hỏi đúng trình độ {profile.target_level || 'B1'}.</span>
            <button
              onClick={handleEndInterview}
              disabled={messages.length < 3 || loading}
              className="tap px-3 py-1 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-mono text-[11px] rounded-sm shrink-0"
            >
              Kết thúc & Chấm điểm
            </button>
          </div>

          {/* Dialogue turns */}
          <div className="h-[360px] overflow-y-auto space-y-3 p-4 rounded-sm border border-border bg-card/60">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-sm max-w-[80%] font-heading ${
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
                <span>Giám khảo đang lắng nghe và suy nghĩ...</span>
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
                <div className="eyebrow">Đánh giá phần thi nói</div>
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
              3 Mẫu câu ăn điểm cao nên nhớ:
            </h4>
            <div className="space-y-1.5">
              {feedback.phrases.map((phrase, i) => (
                <div key={i} className="p-2.5 rounded-sm bg-card border border-border text-xs flex items-center justify-between gap-2">
                  <span className="font-heading italic text-foreground font-medium">"{phrase}"</span>
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
    </div>
  );
}
