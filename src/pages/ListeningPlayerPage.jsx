import React, { useState, useEffect, useRef } from 'react';
import { getYouTubeTranscript } from '@/lib/youtube-transcript-extractor';
import {elioClient} from '@/lib/elio-auth-runtime';
import { db } from '@/lib/db';
import {elioListening,listeningCoreActive} from '@/lib/elio-listening-runtime';
import { useRouter, Link } from '@/lib/router';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { auditDictationSentence } from '@/lib/ai-evaluator';
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
  ArrowRight,
  Check,
  SkipBack,
  SkipForward,
  Square,
  Flame,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { showConfirmModal } from '@/components/ui/ConfirmModal';

export function ListeningPlayerPage({ collectionId = 'nicos-weg-a1', videoId = 'nw-a1-ep1' }) {
  const { navigate } = useRouter();
  const isAdmin = db.auth.isAdmin();
  const currentUser = db.auth.getUser();
  const coreActive=listeningCoreActive();
  const [,refreshCore]=useState(0);
  const [coreSaving,setCoreSaving]=useState(false);
  const coreEpoch=useRef(0),coreBusy=useRef(false);
  useEffect(()=>{const update=()=>{coreEpoch.current++;coreBusy.current=false;setCoreSaving(false);setTypedInput('');setDictationAudit(null);setDictationChecked(false);setLearnedSubs(new Set());refreshCore(n=>n+1);};if(!coreActive)return;window.addEventListener('sprach_listening_change',update);return()=>{coreEpoch.current++;window.removeEventListener('sprach_listening_change',update);};},[coreActive,collectionId,videoId]);
  const [editingEpisode, setEditingEpisode] = useState(null);

  const collection = db.listening.getCollectionById(collectionId) || {
    id: collectionId,
    title: 'Nicos Weg — Trình độ A1',
  };
  const episodes = db.listening.getEpisodes(collectionId);
  const currentEpisode = db.listening.getEpisodeById(videoId) || episodes.find(e => e.id === videoId) || episodes[0] || {
    id: videoId,
    title: 'Folge 1: Meine Muttersprache',
    youtubeId: '4-eDoThe6qo',
    subtitles: [],
  };

  const [captionBusy,setCaptionBusy]=useState(false);
  const [preview,setPreview]=useState(null);
  const captionScope=JSON.stringify([currentUser?.id,collectionId,currentEpisode.id,currentEpisode.youtubeId]);
  const captionScopeRef=useRef(captionScope);
  captionScopeRef.current=captionScope;
  const subtitles = preview?.scope===captionScope ? preview.cues : (currentEpisode.subtitles && currentEpisode.subtitles.length ? currentEpisode.subtitles : []);
  const fetchCaptions=async()=>{
    if(captionBusy||!currentEpisode.youtubeId)return;
    setCaptionBusy(true);
    try{
      const result = await getYouTubeTranscript(currentEpisode.youtubeId, 'de');
      if(captionScopeRef.current!==captionScope)return;
      if(result && result.available && Array.isArray(result.cues) && result.cues.length > 0){
        const cues = result.cues.map(c => ({
          start: c.start,
          end: c.end,
          de: c.text,
          vi: ''
        }));
        // Lưu phụ đề vào database cục bộ
        db.listening.updateEpisode(currentEpisode.id, { subtitles: cues });
        setPreview({scope:captionScope, cues});
        toast.success('Đã tải và lưu ' + cues.length + ' đoạn phụ đề tiếng Đức.');
      } else {
        throw Error(result?.reason || 'Chưa lấy được phụ đề tự động cho video này.');
      }
    }catch(error){
      if(captionScopeRef.current===captionScope)toast.error(error.message);
    }finally{
      setCaptionBusy(false);
    }
  };

  // Tự động lấy phụ đề khi mở video nếu video chưa có phụ đề
  useEffect(() => {
    if ((!currentEpisode.subtitles || !currentEpisode.subtitles.length) && currentEpisode.youtubeId) {
      fetchCaptions();
    }
  }, [currentEpisode.id, currentEpisode.youtubeId]);

  // Studio Mode State
  const [activeTab, setActiveTab] = useState(()=>{const mode=new URLSearchParams(window.location.hash.split('?')[1]||'').get('mode');return ['video','dictation','shadowing','quiz'].includes(mode)?mode:'video';}); // 'video' | 'dictation' | 'shadowing' | 'quiz'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showGerman, setShowGerman] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [activeSubIndex, setActiveSubIndex] = useState(0);

  // Auto-pause each sentence mode (Requirement 2)
  const [isPauseAfterSentence, setIsPauseAfterSentence] = useState(true);
  const [isSentencePaused, setIsSentencePaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Dictation state
  const [typedInput, setTypedInput] = useState('');
  const [dictationAudit, setDictationAudit] = useState(null);
  const [dictationChecked, setDictationChecked] = useState(false);
  const [learnedSubs, setLearnedSubs] = useState(new Set());

  // Refs
  const playerRef = useRef(null);
  const timeTrackerRef = useRef(null);
  const subItemsRef = useRef({});
  const activeSubIndexRef = useRef(0);
  const isPauseAfterSentenceRef = useRef(true);
  const isPlayingRef = useRef(false);
  const lastTargetEndRef = useRef(null);
  const hasPausedForIndexRef = useRef(null);

  activeSubIndexRef.current = activeSubIndex;
  isPauseAfterSentenceRef.current = isPauseAfterSentence;
  isPlayingRef.current = isPlaying;

  const currentSub = subtitles[activeSubIndex] || {
    start: 0,
    end: 5,
    de: 'Chưa có phụ đề.',
    vi: '',
  };

  useEffect(()=>{if(coreActive){coreEpoch.current++;coreBusy.current=false;setCoreSaving(false);setDictationChecked(false);setDictationAudit(null);}},[coreActive,activeSubIndex]);

  // 1. Initialize YouTube IFrame API
  useEffect(() => {
    let isMounted = true;
    if(coreActive&&!currentEpisode.youtubeId)return;

    const initYouTubePlayer = () => {
      if(!isMounted)return;
      if (!window.YT || !window.YT.Player) {
        setTimeout(initYouTubePlayer, 200);
        return;
      }

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      const playerContainer = document.getElementById('youtube-player-iframe');
      if (!playerContainer) return;

      playerRef.current = new window.YT.Player('youtube-player-iframe', {
        videoId: currentEpisode.youtubeId || '4-eDoThe6qo',
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (isMounted) {
              event.target.setPlaybackRate(playbackSpeed);
            }
          },
          onStateChange: (event) => {
            if (!isMounted) return;
            // 1: PLAYING, 2: PAUSED, 0: ENDED
            if (event.data === 1) {
              setIsPlaying(true);
              setIsSentencePaused(false);
              startTimeTracking();
            } else {
              setIsPlaying(false);
              stopTimeTracking();
            }
          },
        },
      });
    };

    // Load API script if not yet loaded
    if (!window.YT) {
      const scriptTag = document.createElement('script');
      scriptTag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(scriptTag);
      window.onYouTubeIframeAPIReady = initYouTubePlayer;
    } else {
      initYouTubePlayer();
    }

    return () => {
      isMounted = false;
      stopTimeTracking();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [currentEpisode.youtubeId]);

  // 2. Real-Time Playhead Tracking (Subtitles follow spoken words & Auto-pause)
  const startTimeTracking = () => {
    stopTimeTracking();
    timeTrackerRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      const currentTime = playerRef.current.getCurrentTime();
      if (currentTime === undefined || currentTime === null) return;

      // A. Match current subtitle by timestamp
      let foundIndex = -1;
      for (let i = 0; i < subtitles.length; i++) {
        const s = subtitles[i];
        const sEnd = s.end || (subtitles[i + 1]?.start ? subtitles[i + 1].start : s.start + 5);
        if (currentTime >= s.start && currentTime < sEnd) {
          foundIndex = i;
          break;
        }
      }

      // If between subtitles, keep previous active or match nearest
      if (foundIndex === -1 && subtitles.length > 0) {
        for (let i = 0; i < subtitles.length; i++) {
          if (currentTime >= subtitles[i].start) {
            foundIndex = i;
          }
        }
      }

      if (foundIndex !== -1 && foundIndex !== activeSubIndexRef.current) {
        setActiveSubIndex(foundIndex);
        hasPausedForIndexRef.current = null; // New sentence started
        // Scroll transcript line into view smoothly
        const el = subItemsRef.current[foundIndex];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      // B. Auto-Pause at end of current sentence for deliberate learning
      if (isPauseAfterSentenceRef.current && isPlayingRef.current) {
        const activeSub = subtitles[activeSubIndexRef.current];
        if (activeSub) {
          const nextSubStart = subtitles[activeSubIndexRef.current + 1]?.start;
          const targetEnd = activeSub.end || (nextSubStart ? nextSubStart : activeSub.start + 4.5);

          // When playhead reaches or passes sentence end and hasn't paused for this sentence yet
          if (currentTime >= targetEnd - 0.25 && hasPausedForIndexRef.current !== activeSubIndexRef.current) {
            hasPausedForIndexRef.current = activeSubIndexRef.current;
            playerRef.current.pauseVideo();
            setIsPlaying(false);
            setIsSentencePaused(true);
            lastTargetEndRef.current = targetEnd;
          }
        }
      }
    }, 120);
  };

  const stopTimeTracking = () => {
    if (timeTrackerRef.current) {
      clearInterval(timeTrackerRef.current);
      timeTrackerRef.current = null;
    }
  };

  // 3. Playback Controls & Navigation
  const handleSeekAndPlay = (seconds, index) => {
    setActiveSubIndex(index);
    hasPausedForIndexRef.current = null;
    setTypedInput('');
    setDictationChecked(false);
    setDictationAudit(null);
    setIsSentencePaused(false);

    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(Math.max(0, seconds), true);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }

    // Scroll to item
    const el = subItemsRef.current[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleReplayCurrentSentence = () => {
    hasPausedForIndexRef.current = null;
    handleSeekAndPlay(currentSub.start, activeSubIndex);
  };

  const handlePreviousSentence = () => {
    const prevIdx = Math.max(0, activeSubIndex - 1);
    const targetSub = subtitles[prevIdx];
    if (targetSub) {
      hasPausedForIndexRef.current = null;
      handleSeekAndPlay(targetSub.start, prevIdx);
    }
  };

  const handleNextSentence = () => {
    const nextIdx = Math.min(subtitles.length - 1, activeSubIndex + 1);
    const targetSub = subtitles[nextIdx];
    if (targetSub) {
      hasPausedForIndexRef.current = null;
      handleSeekAndPlay(targetSub.start, nextIdx);
    }
  };

  const handleResumeAfterPause = () => {
    setIsSentencePaused(false);
    if (playerRef.current) {
      // Seek slightly past the pause boundary to prevent re-triggering
      const cur = playerRef.current.getCurrentTime();
      if (lastTargetEndRef.current && cur >= lastTargetEndRef.current - 0.3) {
        playerRef.current.seekTo(lastTargetEndRef.current + 0.1, true);
      }
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleTogglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Speed control
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Dictation check
  const handleCheckDictation = async (e) => {
    e.preventDefault();
    if (!typedInput.trim()||coreBusy.current) return;
    if(coreActive&&!currentSub.recordId)return toast.error("Bản xem thử chưa được lưu để chấm.");
    if(coreActive){const epoch=coreEpoch.current;coreBusy.current=true;setCoreSaving(true);try{const result=await elioListening().submit(currentSub,typedInput.trim());if(epoch===coreEpoch.current){setDictationAudit(result.audit);setDictationChecked(true);if(result.audit.isExact)setLearnedSubs(prev=>new Set(prev).add(currentSub.id||activeSubIndex));}}catch(error){if(epoch===coreEpoch.current)toast.error(error.message);}finally{if(epoch===coreEpoch.current){coreBusy.current=false;setCoreSaving(false);}}return;}

    const audit = auditDictationSentence({
      target: currentSub.de,
      user: typedInput.trim(),
    });
    setDictationAudit(audit);
    setDictationChecked(true);

    if (audit.isExact) {
      toast.success('Chính xác 100%! Rất xuất sắc!');
      setLearnedSubs((prev) => new Set(prev).add(currentSub.id || activeSubIndex));
    } else {
      toast.info('Đã đối chiếu câu của bạn!');
    }
  };

  const handleCopyTranscript = () => {
    const text = subtitles.map((s) => `${s.de} (${s.vi})`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép toàn bộ lời thoại vào clipboard!');
  };

  const handleSaveSentenceAsCard = async (sub) => {
    if(coreActive&&!sub.recordId)return toast.error('Bản xem thử chưa được lưu vào bài nghe.');
    if(coreActive){const epoch=coreEpoch.current;try{const result=await elioClient.saveListeningCue({recordId:sub.recordId,...(sub.itemId!==undefined?{itemId:sub.itemId}:{}),cueIndex:sub.cueIndex,cueRevision:sub.cueRevision});if(epoch===coreEpoch.current){window.dispatchEvent(new CustomEvent('sprach_core_vocabulary_changed'));toast.success(result.skipped?'Câu này đã có trong bộ riêng.':'Đã lưu câu phụ đề vào bộ riêng; không tự tạo bản dịch.');}}catch(error){if(epoch===coreEpoch.current)toast.error(error.message);}return;}
    db.vocabulary.create({
      german: sub.de,
      vietnamese: sub.vi || 'Mẫu câu luyện nghe',
      level: currentEpisode.level || 'B1',
      topic: collection.title,
    });
    toast.success('Đã lưu câu này vào Thẻ từ vựng cá nhân!');
  };

  const canManage = isAdmin || currentEpisode.created_by === currentUser?.id;

  const handleDeleteEpisode = async () => {
    const ok = await showConfirmModal({
      title: 'Xóa video luyện nghe',
      message: `Bạn có chắc muốn xóa video "${currentEpisode.title}" này không? Thao tác này sẽ xóa tập video khỏi bộ.`,
      confirmText: 'Xóa video',
      variant: 'danger',
    });
    if (ok) {
      try{
        await db.listening.deleteEpisode(currentEpisode.id);
        toast.success('Đã xóa video thành công!');
        navigate('/skills/listening');
      }catch(error){toast.error(error.message);}
    }
  };

  const handleSaveEpisode = (e) => {
    e.preventDefault();
    if (!editingEpisode) return;
    if(coreActive)return toast.error('Sửa video chưa nối server.');
    db.listening.updateEpisode(editingEpisode.id, {
      title: editingEpisode.title,
      deTitle: editingEpisode.deTitle,
      youtubeId: editingEpisode.youtubeId,
      level: editingEpisode.level,
      duration: editingEpisode.duration,
    });
    setEditingEpisode(null);
    toast.success('Đã lưu thông tin video!');
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

        <div className="flex items-center gap-2">
          {canManage && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditingEpisode({ ...currentEpisode })}
                className="tap px-2.5 py-1 text-xs font-mono rounded border border-border bg-card hover:bg-muted text-foreground flex items-center gap-1 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                <span>Sửa video</span>
              </button>
              <button
                onClick={handleDeleteEpisode}
                className="tap px-2.5 py-1 text-xs font-mono rounded border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 flex items-center gap-1 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa video</span>
              </button>
            </div>
          )}

          <Link
            to="/skills/listening"
            className="tap inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground ml-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về danh sách tập</span>
          </Link>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {[
            { id: 'video', label: 'Xem & Luyện nghe theo câu', icon: Play },
            { id: 'dictation', label: 'Chép chính tả (Diktat)', icon: FileText },
            { id: 'shadowing', label: 'Shadowing (Nhại giọng)', icon: Repeat },
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

        {/* Satz-für-Satz Auto-Pause Toggle (Requirement 2) */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-foreground bg-accent/5 px-3 py-1 rounded-sm border border-accent/20">
          <input
            type="checkbox"
            checked={isPauseAfterSentence}
            onChange={(e) => setIsPauseAfterSentence(e.target.checked)}
            className="rounded-sm text-accent focus:ring-accent"
          />
          <span className="font-semibold text-accent flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Tự dừng sau mỗi câu (Dừng để học)</span>
          </span>
        </label>
      </div>

      {/* MAIN STUDIO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Video Player & Sentence Control Bar (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* YouTube Embed Player with Floating Subtitles Overlay */}
          <div className="surface overflow-hidden border border-border shadow-md aspect-video relative bg-black rounded-sm">
            <div id="youtube-player-iframe" className="w-full h-full" />

            {/* REAL-TIME ON-SCREEN SUBTITLE OVERLAY (Requirement 1) */}
            {subtitles[activeSubIndex] && subtitles[activeSubIndex].vi?.trim() !== 'Nội dung video' &&
              ((showGerman && currentSub.de?.trim()) || (showVietnamese && currentSub.vi?.trim())) && (
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex flex-col items-center justify-center text-center">
                <div className="bg-black/85 backdrop-blur-sm px-4 py-2.5 rounded-md max-w-xl shadow-2xl border border-white/10 space-y-1">
                  {showGerman && currentSub.de && (
                    <div className="text-white font-heading font-bold text-base md:text-lg tracking-wide leading-snug drop-shadow">
                      {currentSub.de}
                    </div>
                  )}
                  {showVietnamese && currentSub.vi && (
                    <div className="text-amber-300 font-body text-xs md:text-sm drop-shadow">
                      {currentSub.vi}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Under-video Sentence Navigation & Control Bar (Requirement 2) */}
          <div className="surface p-4 border border-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Previous / Replay / Next Sentence Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousSentence}
                  disabled={activeSubIndex <= 0}
                  className="tap px-3 py-1.5 rounded-sm border border-border bg-card text-xs font-mono hover:bg-muted disabled:opacity-40 flex items-center gap-1.5"
                  title="Lùi về câu thoại trước"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>Câu trước</span>
                </button>

                <button
                  onClick={handleReplayCurrentSentence}
                  className="tap px-3 py-1.5 rounded-sm bg-accent/10 border border-accent/30 text-accent text-xs font-mono hover:bg-accent/20 font-bold flex items-center gap-1.5"
                  title="Nghe lại câu thoại hiện tại"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nghe lại câu này</span>
                </button>

                <button
                  onClick={handleNextSentence}
                  disabled={activeSubIndex >= subtitles.length - 1}
                  className="tap px-3 py-1.5 rounded-sm bg-accent text-accent-foreground text-xs font-mono font-bold hover:bg-accent/90 shadow-sm flex items-center gap-1.5 disabled:opacity-40"
                  title="Chuyển sang câu tiếp theo"
                >
                  <span>Câu sau →</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-muted-foreground">Tốc độ đọc:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  className="px-2 py-1 rounded-sm border border-border bg-card text-foreground font-mono font-bold text-accent"
                >
                  <option value={0.75}>0.75x (Chậm)</option>
                  <option value={0.9}>0.9x (Hơi chậm)</option>
                  <option value={1}>1.0x (Chuẩn)</option>
                  <option value={1.25}>1.25x (Nhanh)</option>
                </select>
              </div>
            </div>

            {/* Status Indicator */}
            {isSentencePaused && (
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs font-mono text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2">
                <span>⏸️ Đã dừng ở cuối câu #{activeSubIndex + 1}. Mời bạn chép chính tả hoặc nghe lại câu này!</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResumeAfterPause}
                    className="tap px-2 py-1 rounded bg-accent text-accent-foreground text-xs font-mono font-bold"
                  >
                    ▶ Phát tiếp
                  </button>
                  <button
                    onClick={handleNextSentence}
                    className="text-accent underline font-bold"
                  >
                    Sang câu sau →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TAB CONTENT: DICTATION OR SHADOWING PRACTICE */}
          {activeTab === 'dictation' && (
            <div className="surface p-5 border border-border space-y-4 animate-rise">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <div className="eyebrow">CHẾ ĐỘ CHÉP CHÍNH TẢ (DIKTAT)</div>
                  <h4 className="font-display font-bold text-lg text-foreground">
                    Câu #{activeSubIndex + 1} / {subtitles.length}
                  </h4>
                </div>
                <button
                  onClick={handleReplayCurrentSentence}
                  className="tap px-2.5 py-1 rounded-sm bg-accent/10 text-accent font-mono text-xs flex items-center gap-1 font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe lại</span>
                </button>
              </div>

              <form onSubmit={handleCheckDictation} className="space-y-3">
                <label className="block text-xs font-mono text-muted-foreground">
                  Gõ lại câu thoại tiếng Đức bạn vừa nghe được:
                </label>
                <textarea
                  rows={3}
                  value={typedInput}
                  disabled={coreSaving}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Gõ tiếng Đức vào đây (chú ý viết hoa danh từ)..."
                  className="w-full p-3 text-sm font-heading rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="tap px-4 py-2 rounded-sm bg-accent text-accent-foreground text-xs font-mono font-bold shadow-sm"
                  >
                    Kiểm tra đáp án
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSentence}
                    className="tap px-4 py-2 rounded-sm border border-border bg-card text-xs font-mono font-semibold hover:bg-muted flex items-center gap-1.5"
                  >
                    <span>Sang câu kế tiếp →</span>
                  </button>
                </div>
              </form>

              {/* Dictation Result Breakdown */}
              {dictationChecked && dictationAudit && (
                <div className="p-4 rounded-sm border border-border bg-card space-y-2 text-xs animate-rise">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-muted-foreground">Kết quả đối chiếu:</span>
                    <span
                      className={`font-mono font-bold ${
                        dictationAudit.isExact ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {dictationAudit.isExact ? '✓ Đúng 100%' : 'Cần chú ý một số từ'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-muted/20 font-heading text-sm text-foreground">
                    <strong className="text-accent font-mono text-xs block mb-0.5">Đáp án chuẩn:</strong>
                    {currentSub.de}
                  </div>
                  {currentSub.vi && (
                    <div className="text-muted-foreground italic text-xs">
                      → Nghĩa Việt: {currentSub.vi}
                    </div>
                  )}

                  {/* Errors breakdown */}
                  {dictationAudit.misheardWords?.length > 0 && (
                    <div className="text-[11px] font-mono text-rose-600 pt-1">
                      Từ nghe nhầm / viết sai: {dictationAudit.misheardWords.map((w) => `"${w.actual}" → "${w.expected}"`).join(', ')}
                    </div>
                  )}
                  {dictationAudit.capitalizationErrors?.length > 0 && (
                    <div className="text-[11px] font-mono text-amber-600">
                      {coreActive?'Khác biệt viết hoa: ':'Lỗi viết hoa danh từ: '}{dictationAudit.capitalizationErrors.map((c) => `"${c.actual}" (chuẩn: ${c.expected})`).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Real-Time Transcript (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Transcript Top Bar */}
          <div className="surface p-3.5 border border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGerman(!showGerman)}
                className={`tap px-2.5 py-1 rounded-sm text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all ${
                  showGerman
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {showGerman ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Tiếng Đức</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVietnamese(!showVietnamese)}
                className={`tap px-2.5 py-1 rounded-sm text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all ${
                  showVietnamese
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {showVietnamese ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Dịch Việt</span>
              </button>
            </div>

            {currentEpisode.youtubeId&&<button type="button" disabled={captionBusy} onClick={fetchCaptions} className="tap px-2 py-1 text-xs border border-border rounded-sm">{captionBusy?'Đang lấy…':'Lấy bản hiện lời'}</button>}
            <button
              onClick={handleCopyTranscript}
              className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Sao chép toàn bộ phụ đề"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Transcript Scroll Container (Auto-highlight & auto-scroll) */}
          <div className="surface p-2 border border-border max-h-[600px] overflow-y-auto space-y-2">
            {subtitles.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-muted-foreground">
                Chưa có phụ đề cho video này.
              </div>
            ) : (
              subtitles.map((sub, idx) => {
                const isActive = activeSubIndex === idx;
                const isLearned = learnedSubs.has(sub.id || idx);

                const min = String(Math.floor(sub.start / 60)).padStart(2, '0');
                const sec = String(sub.start % 60).padStart(2, '0');

                return (
                  <div
                    key={sub.id || idx}
                    ref={(el) => (subItemsRef.current[idx] = el)}
                    onClick={() => handleSeekAndPlay(sub.start, idx)}
                    className={`tap p-3 rounded-sm border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-accent bg-accent/10 ring-2 ring-accent shadow-sm'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {min}:{sec}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-mono text-accent font-bold uppercase animate-pulse">
                            ▶ Đang nói
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveSentenceAsCard(sub);
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-accent"
                          title="Lưu câu vào Thẻ từ vựng"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* German Sentence */}
                    {showGerman && (
                      <div
                        className={`font-heading text-sm leading-relaxed ${
                          isActive ? 'font-bold text-foreground' : 'text-foreground/90'
                        }`}
                      >
                        {sub.de}
                      </div>
                    )}

                    {/* Vietnamese Translation */}
                    {showVietnamese && sub.vi && (
                      <div className="font-body text-xs text-muted-foreground mt-0.5 italic">
                        {sub.vi}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Episode Modal */}
      {editingEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface p-6 max-w-md w-full space-y-4 rounded-sm border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                Chỉnh sửa tập video
              </h3>
              <button
                type="button"
                onClick={() => setEditingEpisode(null)}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEpisode} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên tập (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  required
                  value={editingEpisode.title || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên tập (Tiếng Đức)
                </label>
                <input
                  type="text"
                  value={editingEpisode.deTitle || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, deTitle: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  YouTube Video ID hoặc URL *
                </label>
                <input
                  type="text"
                  required
                  value={editingEpisode.youtubeId || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, youtubeId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Cấp độ (CEFR)
                  </label>
                  <select
                    value={editingEpisode.level || 'B1'}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, level: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Thời lượng (phút:giây)
                  </label>
                  <input
                    type="text"
                    value={editingEpisode.duration || '03:00'}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingEpisode(null)}
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

export default ListeningPlayerPage;
