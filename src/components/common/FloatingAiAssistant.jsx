import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/lib/router';
import { db } from '@/lib/db';
import { elioTutor } from '@/lib/elio-tutor-runtime';
import { elioChat } from '@/lib/elio-ai';
import { executeTaskWithFallback } from '@/lib/ai-evaluator';
import { speakGerman } from '@/lib/algorithms';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Volume2,
  Mic,
  MicOff,
  Copy,
  Check,
  Minimize2,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY_FLOATING_CHAT = 'sprach_floating_assistant_history';

/**
 * Trợ lý ảo ELIO 24/7 thông minh:
 * Tự động kết nối với dàn AI (Groq siêu tốc / Gemini) hoặc fallback gia sư local
 */
async function queryAssistant({ query, messages, level, currentPath }) {
  // 1. Nếu elioTutor active trên server
  if (elioTutor?.isActive?.()) {
    try {
      const confirmed = await elioTutor.reply(query, level);
      const lastReply = confirmed[confirmed.length - 1]?.text || confirmed[confirmed.length - 1]?.content;
      if (lastReply) return lastReply;
    } catch {}
  }

  // 2. Thử gọi trực tiếp dàn AI được quản trị viên phân công cho tác vụ 'elio_chat'
  try {
    const systemPrompt = `Bạn là ELIO - Trợ lý & Gia sư tiếng Đức thông minh trực tuyến 24/7 của nền tảng Sprachmeisterschaft.
Nhiệm vụ: Trả lời ngắn gọn, thân thiện, súc tích bằng tiếng Việt và tiếng Đức cho học viên trình độ CEFR ${level}.
Quy tắc:
1. Trả lời ngay trọng tâm câu hỏi của người học (từ vựng, ngữ pháp, mẹo thi, sửa câu, cấu trúc, dịch nghĩa).
2. Kèm 1-2 ví dụ câu tiếng Đức thực tế kèm dịch nghĩa tiếng Việt.
3. Nếu người học viết sai tiếng Đức, hãy nhẹ nhàng chỉ ra lỗi sai và viết lại câu chuẩn.
4. Trình bày rõ ràng, dùng gạch đầu dòng và in đậm các từ khóa quan trọng.
Vị trí học viên đang mở: ${currentPath || 'Ứng dụng Sprachmeisterschaft'}`;

    const recentContext = messages
      .slice(-4)
      .map((m) => `${m.role === 'user' ? 'Học viên' : 'ELIO'}: ${m.content}`)
      .join('\n');

    const userPrompt = recentContext
      ? `${recentContext}\nHọc viên: ${query}\nELIO:`
      : `Học viên hỏi: ${query}\nHãy trả lời trực tiếp cho học viên:`;

    const aiRes = await executeTaskWithFallback({
      taskId: 'elio_chat',
      systemPrompt,
      userPrompt,
      jsonMode: false,
    });

    if (aiRes) {
      if (typeof aiRes === 'string' && aiRes.trim()) return aiRes.trim();
      if (typeof aiRes === 'object' && aiRes.reply) return aiRes.reply;
    }
  } catch (err) {
    console.warn('Fallback to local Elio rule tutor:', err?.message);
  }

  // 3. Fallback mượt mà đến bộ tri thức gia sư tiếng Đức local elioChat
  const fallbackRes = await elioChat({
    messages: [...messages, { role: 'user', content: query }],
    level,
  });

  return fallbackRes;
}

/**
 * Format markdown đơn giản (in đậm, in nghiêng, gạch đầu dòng)
 */
function renderSimpleMarkdown(content) {
  if (!content) return null;
  const lines = content.split('\n');

  return lines.map((line, idx) => {
    // Gạch đầu dòng
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
    let text = isBullet ? line.trim().replace(/^[-•]\s*/, '') : line;

    // Tách in đậm **text**
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={pIdx} className="italic text-accent">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] text-accent">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    return (
      <div key={idx} className={`${isBullet ? 'flex items-start gap-1.5 pl-2' : ''} min-h-[1.25rem]`}>
        {isBullet && <span className="text-accent shrink-0 mt-1">•</span>}
        <span className="flex-1">{formattedParts}</span>
      </div>
    );
  });
}

export function FloatingAiAssistant() {
  const { currentPath } = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile] = useState(() => db.learnerProfile?.get?.() || { target_level: 'B1' });
  const [copiedId, setCopiedId] = useState(null);

  const initialWelcome = {
    id: 'msg-welcome-floating',
    role: 'assistant',
    content: `Chào bạn! Mình là **ELIO** — trợ lý học tiếng Đức trực tuyến 24/7 của bạn tại **Sprachmeisterschaft**.

Bất cứ lúc nào bạn gặp từ vựng khó, ngữ pháp chưa hiểu, cần dịch câu hay mẹo làm bài thi, bạn cứ bấm vào hỏi là mình sẽ giải đáp ngay nhé!`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FLOATING_CHAT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [initialWelcome];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const speechRecognitionRef = useRef(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Quick suggestions
  const quickSuggestions = [
    'Giải thích ngữ pháp câu này',
    'Mẹo nhớ giống der/die/das',
    'Sửa lỗi câu tiếng Đức',
    'Từ vựng theo chủ đề',
  ];

  // Khởi tạo Speech Recognition nếu trình duyệt hỗ trợ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        try {
          const recognizer = new SpeechRecognition();
          recognizer.continuous = false;
          recognizer.interimResults = false;
          recognizer.lang = 'vi-VN';

          recognizer.onresult = (event) => {
            const transcript = event.results?.[0]?.[0]?.transcript;
            if (transcript) {
              setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
            }
            setIsListeningVoice(false);
          };

          recognizer.onerror = () => {
            setIsListeningVoice(false);
          };

          recognizer.onend = () => {
            setIsListeningVoice(false);
          };

          speechRecognitionRef.current = recognizer;
        } catch {}
      }
    }
  }, []);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Lưu lịch sử vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FLOATING_CHAT, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  // Focus ô nhập khi mở popup
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const toggleVoiceInput = () => {
    if (!speechSupported || !speechRecognitionRef.current) {
      toast.info('Trình duyệt chưa hỗ trợ nhập liệu bằng giọng nói.');
      return;
    }

    if (isListeningVoice) {
      speechRecognitionRef.current.stop();
      setIsListeningVoice(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListeningVoice(true);
        toast.info('Đang lắng nghe câu hỏi của bạn...');
      } catch {
        setIsListeningVoice(false);
      }
    }
  };

  const handleSend = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text || !text.trim() || loading) return;

    const userText = text.trim();
    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const replyText = await queryAssistant({
        query: userText,
        messages: nextMessages,
        level: profile?.target_level || 'B1',
        currentPath,
      });

      const assistantMsg = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      toast.error('Lỗi phản hồi: ' + (err.message || 'Không thể kết nối trợ lý.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([initialWelcome]);
    localStorage.removeItem(STORAGE_KEY_FLOATING_CHAT);
    toast.success('Đã làm mới cuộc hội thoại với Elio.');
  };

  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    toast.success('Đã sao chép nội dung!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trích xuất các câu tiếng Đức ngắn để phát âm
  const handleSpeakText = (text) => {
    // Ưu tiên trích xuất các câu trong dấu ngoặc kép hoặc nghiêng
    const germanMatches = text.match(/\*(.*?)\*/);
    const textToSpeak = germanMatches ? germanMatches[1] : text.slice(0, 150);
    speakGerman(textToSpeak);
  };

  return (
    <>
      {/* 1. NÚT TRÒN NỔI GÓC MÀN HÌNH (FLOATING ACTION BUBBLE 24/7) */}
      {!isOpen && (
        <aside aria-label="Trợ lý ảo ELIO 24/7" className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
          <div className="relative group">
            {/* Hiệu ứng hào quang phát sáng nhẹ 24/7 */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent via-amber-500 to-accent opacity-75 blur-sm group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-accent via-accent/90 to-amber-600 text-accent-foreground shadow-2xl flex items-center justify-center border-2 border-white/25 hover:scale-105 active:scale-95 transition-all duration-300 tap"
              title="Hỏi Trợ lý ảo ELIO 24/7 (Bấm vào để hỏi đáp tức thì)"
            >
              <Bot className="w-7 h-7 text-white drop-shadow-md animate-bounce-subtle" />
              <Sparkles className="w-3.5 h-3.5 text-amber-200 absolute top-2 right-2 animate-spin-slow" />

              {/* Huy hiệu 24/7 Trực tuyến */}
              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 border border-white/40 text-[9px] font-mono font-bold text-white shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                24/7
              </span>
            </button>

            {/* Tooltip nổi giải thích khi di chuột */}
            <div className="absolute bottom-full right-0 mb-3 hidden group-hover:flex flex-col items-end pointer-events-none whitespace-nowrap">
              <div className="px-3 py-1.5 rounded-lg bg-card/95 border border-border shadow-xl backdrop-blur-md text-foreground text-xs font-mono font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-accent font-bold">ELIO 24/7:</span>
                <span>Cần hỏi gì? Bấm vào hỏi là trả lời ngay!</span>
              </div>
              <div className="w-2 h-2 bg-card border-r border-b border-border rotate-45 mr-6 -mt-1" />
            </div>
          </div>
        </aside>
      )}

      {/* 2. CỬA SỔ CHAT NỔI (FLOATING CHAT WINDOW) */}
      {isOpen && (
        <aside
          aria-label="Cửa sổ hội thoại Trợ lý ELIO 24/7"
          className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50 w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] h-[540px] max-h-[calc(100vh-100px)] flex flex-col rounded-2xl shadow-2xl border border-border/80 bg-card/95 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border/70 bg-muted/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent to-amber-500 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm text-foreground">Elio Assistant</h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    24/7 ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Gia sư tiếng Đức · Cấp độ {profile?.target_level || 'B1'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="tap p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Làm mới cuộc trò chuyện"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="tap p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Thu nhỏ trợ lý"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dải gợi ý nhanh (Quick Suggestions) */}
          <div className="px-3 py-2 border-b border-border/40 bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 ml-1" />
            {quickSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(s)}
                className="tap px-2.5 py-1 rounded-full bg-card hover:bg-accent/10 hover:text-accent hover:border-accent/30 border border-border text-[11px] font-mono text-muted-foreground shrink-0 transition-colors whitespace-nowrap shadow-xs"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Khung tin nhắn (Messages Area) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-[13px]">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isAssistant ? 'items-start' : 'items-end justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`group relative max-w-[85%] space-y-1 ${isAssistant ? '' : 'text-right'}`}>
                    <div
                      className={`p-3.5 rounded-2xl shadow-xs text-left leading-relaxed ${
                        isAssistant
                          ? 'bg-muted/40 border border-border/80 text-foreground rounded-tl-xs'
                          : 'bg-accent text-accent-foreground rounded-tr-xs font-medium'
                      }`}
                    >
                      {renderSimpleMarkdown(m.content)}
                    </div>

                    {/* Actions cho tin nhắn trợ lý (Phát âm, Sao chép) */}
                    {isAssistant && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5 px-1">
                        <span>{m.timestamp || ''}</span>
                        <button
                          type="button"
                          onClick={() => handleSpeakText(m.content)}
                          className="tap hover:text-accent flex items-center gap-0.5"
                          title="Nghe phát âm câu tiếng Đức"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Nghe</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.id, m.content)}
                          className="tap hover:text-accent flex items-center gap-0.5"
                          title="Sao chép nội dung"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === m.id ? 'Đã chép' : 'Chép'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Trạng thái đang soạn câu trả lời */}
            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground animate-pulse">
                <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  <span>Elio đang suy nghĩ câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Khung nhập tin nhắn (Input Bar) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border/70 bg-card shrink-0 space-y-1.5"
          >
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListeningVoice
                    ? 'Đang lắng nghe giọng nói của bạn...'
                    : 'Hỏi Elio về ngữ pháp, từ vựng, bài tập...'
                }
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-card focus:outline-none focus:ring-1 focus:ring-accent text-xs sm:text-sm text-foreground transition-all"
              />

              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`tap p-2.5 rounded-xl border transition-colors ${
                    isListeningVoice
                      ? 'bg-destructive text-white border-destructive animate-pulse'
                      : 'border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  title={isListeningVoice ? 'Dừng thu âm' : 'Nói câu hỏi bằng giọng nói'}
                >
                  {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="tap p-2.5 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-40 text-accent-foreground font-semibold shadow-sm transition-all"
                title="Gửi câu hỏi (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-1">
              <span>Bấm Enter để gửi</span>
              <span>⚡ Hoạt động 24/7 · Trực tiếp</span>
            </div>
          </form>
        </aside>
      )}
    </>
  );
}

export default FloatingAiAssistant;
