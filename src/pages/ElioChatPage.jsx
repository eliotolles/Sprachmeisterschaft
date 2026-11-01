import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { elioChat } from '@/lib/elio-ai';
import { Bot, User, Send, Sparkles, RotateCcw, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ElioChatPage() {
  const [profile] = useState(() => db.learnerProfile.get());
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('sprach_elio_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [
      {
        role: 'assistant',
        content: `Chào bạn! Mình là **ELIO**, gia sư tiếng Đức đồng hành cùng bạn tại **Sprachmeisterschaft**.

Bạn có thể hỏi mình mọi thứ về:
- Cách dùng mạo từ *der/die/das* và quy tắc đuôi từ.
- Phân biệt các cấu trúc ngữ pháp như *weil / dass / obwohl / Passiv*.
- Chỉnh sửa lỗi câu văn hoặc hỏi chiến thuật thi bằng Goethe, telc B1.

Bạn muốn mình giải đáp chủ đề nào hôm nay?`,
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Quick suggestion chips
  const suggestions = [
    'Phân biệt cách dùng weil và denn?',
    'Mẹo nhớ mạo từ der/die/das chuẩn?',
    'Cách viết mở đầu thư trang trọng B1?',
    'Quy tắc chia đuôi tính từ sau ein/eine?',
  ];

  useEffect(() => {
    try {
      localStorage.setItem('sprach_elio_history', JSON.stringify(messages.slice(-20)));
    } catch (e) {}
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg].slice(-20); // Keep 20 turns context
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await elioChat({
        messages: nextMessages,
        level: profile.target_level || 'B1',
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      // Record activity into study log
      db.studyLogs.recordActivity({ xp: 5, minutes: 1 });
    } catch (err) {
      toast.error('Lỗi phản hồi từ ELIO.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const initial = [
      {
        role: 'assistant',
        content: `Lịch sử hội thoại đã được làm mới. Hãy gửi câu hỏi tiếng Đức tiếp theo của bạn nhé!`,
      },
    ];
    setMessages(initial);
    localStorage.removeItem('sprach_elio_history');
    toast.info('Đã làm mới lịch sử chat.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-rise">
      <PageHeader
        eyebrow="GIA SƯ AI RIÊNG"
        title="Trò chuyện cùng ELIO"
        deTitle="KI-Tutor"
        subtitle={`Gia sư tiếng Việt tận tâm, bám sát trình độ ${profile.target_level || 'B1'} và sửa lỗi chi tiết.`}
        actions={
          <button
            onClick={handleClearHistory}
            className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xoá lịch sử chat</span>
          </button>
        }
      />

      {/* Chat Container */}
      <div className="surface flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((m, idx) => {
            const isAssistant = m.role === 'assistant';

            return (
              <div
                key={idx}
                className={`flex gap-3 text-sm leading-relaxed ${
                  isAssistant ? 'justify-start' : 'justify-end'
                }`}
              >
                {isAssistant && (
                  <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-sm max-w-[85%] font-body ${
                    isAssistant
                      ? 'bg-muted/30 border border-border text-foreground space-y-2'
                      : 'bg-accent text-accent-foreground font-medium'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed text-xs md:text-sm">
                    {m.content}
                  </div>
                </div>

                {!isAssistant && (
                  <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground animate-pulse">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-sm bg-muted/20 border border-border">
                ELIO đang soạn câu trả lời kèm ví dụ...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-border bg-card/40 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase text-muted-foreground shrink-0 mr-1">
            Gợi ý:
          </span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="tap px-2.5 py-1 text-xs font-heading bg-card border border-border hover:border-accent/40 rounded-sm text-foreground/80 hover:text-accent whitespace-nowrap transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-border bg-card flex gap-2">
          <input
            type="text"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi ELIO bất kỳ điều gì về tiếng Đức, ngữ pháp, mẫu câu thi..."
            className="flex-1 px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-heading"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="tap px-5 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-medium text-xs rounded-sm border border-accent/40 shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
}
