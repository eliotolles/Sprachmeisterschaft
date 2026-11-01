import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { SpeakButton } from '@/components/ui/SpeakButton';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Repeat,
  Volume2,
  Download,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  BookmarkPlus,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export function ListeningPlayerPage({ collectionId = 'nicos-weg-a1', videoId = 'nw-a1-ep1' }) {
  const { navigate } = useRouter();

  const collection = db.listening.getCollectionById(collectionId) || {
    id: collectionId,
    title: 'Nicos Weg — Trình độ A1',
  };
  const episodes = db.listening.getEpisodes(collectionId);
  const currentEpisode = db.listening.getEpisodeById(videoId) || episodes[0] || {
    id: videoId,
    title: 'Folge 1: Meine Muttersprache',
    youtubeId: '4-eDoThe6qo',
    subtitles: [],
  };

  // State
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'dictation' | 'shadowing' | 'quiz'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showGerman, setShowGerman] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [isLoopingLine, setIsLoopingLine] = useState(false);
  const [pauseWhileTyping, setPauseWhileTyping] = useState(true);
  const [showManualSubEditor, setShowManualSubEditor] = useState(false);
  const [manualSubText, setManualSubText] = useState('');
  const [learnedSubs, setLearnedSubs] = useState(new Set());

  // Dictation mode state
  const [typedInput, setTypedInput] = useState('');
  const [dictationChecked, setDictationChecked] = useState(false);

  // Quiz mode state
  const [quizAnswers, setQuizAnswers] = useState({});

  const currentSub = currentEpisode.subtitles?.[activeSubIndex] || {
    start: 0,
    end: 5,
    de: 'Chưa có phụ đề.',
    vi: '',
  };

  const iframeRef = useRef(null);

  // Jump to timestamp
  const handleSeekTo = (seconds, index) => {
    setActiveSubIndex(index);
    if (iframeRef.current) {
      // Post message to YouTube iframe API
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      );
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
    }
  };

  const handleCopyTranscript = () => {
    const text = (currentEpisode.subtitles || [])
      .map((s) => `${s.de} (${s.vi})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép toàn bộ lời thoại vào clipboard!');
  };

  const handleSaveSentenceAsCard = (sub) => {
    db.vocabulary.create({
      german: sub.de,
      vietnamese: sub.vi || 'Mẫu câu luyện nghe',
      level: currentEpisode.level || 'B1',
      topic: collection.title,
    });
    toast.success('Đã lưu câu này vào Thẻ từ vựng cá nhân!');
  };

  const handleToggleLearned = (subId) => {
    setLearnedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  // Export Subtitles
  const handleDownloadSRT = () => {
    let srt = '';
    (currentEpisode.subtitles || []).forEach((s, idx) => {
      const startMin = String(Math.floor(s.start / 60)).padStart(2, '0');
      const startSec = String(s.start % 60).padStart(2, '0');
      const endMin = String(Math.floor(s.end / 60)).padStart(2, '0');
      const endSec = String(s.end % 60).padStart(2, '0');
      srt += `${idx + 1}\n00:${startMin}:${startSec},000 --> 00:${endMin}:${endSec},000\n${s.de}\n${s.vi}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEpisode.title}.srt`;
    a.click();
    toast.success('Đã tải xuống file phụ đề .SRT!');
  };

  return (
    <div className="space-y-4 animate-rise max-w-7xl mx-auto">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pb-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Link to="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/skills/listening" className="hover:text-accent">
            Kỹ năng nghe
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{collection.title}</span>
          <span>/</span>
          <span className="text-accent truncate max-w-xs">{currentEpisode.title}</span>
        </div>

        <Link
          to="/skills/listening"
          className="tap inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh sách tập</span>
        </Link>
      </div>

      {/* 4 Mode Tabs (Matching Image 4) */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {[
          { id: 'video', label: 'Xem video', icon: Play },
          { id: 'dictation', label: 'Chép chính tả', icon: FileText },
          { id: 'shadowing', label: 'Shadowing', icon: Repeat },
          { id: 'quiz', label: 'Quiz', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tap px-3.5 py-1.5 rounded-sm text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN STUDIO GRID (2 Columns matching Image 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Video Player & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* YouTube Embed Player */}
          <div className="surface overflow-hidden border border-border shadow-md aspect-video relative bg-black">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${currentEpisode.youtubeId}?enablejsapi=1&rel=0&modestbranding=1`}
              title={currentEpisode.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Under-video Controls Bar (Matching Image 4) */}
          <div className="surface p-4 border border-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Playback speed buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSeekTo(Math.max(0, currentSub.start - 5), activeSubIndex)}
                  className="tap px-2 py-1 rounded-sm border border-border bg-card text-[11px] font-mono hover:bg-muted"
                  title="Tua lùi 5 giây"
                >
                  - Tua 5s
                </button>
                <button
                  onClick={() => handleSeekTo(currentSub.start, activeSubIndex)}
                  className="tap px-2 py-1 rounded-sm border border-border bg-card text-[11px] font-mono hover:bg-muted flex items-center gap-1"
                  title="Lặp lại câu này"
                >
                  <Repeat className="w-3 h-3 text-accent" />
                  <span>Lặp đoạn</span>
                </button>
                <button
                  onClick={() => {
                    const nextIdx = Math.min(
                      (currentEpisode.subtitles || []).length - 1,
                      activeSubIndex + 1
                    );
                    const nextSub = currentEpisode.subtitles[nextIdx];
                    if (nextSub) handleSeekTo(nextSub.start, nextIdx);
                  }}
                  className="tap px-2 py-1 rounded-sm bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono hover:bg-accent/20 font-semibold"
                >
                  Phát tiếp →
                </button>
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-muted-foreground">Tốc độ:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="px-2 py-0.5 rounded-sm border border-border bg-card text-foreground font-mono font-bold"
                >
                  <option value={0.5}>0.5x (Rất chậm)</option>
                  <option value={0.75}>0.75x (Chậm)</option>
                  <option value={1}>1.0x (Chuẩn)</option>
                  <option value={1.25}>1.25x (Nhanh)</option>
                  <option value={1.5}>1.5x (Rất nhanh)</option>
                </select>
              </div>
            </div>

            {/* Subtitle helper actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-[11px] font-mono text-muted-foreground">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pauseWhileTyping}
                  onChange={(e) => setPauseWhileTyping(e.target.checked)}
                  className="rounded-sm border-border text-accent focus:ring-accent"
                />
                <span>Tự động tạm dừng khi gõ</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSRT}
                  className="hover:text-accent flex items-center gap-1 p-1 hover:bg-muted rounded-sm"
                  title="Tải phụ đề định dạng .SRT"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải SRT</span>
                </button>

                <button
                  onClick={() => setShowManualSubEditor(!showManualSubEditor)}
                  className="hover:text-accent flex items-center gap-1 p-1 hover:bg-muted rounded-sm text-accent"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Nhập phụ đề thủ công</span>
                </button>
              </div>
            </div>

            {/* Collapsible Manual Subtitle Editor */}
            {showManualSubEditor && (
              <div className="pt-3 border-t border-border animate-fade-in space-y-2">
                <div className="text-xs font-mono font-medium text-foreground">
                  Dán phụ đề SRT / VTT hoặc văn bản thô (Mỗi dòng một câu):
                </div>
                <textarea
                  rows={4}
                  value={manualSubText}
                  onChange={(e) => setManualSubText(e.target.value)}
                  placeholder={`0:05 - Wie lange lernen Sie schon Deutsch?\n0:08 - Ich lerne seit einem Jahr Deutsch.\n0:14 - Richtig, ich weiß, dass man das so sagt...`}
                  className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-border bg-card text-foreground"
                />
                <button
                  onClick={() => {
                    toast.success('Đã lưu phụ đề bổ sung!');
                    setShowManualSubEditor(false);
                  }}
                  className="tap px-3 py-1 rounded-sm bg-accent text-accent-foreground text-xs font-mono font-semibold"
                >
                  Áp dụng phụ đề
                </button>
              </div>
            )}
          </div>

          {/* Mode 2: Dictation / Chép chính tả box */}
          {activeTab === 'dictation' && (
            <div className="surface p-5 border border-accent/40 shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="eyebrow">CHẾ ĐỘ CHÉP CHÍNH TẢ (DIKTAT)</div>
                <span className="text-xs font-mono text-muted-foreground">
                  Câu #{activeSubIndex + 1}
                </span>
              </div>
              <p className="font-heading italic text-xs text-muted-foreground">
                Hãy nghe kỹ câu thoại vừa rồi và gõ lại chính xác từng từ tiếng Đức:
              </p>
              <textarea
                rows={2}
                value={typedInput}
                onChange={(e) => {
                  setTypedInput(e.target.value);
                  setDictationChecked(false);
                }}
                placeholder="Gõ lại câu tiếng Đức bạn vừa nghe thấy..."
                className="w-full px-3 py-2 text-sm font-mono rounded-sm border border-border bg-card text-foreground focus:ring-1 focus:ring-accent"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleSeekTo(currentSub.start, activeSubIndex)}
                  className="tap px-3 py-1.5 rounded-sm border border-border text-xs font-mono flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nghe lại câu</span>
                </button>
                <button
                  onClick={() => setDictationChecked(true)}
                  className="tap px-4 py-1.5 rounded-sm bg-accent text-accent-foreground font-mono text-xs font-semibold"
                >
                  Kiểm tra đáp án
                </button>
              </div>

              {dictationChecked && (
                <div className="mt-3 p-3 rounded-sm bg-muted/50 border border-border text-xs font-mono animate-fade-in">
                  <div className="font-bold text-foreground mb-1">Đáp án chuẩn:</div>
                  <div className="text-accent font-semibold">{currentSub.de}</div>
                  <div className="text-muted-foreground italic mt-0.5">{currentSub.vi}</div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Quiz trắc nghiệm */}
          {activeTab === 'quiz' && (
            <div className="surface p-5 border border-border shadow-md space-y-4 animate-fade-in">
              <div className="eyebrow">TRẮC NGHIỆM ĐỌC HIỂU NỘI DUNG BÀI NGHE</div>
              {(currentEpisode.quiz || []).length > 0 ? (
                currentEpisode.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2 pb-3 border-b border-border last:border-0">
                    <div className="font-heading font-semibold text-sm text-foreground">
                      {qIdx + 1}. {q.question}
                    </div>
                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = quizAnswers[qIdx] === optIdx;
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx })}
                            className={`tap w-full text-left p-2.5 rounded-sm text-xs font-mono border transition-all ${
                              isChosen
                                ? isCorrect
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                                  : 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                                : 'border-border bg-card hover:bg-muted text-foreground'
                            }`}
                          >
                            <span>{String.fromCharCode(65 + optIdx)}. </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {quizAnswers[qIdx] !== undefined && (
                      <p className="text-[11px] font-body text-muted-foreground italic pt-1">
                        Giải thích: {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs font-body text-muted-foreground">
                  Tập phim này chưa có câu hỏi Quiz. Bạn có thể tự do luyện nghe và chép chính tả!
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Subtitle Transcript (5 cols matching Image 4) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="surface p-4 border border-border shadow-md flex flex-col h-[640px]">
            {/* Header with collection & episode name */}
            <div className="pb-3 border-b border-border mb-3">
              <div className="eyebrow mb-0.5">BỘ VIDEO: {collection.title}</div>
              <h3 className="font-display text-lg font-bold text-foreground leading-snug">
                {currentEpisode.title}
              </h3>

              {/* Subtitle toggle switches */}
              <div className="flex items-center justify-between pt-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGerman(!showGerman)}
                    className={`tap px-2 py-1 rounded-sm border text-[11px] flex items-center gap-1 ${
                      showGerman
                        ? 'bg-accent/10 border-accent/30 text-accent font-semibold'
                        : 'border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    {showGerman ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{showGerman ? 'Hiện tiếng Đức' : 'Ẩn tiếng Đức'}</span>
                  </button>

                  <button
                    onClick={() => setShowVietnamese(!showVietnamese)}
                    className={`tap px-2 py-1 rounded-sm border text-[11px] flex items-center gap-1 ${
                      showVietnamese
                        ? 'bg-accent/10 border-accent/30 text-accent font-semibold'
                        : 'border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    {showVietnamese ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{showVietnamese ? 'Hiện tiếng Việt' : 'Ẩn tiếng Việt'}</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyTranscript}
                  className="tap text-muted-foreground hover:text-accent p-1"
                  title="Sao chép toàn bộ lời thoại"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Timeline List (Matching Image 4 styling) */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(currentEpisode.subtitles || []).map((sub, idx) => {
                const isActive = activeSubIndex === idx;
                const isLearned = learnedSubs.has(sub.id);
                const minutes = Math.floor(sub.start / 60);
                const seconds = String(sub.start % 60).padStart(2, '0');
                const timeLabel = `${minutes}:${seconds}`;

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSeekTo(sub.start, idx)}
                    className={`tap p-3 rounded-sm border transition-all cursor-pointer group flex items-start justify-between gap-2 ${
                      isActive
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-border bg-card/60 hover:bg-muted/50 hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Timestamp Badge */}
                      <span className="font-mono text-xs font-bold text-accent shrink-0 mt-0.5">
                        {timeLabel}
                      </span>

                      {/* Subtitle Content */}
                      <div className="min-w-0">
                        {showGerman && (
                          <div
                            className={`font-heading text-xs font-medium text-foreground leading-relaxed ${
                              isActive ? 'font-bold text-accent' : ''
                            }`}
                          >
                            {sub.de}
                          </div>
                        )}
                        {showVietnamese && sub.vi && (
                          <div className="font-body text-[11px] text-muted-foreground italic mt-0.5">
                            {sub.vi}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLearned(sub.id);
                        }}
                        className={`p-1 rounded-sm hover:bg-muted ${
                          isLearned ? 'text-emerald-600 font-bold' : 'text-muted-foreground'
                        }`}
                        title="Đánh dấu đã hiểu câu này"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveSentenceAsCard(sub);
                        }}
                        className="p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-accent"
                        title="Lưu câu này vào Thẻ từ vựng để ôn tập"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom episode switchers */}
            <div className="pt-3 border-t border-border mt-2 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">
                Tổng cộng: {(currentEpisode.subtitles || []).length} câu thoại
              </span>

              <div className="flex items-center gap-1.5">
                {episodes.map((ep, i) => (
                  <button
                    key={ep.id}
                    onClick={() => navigate(`/skills/listening/${collectionId}/${ep.id}`)}
                    className={`px-2 py-0.5 rounded-sm border text-[11px] font-mono ${
                      ep.id === videoId
                        ? 'bg-accent text-accent-foreground font-bold'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tập {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ListeningPlayerPage;
