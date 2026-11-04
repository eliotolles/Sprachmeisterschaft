import { LookupText } from '@/components/vocabulary/WordDetail';
import {renderLessonMarkdown} from '@/lib/lesson-markdown.js';
import React, { useState, useEffect, useRef } from 'react';
import {newGrammarBinding,grammarCoreActive} from '@/lib/elio-grammar-runtime';
import { db } from '@/lib/db';
import { LevelFilter } from '@/components/ui/LevelFilter';
import { GRAMMAR_CORE } from '@/data/grammar';
import { GRAMMAR_EXTRA } from '@/data/grammar-extra';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  Plus,
  BookOpen,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { toast } from 'sonner';
import { showConfirmModal } from '@/components/ui/ConfirmModal';

export function GrammarStudio({ onBack }) {
  const coreActive=grammarCoreActive(), [core]=useState(newGrammarBinding);
  const [catalog,setCatalog]=useState([]),[lesson,setLesson]=useState(null),[exerciseIndex,setExerciseIndex]=useState(0),[feedbacks,setFeedbacks]=useState({});
  const [grading,setGrading]=useState(false); const generation=useRef(0),inFlight=useRef(false);
  const isAdmin = !coreActive && db.auth.isAdmin();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dbTopics, setDbTopics] = useState(() => coreActive?[]:db.universal.findMany({ type: 'grammar' }));
  const [deletedIds, setDeletedIds] = useState(() => db.grammar?.getDeletedIds?.() || []);
  const [overrides, setOverrides] = useState(() => db.grammar?.getOverrides?.() || {});
  const [editingTopic, setEditingTopic] = useState(null);

  useEffect(() => {
    const handleDbChange = () => {
      if(coreActive)return;
      setDbTopics(db.universal.findMany({ type: 'grammar' }));
      setDeletedIds(db.grammar?.getDeletedIds?.() || []);
      setOverrides(db.grammar?.getOverrides?.() || {});
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

  const allGrammar = coreActive?catalog.map(r=>({id:r.key,title_vi:r.title,title_de:r.title,level:r.level,rule:'',examples:[],source:r})): [...importedGrammarList, ...GRAMMAR_CORE, ...GRAMMAR_EXTRA]
    .filter((g) => !deletedIds.includes(g.id))
    .map((g) => {
      if (overrides[g.id]) {
        return { ...g, ...overrides[g.id] };
      }
      return g;
    });

  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTopicId, setActiveTopicId] = useState(allGrammar[0]?.id || 'a1_g1');

  // Exercise state per topic
  const [userAnswers, setUserAnswers] = useState({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState({});

  useEffect(()=>{
    if(!coreActive)return;let cancelled=false;
    const load=async()=>{generation.current++;core.reset();setCatalog([]);setLesson(null);setFeedbacks({});setUserAnswers({});setExerciseSubmitted({});setGrading(false);inFlight.current=false;try{const rows=await core.catalog();if(!cancelled){setCatalog(rows);setActiveTopicId(rows[0]?.key||'');}}catch(e){if(!cancelled&&e.code!=='ACCOUNT_CHANGED')toast.error(e.message);}};
    load();window.addEventListener('sprach_auth_change',load);window.addEventListener('sprach_core_imported',load);
    return()=>{cancelled=true;generation.current++;core.reset();window.removeEventListener('sprach_auth_change',load);window.removeEventListener('sprach_core_imported',load);};
  },[coreActive]);
  useEffect(()=>{
    if(!coreActive)return;const row=catalog.find(r=>r.key===activeTopicId);const current=++generation.current;setLesson(null);setExerciseIndex(0);inFlight.current=false;setGrading(false);
    if(row)core.lesson(row).then(r=>{if(current===generation.current)setLesson(r);}).catch(e=>{if(current===generation.current&&e.code!=='ACCOUNT_CHANGED')toast.error(e.message);});
    return()=>{generation.current++;};
  },[coreActive,activeTopicId,catalog]);
  const answerKey=id=>coreActive?`${id}:${lesson?.exercises[exerciseIndex]?.id}:${lesson?.exercises[exerciseIndex]?.revision}`:id;

  const handleDeleteTopic = async (topicId, topicTitle) => {
    const ok = await showConfirmModal({
      title: 'Xóa chủ điểm ngữ pháp',
      message: `Bạn có chắc muốn xóa chủ điểm ngữ pháp "${topicTitle}" không?`,
      confirmText: 'Xóa chủ điểm',
      variant: 'danger',
    });
    if (ok) {
      db.grammar.delete(topicId);
      toast.success(`Đã xóa chủ điểm: "${topicTitle}"!`);
    }
  };

  const handleResetGrammar = async () => {
    const ok = await showConfirmModal({
      title: 'Khôi phục ngữ pháp gốc',
      message: 'Khôi phục lại toàn bộ 100 chủ đề ngữ pháp gốc của hệ thống?',
      confirmText: 'Khôi phục gốc',
      variant: 'warning',
    });
    if (ok) {
      db.grammar.resetDefaults();
      toast.success('Đã khôi phục ngữ pháp gốc!');
    }
  };

  const handleSaveTopicEdit = (e) => {
    e.preventDefault();
    if (!editingTopic) return;

    db.grammar.update(editingTopic.id, {
      title_vi: editingTopic.title_vi,
      title_de: editingTopic.title_de,
      level: editingTopic.level,
      rule: editingTopic.rule,
      exercise: {
        ...(editingTopic.exercise || {}),
        question: editingTopic.exercise?.question || '',
        answer: editingTopic.exercise?.answer || '',
        explanation: editingTopic.exercise?.explanation || '',
      },
    });

    setEditingTopic(null);
    toast.success('Đã lưu chỉnh sửa chủ điểm ngữ pháp!');
  };

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

  const selectedTopic = allGrammar.find((t) => t.id === activeTopicId) || filteredTopics[0] || allGrammar[0];
  const sourceExercise=lesson?.exercises[exerciseIndex],sourceFeedback=feedbacks[answerKey(selectedTopic?.id)];
  const activeTopic=coreActive&&selectedTopic?{...selectedTopic,rule:lesson?.content||'Đang tải bài học từ server…',exercise:sourceExercise?{...sourceExercise,answer:sourceFeedback?.acceptedAnswers?.[0],explanation:sourceFeedback?.explanation||''}:null}:selectedTopic;

  const handleSelectAnswer = (topicId, opt) => {
    if (exerciseSubmitted[answerKey(topicId)]) return;
    setUserAnswers((prev) => ({ ...prev, [answerKey(topicId)]: opt }));
  };

  const handleCheckExercise = async (topicId) => {
    const chosen = userAnswers[answerKey(topicId)];
    if (!chosen || !activeTopic?.exercise) return;

    if(coreActive){if(inFlight.current||!lesson||!sourceExercise)return;const current=generation.current,key=answerKey(topicId);inFlight.current=true;setGrading(true);try{const feedback=await core.submit(lesson,sourceExercise,chosen);if(current===generation.current){setFeedbacks(p=>({...p,[key]:feedback}));setExerciseSubmitted(p=>({...p,[key]:true}));window.dispatchEvent(new CustomEvent('sprach_db_change'));toast[feedback.correct?'success':'error'](feedback.correct?'Chính xác!':'Chưa chính xác, hãy xem đáp án nguồn.');}}catch(e){if(current===generation.current)toast.error(e.message);}finally{if(current===generation.current){inFlight.current=false;setGrading(false);}}return;}
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
          {isAdmin && (
            <button
              onClick={handleResetGrammar}
              className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted text-muted-foreground flex items-center gap-1.5"
              title="Khôi phục danh sách ngữ pháp gốc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục gốc</span>
            </button>
          )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
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
              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingTopic({ ...activeTopic })}
                    className="tap px-2.5 py-1 text-xs font-mono rounded border border-border bg-card hover:bg-muted text-foreground flex items-center gap-1 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(activeTopic.id, activeTopic.title_vi)}
                    className="tap px-2.5 py-1 text-xs font-mono rounded border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 flex items-center gap-1 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rule / Theory Content */}
            <div className="p-4 rounded-sm border border-border bg-card/60 space-y-2">
              <div className="text-xs font-mono text-accent font-semibold uppercase tracking-wider">
                Quy tắc ngữ pháp
              </div>
              <div className="font-body text-xs md:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {renderLessonMarkdown(React,activeTopic.rule)}
              </div>
            </div>

            {coreActive && lesson && lesson.exercises.length>0 && (
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <button type="button" disabled={grading||exerciseIndex===0} onClick={()=>setExerciseIndex(i=>i-1)} className="tap px-3 py-1.5 rounded-sm border border-border bg-card disabled:opacity-50">Bài trước</button>
                <span>Bài {exerciseIndex+1}/{lesson.exercises.length}</span>
                <button type="button" disabled={grading||exerciseIndex>=lesson.exercises.length-1} onClick={()=>setExerciseIndex(i=>i+1)} className="tap px-3 py-1.5 rounded-sm border border-border bg-card disabled:opacity-50">Bài tiếp</button>
              </div>
            )}
            {/* Examples if present */}
            {activeTopic.examples && activeTopic.examples.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Ví dụ mẫu câu
                </div>
                {activeTopic.examples.map((ex, i) => (
                  <div key={i} className="p-3 rounded-sm border border-border bg-muted/20 text-xs space-y-0.5">
                    <div className="font-heading font-semibold text-foreground">
                      <LookupText text={ex.de} translation={ex.vi} />
                    </div>
                    <div className="font-body text-muted-foreground italic">
                      → {ex.vi}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {coreActive && lesson && (
              <details className="p-4 rounded-sm border border-border bg-card/60">
                <summary className="text-xs font-mono text-accent cursor-pointer">Mindmap · {lesson.title}</summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {lesson.mindmap.groups.map((group,index)=><div key={index} className="text-xs space-y-2"><strong>{['Cách dùng','Cấu trúc','Ví dụ','Lưu ý','Nội dung khác'][index]}</strong>{group.map((section,i)=><div key={i}><strong>{section.title}</strong><p className="whitespace-pre-wrap">{section.body}</p></div>)}</div>)}
                </div>
              </details>
            )}
            {/* Practice Exercise */}
            {activeTopic.exercise && (
              <div className="surface p-5 border-accent/30 space-y-3 bg-accent/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-accent font-semibold uppercase tracking-wider">
                    Bài tập thực hành chấm ngay
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {coreActive?'Chấm theo đáp án nguồn':'+10 XP khi đúng'}
                  </span>
                </div>

                <p className="font-heading font-semibold text-sm text-foreground">
                  {activeTopic.exercise.question}
                </p>

                {coreActive && sourceExercise?.type !== 'quiz' && (
                  <input aria-label="Đáp án ngữ pháp" type="text" value={userAnswers[answerKey(activeTopic.id)]||''} disabled={grading||exerciseSubmitted[answerKey(activeTopic.id)]} onChange={e=>handleSelectAnswer(activeTopic.id,e.target.value)} className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground" />
                )}
                {coreActive && sourceExercise?.tokens && <p className="text-xs font-mono">{sourceExercise.tokens.join(' · ')}</p>}
                {activeTopic.exercise.options && activeTopic.exercise.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeTopic.exercise.options.map((opt) => {
                      const isSelected = userAnswers[answerKey(activeTopic.id)] === opt;
                      const isSubmitted = exerciseSubmitted[answerKey(activeTopic.id)];
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
                          disabled={isSubmitted || grading}
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

                {!exerciseSubmitted[answerKey(activeTopic.id)] ? (
                  <button
                    type="button"
                    disabled={grading || !userAnswers[answerKey(activeTopic.id)]}
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

      {/* Admin Edit Modal */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 rounded-sm border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="eyebrow">Quản trị viên</span>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Chỉnh sửa chủ điểm: {editingTopic.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopicEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Tên tiếng Việt *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTopic.title_vi || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, title_vi: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Cấp độ (CEFR) *
                  </label>
                  <select
                    value={editingTopic.level || 'B1'}
                    onChange={(e) => setEditingTopic({ ...editingTopic, level: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên tiếng Đức / Chủ điểm
                </label>
                <input
                  type="text"
                  value={editingTopic.title_de || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, title_de: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Quy tắc & Giải thích lý thuyết *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingTopic.rule || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, rule: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-border bg-card text-foreground font-sans leading-relaxed"
                />
              </div>

              <div className="p-3 border border-border rounded-sm bg-muted/20 space-y-2">
                <span className="font-mono text-accent font-semibold uppercase text-[10px]">
                  Bài tập mẫu kèm theo
                </span>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">Câu hỏi</label>
                  <input
                    type="text"
                    value={editingTopic.exercise?.question || ''}
                    onChange={(e) =>
                      setEditingTopic({
                        ...editingTopic,
                        exercise: { ...(editingTopic.exercise || {}), question: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1 rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">Đáp án đúng</label>
                  <input
                    type="text"
                    value={editingTopic.exercise?.answer || ''}
                    onChange={(e) =>
                      setEditingTopic({
                        ...editingTopic,
                        exercise: { ...(editingTopic.exercise || {}), answer: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1 rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">Giải thích</label>
                  <input
                    type="text"
                    value={editingTopic.exercise?.explanation || ''}
                    onChange={(e) =>
                      setEditingTopic({
                        ...editingTopic,
                        exercise: { ...(editingTopic.exercise || {}), explanation: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1 rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted font-mono"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="tap px-4 py-1.5 rounded-sm bg-accent text-accent-foreground font-mono font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default GrammarStudio;
