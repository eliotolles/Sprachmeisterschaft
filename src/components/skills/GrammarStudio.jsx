import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { LevelFilter } from '@/components/ui/LevelFilter';
import { GRAMMAR_CORE } from '@/data/grammar';
import { GRAMMAR_EXTRA } from '@/data/grammar-extra';
import { FileText, CheckCircle2, XCircle, Search, Sparkles, Plus, BookOpen } from 'lucide-react';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { toast } from 'sonner';

export function GrammarStudio({ onBack }) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dbTopics, setDbTopics] = useState(() => db.universal.findMany({ type: 'grammar' }));

  useEffect(() => {
    const handleDbChange = () => {
      setDbTopics(db.universal.findMany({ type: 'grammar' }));
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  // Format imported topics
  const importedGrammarList = dbTopics.map((item) => ({
    id: item.id,
    level: item.level || 'B1',
    title_vi: item.data?.title_vi || item.title,
    title_de: item.data?.title_de || item.title,
    rule: item.data?.rule || (typeof item.data === 'string' ? item.data : ''),
    examples: item.data?.examples || [],
    exercise: item.data?.exercises?.[0] || {
      question: 'Bài tập ôn tập chủ điểm này.',
      options: ['Đúng', 'Sai', 'Chưa rõ'],
      answer: 'Đúng',
      explanation: 'Nội dung thuộc chủ điểm do người dùng/quản trị viên nạp vào hệ thống.',
    },
    isImported: true,
  }));

  const allGrammar = [...importedGrammarList, ...GRAMMAR_CORE, ...GRAMMAR_EXTRA];

  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTopicId, setActiveTopicId] = useState(allGrammar[0]?.id || 'a1_g1');

  // Exercise state per topic
  const [userAnswers, setUserAnswers] = useState({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState({});

  const filteredTopics = allGrammar.filter((t) => {
    if (selectedLevel !== 'ALL' && t.level !== selectedLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.title_vi.toLowerCase().includes(q) ||
        t.title_de.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeTopic = allGrammar.find((t) => t.id === activeTopicId) || filteredTopics[0] || allGrammar[0];

  const handleSelectAnswer = (topicId, opt) => {
    if (exerciseSubmitted[topicId]) return;
    setUserAnswers((prev) => ({ ...prev, [topicId]: opt }));
  };

  const handleCheckExercise = (topicId) => {
    const chosen = userAnswers[topicId];
    if (!chosen || !activeTopic?.exercise) return;

    const isCorrect = chosen === activeTopic.exercise.answer;
    setExerciseSubmitted((prev) => ({ ...prev, [topicId]: true }));

    const score = isCorrect ? 100 : 0;
    db.skillSessions.create({
      skill: 'grammar',
      score,
      title: `Grammatik — ${activeTopic.title_vi}`,
      details: isCorrect ? 'Trả lời chính xác bài tập ngữ pháp' : 'Trả lời chưa đúng, xem giải thích',
      duration_seconds: 60,
    });

    db.studyLogs.recordActivity({
      xp: isCorrect ? 10 : 2,
      minutes: 1,
    });

    if (isCorrect) {
      toast.success('Chính xác! +10 XP');
    } else {
      toast.error('Chưa chính xác, hãy đọc phần giải thích bên dưới.');
    }
  };

  return (
    <div className="surface p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-rise">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-3">
        <div>
          <div className="eyebrow">Grammatik-Werkstatt</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Hệ thống {allGrammar.length} chủ đề Ngữ pháp A1–C2
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="tap px-3 py-1.5 text-xs font-mono rounded-sm bg-accent text-accent-foreground font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Ngữ pháp</span>
          </button>
          <button
            onClick={onBack}
            className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted"
          >
            ← Trở lại danh sách
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <LevelFilter
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          includeAll={true}
        />

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm chủ đề ngữ pháp..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-sm border border-border bg-card text-foreground"
          />
        </div>
      </div>

      {/* Layout: Topic list sidebar + Detail pane */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Left: Topics List */}
        <div className="md:col-span-1 max-h-[520px] overflow-y-auto space-y-1 pr-1 border-r border-border">
          {filteredTopics.map((t) => {
            const isActive = t.id === activeTopic?.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTopicId(t.id)}
                className={`tap w-full p-2.5 text-left rounded-sm text-xs transition-colors flex items-start gap-2 ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'hover:bg-muted/50 text-foreground/80'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75 shrink-0 mt-0.5">
                  {t.level}
                </span>
                <span className="truncate flex-1">{t.title_vi}</span>
                {t.isImported && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono shrink-0">
                    Mới
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Topic Content & Live Quiz */}
        {activeTopic ? (
          <div className="md:col-span-2 space-y-5">
            <div className="space-y-1">
              <div className="eyebrow flex items-center gap-2">
                <span>{activeTopic.level} • {activeTopic.title_de}</span>
                {activeTopic.isImported && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                    Tài liệu đã import
                  </span>
                )}
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                {activeTopic.title_vi}
              </h3>
            </div>

            {/* Rule / Theory Content */}
            <div className="p-4 rounded-sm border border-border bg-card/60 space-y-2">
              <div className="text-xs font-mono text-accent font-semibold uppercase tracking-wider">
                Quy tắc ngữ pháp
              </div>
              <div className="font-body text-xs md:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {activeTopic.rule}
              </div>
            </div>

            {/* Examples if present */}
            {activeTopic.examples && activeTopic.examples.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Ví dụ mẫu câu
                </div>
                {activeTopic.examples.map((ex, i) => (
                  <div key={i} className="p-3 rounded-sm border border-border bg-muted/20 text-xs space-y-0.5">
                    <div className="font-heading font-semibold text-foreground">
                      {ex.de}
                    </div>
                    <div className="font-body text-muted-foreground italic">
                      → {ex.vi}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Practice Exercise */}
            {activeTopic.exercise && (
              <div className="surface p-5 border-accent/30 space-y-3 bg-accent/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-accent font-semibold uppercase tracking-wider">
                    Bài tập thực hành chấm ngay
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    +10 XP khi đúng
                  </span>
                </div>

                <p className="font-heading font-semibold text-sm text-foreground">
                  {activeTopic.exercise.question}
                </p>

                {activeTopic.exercise.options && activeTopic.exercise.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeTopic.exercise.options.map((opt) => {
                      const isSelected = userAnswers[activeTopic.id] === opt;
                      const isSubmitted = exerciseSubmitted[activeTopic.id];
                      const isCorrect = opt === activeTopic.exercise.answer;

                      let optStyle = 'border-border bg-card text-foreground hover:bg-muted';
                      if (isSubmitted) {
                        if (isCorrect) {
                          optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
                        } else if (isSelected) {
                          optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200';
                        }
                      } else if (isSelected) {
                        optStyle = 'border-accent bg-accent/10 text-accent font-semibold';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectAnswer(activeTopic.id, opt)}
                          className={`tap p-2.5 rounded-sm border text-xs text-left transition-colors flex items-center justify-between ${optStyle}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {isSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {!exerciseSubmitted[activeTopic.id] ? (
                  <button
                    type="button"
                    disabled={!userAnswers[activeTopic.id]}
                    onClick={() => handleCheckExercise(activeTopic.id)}
                    className="tap w-full py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm mt-2"
                  >
                    Kiểm tra kết quả
                  </button>
                ) : (
                  <div className="p-3 rounded-sm bg-card border border-border text-xs space-y-1 animate-rise">
                    <div className="font-mono font-semibold text-accent">
                      Giải thích đáp án:
                    </div>
                    <p className="font-body text-muted-foreground leading-relaxed">
                      {activeTopic.exercise.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="md:col-span-2 text-center py-12 text-muted-foreground text-xs font-mono">
            Không tìm thấy chủ đề phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>

      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="grammar"
        onSuccess={() => {
          setDbTopics(db.universal.findMany({ type: 'grammar' }));
        }}
      />
    </div>
  );
}
export default GrammarStudio;
