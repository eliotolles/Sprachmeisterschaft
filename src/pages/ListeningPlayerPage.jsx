import React, { useState, useEffect, useRef } from 'react';
import { getYouTubeTranscript } from '@/lib/youtube-transcript-extractor';
import { getLocalMediaUrl, deleteLocalMedia } from '@/lib/local-media-store';
import { parseYouTubeSubtitles, normalizeSubtitleText } from '@/lib/subtitle-parser';
import { clampSubtitleDrag, SUBTITLE_DRAG_THRESHOLD_PX } from '@/lib/subtitle-drag';
import { batchTranslateCues } from '@/lib/translator';
import {elioClient} from '@/lib/elio-auth-runtime';
import { db } from '@/lib/db';
import {elioListening,listeningCoreActive} from '@/lib/elio-listening-runtime';
import { useRouter, Link } from '@/lib/router';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { LookupText } from '@/components/vocabulary/WordDetail';
import { auditDictationSentence } from '@/lib/ai-evaluator';
import {
  Play,
  Captions,
  RotateCcw,
  FastForward,
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
  useEffect(()=>{const update=()=>{coreEpoch.current++;coreBusy.current=false;setCoreSaving(false);refreshCore(n=>n+1);};if(!coreActive)return;window.addEventListener('sprach_listening_change',update);return()=>{coreEpoch.current++;window.removeEventListener('sprach_listening_change',update);};},[coreActive,collectionId,videoId]);
  const [editingEpisode, setEditingEpisode] = useState(null);

  const collection = db.listening.getCollectionById(collectionId) || {
    id: collectionId,
    title: 'Nicos Weg — Trình độ A1',
  };
  const episodes = db.listening.getEpisodes(collectionId);
  // Không dùng video giả hay tập đầu tiên khi id không khớp: link hỏng phải
  // báo "không tìm thấy" chứ không phát nhầm video khác.
  const resolvedEpisode = db.listening.getEpisodeById(videoId) || episodes.find(e => e.id === videoId);
  const currentEpisode = resolvedEpisode || {
    id: videoId,
    title: '',
    youtubeId: '',
    subtitles: [],
  };

  // Video tự tải lên từ máy tính: phát bằng <video> gốc với Blob từ IndexedDB
  const isLocalEpisode = !!currentEpisode.localMediaId && !currentEpisode.youtubeId;
  const [localVideoUrl, setLocalVideoUrl] = useState(null);
  const [localVideoError, setLocalVideoError] = useState('');
  const localVideoRef = useRef(null);

  // Lấy Blob video từ IndexedDB và tạo object URL; thu hồi khi đổi tập/unmount
  useEffect(() => {
    if (!isLocalEpisode) {
      setLocalVideoUrl(null);
      setLocalVideoError('');
      return;
    }
    let cancelled = false;
    let url = null;
    setLocalVideoUrl(null);
    setLocalVideoError('');
    getLocalMediaUrl(currentEpisode.localMediaId)
      .then((u) => {
        if (cancelled) {
          if (u) URL.revokeObjectURL(u);
          return;
        }
        if (!u) {
          setLocalVideoError('Không tìm thấy file video trong trình duyệt này. Có thể video đã bị xóa khỏi IndexedDB — hãy import lại video.');
        } else {
          url = u;
          setLocalVideoUrl(u);
        }
      })
      .catch(() => {
        if (!cancelled) setLocalVideoError('Không mở được file video từ bộ nhớ máy. Hãy thử import lại video.');
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [isLocalEpisode, currentEpisode.localMediaId]);

  const [captionBusy,setCaptionBusy]=useState(false);
  const [translatingBusy,setTranslatingBusy]=useState(false);
  const [preview,setPreview]=useState(null);
  const captionScope=JSON.stringify([currentUser?.id,collectionId,currentEpisode.id,currentEpisode.youtubeId,currentEpisode.localMediaId]);
  const captionScopeRef=useRef(captionScope);
  captionScopeRef.current=captionScope;
  const subtitles = preview?.scope===captionScope ? preview.cues : (currentEpisode.subtitles && currentEpisode.subtitles.length ? currentEpisode.subtitles : []);
  const subtitlesRef = useRef(subtitles);
  subtitlesRef.current = subtitles;

  const fetchCaptions=async()=>{
    if(captionBusy||!currentEpisode.youtubeId)return;
    setCaptionBusy(true);
    try{
      toast.info('Đang bóc tách phụ đề tiếng Đức từ YouTube...');
      const result = await getYouTubeTranscript(currentEpisode.youtubeId, 'de');
      if(captionScopeRef.current!==captionScope)return;
      if(result && result.available && Array.isArray(result.cues) && result.cues.length > 0){
        let cues = result.cues.map(c => ({
          start: c.start,
          end: c.end,
          de: c.text,
          vi: ''
        }));
        // Lưu bản tiếng Đức — phải chờ lưu xong mới báo thành công, vì video
        // trên máy chủ mà lưu thất bại thì tải lại trang là phụ đề biến mất.
        const saved = await db.listening.updateEpisode(currentEpisode.id, { subtitles: cues });
        if (!saved) throw Error('Không lưu được phụ đề. Hãy thử lại.');
        setPreview({scope:captionScope, cues});
        toast.success(`Đã lấy ${cues.length} câu tiếng Đức. Đang tự động dịch sang tiếng Việt...`);

        // Tự động dịch song ngữ Đức - Việt
        try {
          const translatedCues = await batchTranslateCues(cues);
          if (captionScopeRef.current === captionScope && translatedCues && translatedCues.length > 0) {
            const hasVietnamese = translatedCues.some(c => c.vi && String(c.vi).trim());
            try {
              const savedVi = await db.listening.updateEpisode(currentEpisode.id, { subtitles: translatedCues });
              if (!savedVi) throw Error('Không lưu được bản dịch lên máy chủ.');
              setPreview({ scope: captionScope, cues: translatedCues });
              if (hasVietnamese) toast.success(`Đã hoàn tất phụ đề song ngữ Đức - Việt (${translatedCues.length} câu)!`);
              else toast.warning('Đã lấy phụ đề tiếng Đức nhưng chưa dịch được câu nào sang tiếng Việt.');
            } catch (saveErr) {
              toast.error(saveErr.message);
            }
          }
        } catch (transErr) {
          console.warn('Lỗi dịch phụ đề tự động:', transErr);
        }
      } else {
        throw Error(result?.reason || 'Chưa lấy được phụ đề tự động cho video này.');
      }
    }catch(error){
      if(captionScopeRef.current===captionScope)toast.error(error.message);
    }finally{
      setCaptionBusy(false);
    }
  };

  const translateCaptions=async()=>{
    if(translatingBusy||!subtitles.length)return;
    setTranslatingBusy(true);
    try{
      toast.info(`Đang dịch ${subtitles.length} câu sang tiếng Việt...`);
      const updated = await batchTranslateCues(subtitles);
      const hasVietnamese = updated.some(c => c.vi && String(c.vi).trim());
      const saved = await db.listening.updateEpisode(currentEpisode.id, { subtitles: updated });
      if (!saved) throw Error('Không lưu được bản dịch. Hãy thử lại.');
      setPreview({ scope: captionScope, cues: updated });
      if (hasVietnamese) toast.success('Đã hoàn tất bản dịch tiếng Việt!');
      else toast.warning('Chưa dịch được câu nào sang tiếng Việt. Hãy thử lại sau.');
    }catch(err){
      toast.error('Lỗi khi dịch: ' + err.message);
    }finally{
      setTranslatingBusy(false);
    }
  };

  // Tự động lấy phụ đề khi mở video nếu video chưa có phụ đề
  const subtitleFileRef = useRef(null);
  const handleSubtitleFile = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    if (!/\.(srt|vtt)$/i.test(file.name)) {
      toast.error('File phụ đề phải là .srt hoặc .vtt.');
      return;
    }
    try {
      const rawText = await file.text();
      const cues = parseYouTubeSubtitles(normalizeSubtitleText(rawText));
      if (!cues.length) {
        toast.error('Không đọc được câu nào từ file phụ đề này.');
        return;
      }
      if (subtitles.length) {
        const ok = await showConfirmModal({
          title: 'Thay phụ đề hiện tại?',
          message: `Video này đã có ${subtitles.length} câu phụ đề. File mới sẽ thay thế toàn bộ phụ đề cũ.`,
          confirmText: 'Thay phụ đề',
        });
        if (!ok) return;
      }
      const saved = await db.listening.updateEpisode(currentEpisode.id, { subtitles: cues });
      if (!saved) {
        toast.error('Không lưu được phụ đề. Hãy thử lại.');
        return;
      }
      setPreview({ scope: captionScope, cues });
      toast.success(`Đã thêm ${cues.length} câu phụ đề cho video này!`);
    } catch (err) {
      toast.error('Lỗi khi đọc file phụ đề: ' + err.message);
    }
  };

  const startEditingSub = (idx) => {
    const sub = subtitles[idx];
    if (!sub) return;
    setEditingSubIndex(idx);
    setEditingSubDe(sub.de || '');
    setEditingSubVi(sub.vi || '');
  };

  // Lưu 1 câu phụ đề đã sửa — dùng đúng db.listening.updateEpisode như
  // handleSubtitleFile/translateCaptions (video trên server đã server-aware).
  const saveEditedSub = async () => {
    if (editingSubIndex === null || savingSub) return;
    setSavingSub(true);
    try {
      const updated = subtitles.map((s, i) =>
        i === editingSubIndex ? { ...s, de: editingSubDe.trim(), vi: editingSubVi.trim() } : s
      );
      const saved = await db.listening.updateEpisode(currentEpisode.id, { subtitles: updated });
      if (!saved) throw new Error('Không lưu được phụ đề. Hãy thử lại.');
      setPreview({ scope: captionScope, cues: updated });
      setEditingSubIndex(null);
      toast.success('Đã lưu câu phụ đề!');
    } catch (err) {
      toast.error(err.message || 'Không lưu được phụ đề.');
    } finally {
      setSavingSub(false);
    }
  };

  useEffect(() => {
    if ((!currentEpisode.subtitles || !currentEpisode.subtitles.length) && currentEpisode.youtubeId) {
      fetchCaptions();
    }
  }, [currentEpisode.id, currentEpisode.youtubeId]);

  // Studio Mode State
  const [activeTab, setActiveTab] = useState(()=>{const mode=new URLSearchParams(window.location.hash.split('?')[1]||'').get('mode');return ['video','dictation'].includes(mode)?mode:'video';}); // 'video' | 'dictation'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showGerman, setShowGerman] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [activeSubIndex, setActiveSubIndex] = useState(0);

  // Phụ đề trên video kiểu YouTube: bật/tắt (CC) + cỡ chữ, lưu localStorage.
  // Mặc định BẬT, cỡ Vừa — gọn như YouTube, không to như hộp đen cũ đã bỏ.
  const [subtitleOn, setSubtitleOn] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('sprach_subtitle_on') : null;
      return raw === null ? true : raw === '1';
    } catch { return true; }
  });
  const [subtitleSize, setSubtitleSize] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('sprach_subtitle_size') : null;
      return ['small', 'medium', 'large'].includes(raw) ? raw : 'medium';
    } catch { return 'medium'; }
  });
  useEffect(() => {
    try { window.localStorage.setItem('sprach_subtitle_on', subtitleOn ? '1' : '0'); } catch {}
  }, [subtitleOn]);
  useEffect(() => {
    try { window.localStorage.setItem('sprach_subtitle_size', subtitleSize); } catch {}
  }, [subtitleSize]);
  // Độ trễ phụ đề kiểu VLC: -10s đến +10s, bước 0,5s, mặc định 0.
  // Phụ đề chậm hơn tiếng thì kéo sang + (hiện câu sau sớm hơn), nhanh
  // hơn thì kéo sang -. Lưu riêng theo từng video (key gồm episode id).
  const [subtitleOffset, setSubtitleOffset] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(`sprach_subtitle_offset:${currentEpisode.id}`) : null;
      const value = raw === null ? 0 : Number(raw);
      return Number.isFinite(value) ? Math.max(-10, Math.min(10, value)) : 0;
    } catch { return 0; }
  });
  // Đổi tập video thì nạp lại độ trễ đã lưu của tập đó (mặc định 0).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`sprach_subtitle_offset:${currentEpisode.id}`);
      const value = raw === null ? 0 : Number(raw);
      setSubtitleOffset(Number.isFinite(value) ? Math.max(-10, Math.min(10, value)) : 0);
    } catch { setSubtitleOffset(0); }
  }, [currentEpisode.id]);
  const changeSubtitleOffset = (value) => {
    const clamped = Number.isFinite(value) ? Math.max(-10, Math.min(10, Math.round(value * 2) / 2)) : 0;
    setSubtitleOffset(clamped);
    try { window.localStorage.setItem(`sprach_subtitle_offset:${currentEpisode.id}`, String(clamped)); } catch {}
  };
  const formatSubtitleOffset = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}s`;
  // Cỡ chữ phụ đề trên video: Vừa (mặc định) gọn như YouTube — nhỏ hơn
  // text-base md:text-xl của hộp đen cũ đã bỏ.
  const SUBTITLE_SIZES = {
    small: { de: 'text-xs md:text-sm', vi: 'text-[11px] md:text-xs' },
    medium: { de: 'text-sm md:text-base', vi: 'text-xs md:text-sm' },
    large: { de: 'text-base md:text-lg', vi: 'text-sm md:text-base' },
  };
  const subSize = SUBTITLE_SIZES[subtitleSize] || SUBTITLE_SIZES.medium;

  // Hộp phụ đề trên video kéo được bằng chuột: bấm giữ vào hộp rồi kéo,
  // thả ra hộp ở chỗ mới, không ra ngoài khung video. Vị trí mặc định vẫn
  // dưới, căn giữa; vị trí kéo được cộng thêm vào vị trí mặc định nên đổi
  // câu hay bottom nhích lên/xuống cũng không reset. Đổi tập video thì về 0.
  const [subtitlePos, setSubtitlePos] = useState({ x: 0, y: 0 });
  const [subtitleDragging, setSubtitleDragging] = useState(false);
  const videoFrameRef = useRef(null);
  const subtitleBoxRef = useRef(null);
  const subtitleDragRef = useRef(null);
  const suppressLookupClickRef = useRef(false);
  useEffect(() => {
    setSubtitlePos({ x: 0, y: 0 });
    setSubtitleDragging(false);
    subtitleDragRef.current = null;
    suppressLookupClickRef.current = false;
  }, [currentEpisode.id]);
  const handleSubtitlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const box = subtitleBoxRef.current;
    const frame = videoFrameRef.current;
    if (!box || !frame) return;
    suppressLookupClickRef.current = false;
    subtitleDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startPos: subtitlePos,
      boxRect: box.getBoundingClientRect(),
      frameRect: frame.getBoundingClientRect(),
      dragging: false,
    };
    try { box.setPointerCapture(event.pointerId); } catch {}
  };
  const handleSubtitlePointerMove = (event) => {
    const drag = subtitleDragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.dragging) {
      if (Math.hypot(dx, dy) <= SUBTITLE_DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      setSubtitleDragging(true);
      window.getSelection()?.removeAllRanges();
    }
    setSubtitlePos(clampSubtitleDrag(dx, dy, drag.boxRect, drag.frameRect, drag.startPos));
  };
  const endSubtitleDrag = () => {
    const drag = subtitleDragRef.current;
    subtitleDragRef.current = null;
    if (drag?.dragging) suppressLookupClickRef.current = true;
    setSubtitleDragging(false);
  };
  // Sau khi kéo, click đi kèm pointerup có thể mở nhầm popup tra từ nên
  // chặn 1 click đó ở pha capture (chạy trước onClick của LookupText).
  const handleSubtitleClickCapture = (event) => {
    if (!suppressLookupClickRef.current) return;
    suppressLookupClickRef.current = false;
    event.stopPropagation();
    event.preventDefault();
  };

  // Menu cài đặt phụ đề (mở từ nút "Phụ đề"): bật/tắt, cỡ chữ, độ trễ.
  // Gọn trong 1 nút để thanh trên không bị bày hết ra làm hỏng giao diện.
  const [subtitleMenuOpen, setSubtitleMenuOpen] = useState(false);
  const subtitleMenuRef = useRef(null);
  useEffect(() => {
    if (!subtitleMenuOpen) return;
    const outside = (event) => {
      if (subtitleMenuRef.current && !subtitleMenuRef.current.contains(event.target)) setSubtitleMenuOpen(false);
    };
    const escape = (event) => { if (event.key === 'Escape') setSubtitleMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [subtitleMenuOpen]);

  // Sửa từng câu phụ đề trong danh sách lời thoại.
  const [editingSubIndex, setEditingSubIndex] = useState(null);
  const [editingSubDe, setEditingSubDe] = useState('');
  const [editingSubVi, setEditingSubVi] = useState('');
  const [savingSub, setSavingSub] = useState(false);

  // Auto-pause each sentence mode (Requirement 2)
  const [isPauseAfterSentence, setIsPauseAfterSentence] = useState(true);
  const [isSentencePaused, setIsSentencePaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Dictation state
  const [typedInput, setTypedInput] = useState('');
  const [dictationAudit, setDictationAudit] = useState(null);
  const [dictationChecked, setDictationChecked] = useState(false);
  const [learnedSubs, setLearnedSubs] = useState(new Set());

  // Đổi tập video thì làm mới bài chép chính tả đang làm dở; sự kiện nền
  // (hydrate/import/xóa ở chỗ khác) không được xóa bài đang làm.
  useEffect(()=>{setTypedInput('');setDictationAudit(null);setDictationChecked(false);setLearnedSubs(new Set());setActiveSubIndex(0);},[collectionId,videoId]);

  // Refs
  const playerRef = useRef(null);
  const timeTrackerRef = useRef(null);
  const subItemsRef = useRef({});
  const activeSubIndexRef = useRef(0);
  const isPauseAfterSentenceRef = useRef(true);
  const isPlayingRef = useRef(false);
  const lastTargetEndRef = useRef(null);
  const hasPausedForIndexRef = useRef(null);
  const subtitleOffsetRef = useRef(0);

  activeSubIndexRef.current = activeSubIndex;
  isPauseAfterSentenceRef.current = isPauseAfterSentence;
  isPlayingRef.current = isPlaying;
  subtitleOffsetRef.current = subtitleOffset;

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
    // Video máy tính không dùng YouTube IFrame API (có adapter riêng bên dưới)
    if (isLocalEpisode) return;
    if (!currentEpisode.youtubeId) return;

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
        videoId: currentEpisode.youtubeId,
        playerVars: {
          autoplay: 0,
          // Nút gốc của YouTube (đã bỏ thanh điều khiển riêng của app).
          controls: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          playsinline: 1,
          cc_load_policy: 0, // Tắt phụ đề mặc định của YouTube để không bị hộp đen che video
          iv_load_policy: 3, // Tắt chú thích trên video
        },
        events: {
          onReady: (event) => {
            if (isMounted) {
              event.target.setPlaybackRate(playbackSpeed);
              try {
                if (typeof event.target.unloadModule === 'function') {
                  event.target.unloadModule('captions');
                  event.target.unloadModule('cc');
                }
                if (typeof event.target.setOption === 'function') {
                  event.target.setOption('captions', 'track', {});
                }
              } catch {}
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

      const currentSubs = subtitlesRef.current || [];
      if (currentSubs.length === 0) return;

      // Độ trễ phụ đề: dịch toàn bộ mốc giờ của phụ đề khi so với giờ
      // video (giờ video + độ trễ so với cue.start/cue.end). Chỉ ảnh
      // hưởng hiển thị phụ đề, highlight câu đang nói và auto-pause —
      // không sửa file .srt gốc, không lưu lên database.
      const effectiveTime = currentTime + (subtitleOffsetRef.current || 0);

      // A. Match current subtitle by timestamp
      let foundIndex = -1;
      for (let i = 0; i < currentSubs.length; i++) {
        const s = currentSubs[i];
        const sEnd = s.end || (currentSubs[i + 1]?.start ? currentSubs[i + 1].start : s.start + 5);
        if (effectiveTime >= s.start && effectiveTime < sEnd) {
          foundIndex = i;
          break;
        }
      }

      // If between subtitles, keep previous active or match nearest
      if (foundIndex === -1 && currentSubs.length > 0) {
        for (let i = 0; i < currentSubs.length; i++) {
          if (effectiveTime >= currentSubs[i].start) {
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
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // B. Auto-Pause at end of current sentence for deliberate learning
      if (isPauseAfterSentenceRef.current && isPlayingRef.current) {
        const activeSub = currentSubs[activeSubIndexRef.current];
        if (activeSub) {
          const nextSubStart = currentSubs[activeSubIndexRef.current + 1]?.start;
          const targetEnd = activeSub.end || (nextSubStart ? nextSubStart : activeSub.start + 4.5);

          // When playhead reaches or passes sentence end and hasn't paused for this sentence yet
          if (effectiveTime >= targetEnd - 0.25 && hasPausedForIndexRef.current !== activeSubIndexRef.current) {
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

  // 2b. Video máy tính: nối <video> gốc vào cùng bộ điều khiển (play/pause/seek/tốc độ)
  // để các nút "Nghe lại câu", "Câu trước/sau", chép chính tả... hoạt động y như YouTube.
  useEffect(() => {
    if (!isLocalEpisode || !localVideoUrl) return;
    const videoEl = localVideoRef.current;
    if (!videoEl) return;
    videoEl.playbackRate = playbackSpeed;
    const adapter = {
      getCurrentTime: () => videoEl.currentTime || 0,
      seekTo: (seconds) => { videoEl.currentTime = Math.max(0, seconds); },
      playVideo: () => {
        const p = videoEl.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      },
      pauseVideo: () => videoEl.pause(),
      setPlaybackRate: (rate) => { videoEl.playbackRate = rate; },
      destroy: () => {},
    };
    playerRef.current = adapter;
    const onPlay = () => { setIsPlaying(true); setIsSentencePaused(false); startTimeTracking(); };
    const onPause = () => { setIsPlaying(false); stopTimeTracking(); };
    const onEnded = () => { setIsPlaying(false); stopTimeTracking(); };
    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);
    videoEl.addEventListener('ended', onEnded);
    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('ended', onEnded);
      stopTimeTracking();
      if (playerRef.current === adapter) playerRef.current = null;
    };
  }, [isLocalEpisode, localVideoUrl]);

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

  // Bấm từ trên phụ đề: tạm dừng video để popup tra từ không bị trôi
  // câu khi video chạy tiếp. Đóng popup thì anh tự bấm play lại.
  const pauseVideoForLookup = () => {
    if (!playerRef.current || typeof playerRef.current.pauseVideo !== 'function') return;
    playerRef.current.pauseVideo();
    setIsPlaying(false);
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
    if (!subtitles.length) return toast.error('Video chưa có phụ đề nên chưa chấm được. Hãy thêm phụ đề trước.');
    if(coreActive&&currentSub.recordId){const epoch=coreEpoch.current;coreBusy.current=true;setCoreSaving(true);try{const result=await elioListening().submit(currentSub,typedInput.trim());if(epoch===coreEpoch.current){setDictationAudit(result.audit);setDictationChecked(true);if(result.audit.isExact)setLearnedSubs(prev=>new Set(prev).add(currentSub.id||activeSubIndex));}}catch(error){if(epoch===coreEpoch.current)toast.error(error.message);}finally{if(epoch===coreEpoch.current){coreBusy.current=false;setCoreSaving(false);}}return;}

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
    if (!text.trim()) return toast.error('Chưa có phụ đề để sao chép.');
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép toàn bộ lời thoại vào clipboard!');
  };

  // Đổi giây (số, như sub.start/sub.end) sang HH:MM:SS,mmm của chuẩn SRT.
  const formatSrtTime = (seconds) => {
    const total = Number.isFinite(Number(seconds)) ? Math.max(0, Number(seconds)) : 0;
    const ms = Math.round(total * 1000);
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const milli = String(ms % 1000).padStart(3, '0');
    return `${h}:${m}:${s},${milli}`;
  };

  // Tải phụ đề đang có về máy dưới dạng file .srt để mở ở ngoài (VLC...).
  // Chỉ xuất những gì đang có trong subtitles, không tự dịch thêm.
  const handleDownloadSrt = () => {
    if (!subtitles.length) return toast.error('Chưa có phụ đề để tải.');
    const blocks = subtitles.map((sub, idx) => {
      const start = Number.isFinite(Number(sub.start)) ? Math.max(0, Number(sub.start)) : 0;
      const end = Number.isFinite(Number(sub.end)) && Number(sub.end) > start
        ? Number(sub.end)
        : start + 4;
      const lines = [];
      String(sub.de || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((l) => lines.push(l));
      const vi = String(sub.vi || '').trim();
      if (vi) vi.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((l) => lines.push(l));
      if (!lines.length) lines.push('');
      return `${idx + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${lines.join('\n')}`;
    });
    // BOM UTF-8 để trình phát ngoài (VLC...) nhận đúng dấu tiếng Việt.
    const content = `\uFEFF${blocks.join('\n\n')}\n`;
    const base = String(currentEpisode.title || 'phu-de').trim() || 'phu-de';
    const fileName = `${base.replace(/[\\/\\?%*:|"<>]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 80) || 'phu-de'}.srt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Đã tải file phụ đề ${fileName} (${subtitles.length} câu)!`);
  };

  const handleSaveSentenceAsCard = async (sub) => {
    if(coreActive&&sub.recordId){const epoch=coreEpoch.current;try{const result=await elioClient.saveListeningCue({recordId:sub.recordId,...(sub.itemId!==undefined?{itemId:sub.itemId}:{}),cueIndex:sub.cueIndex,cueRevision:sub.cueRevision});if(epoch===coreEpoch.current){window.dispatchEvent(new CustomEvent('sprach_core_vocabulary_changed'));toast.success(result.skipped?'Câu này đã có trong bộ riêng.':'Đã lưu câu phụ đề vào bộ riêng; không tự tạo bản dịch.');}}catch(error){if(epoch===coreEpoch.current)toast.error(error.message);}return;}
    db.vocabulary.create({
      german: sub.de,
      vietnamese: sub.vi || 'Mẫu câu luyện nghe',
      level: currentEpisode.level || 'B1',
      topic: collection.title,
    });
    toast.success('Đã lưu câu này vào Thẻ từ vựng cá nhân!');
  };

  const canManage = isAdmin || (currentEpisode.owner ?? currentEpisode.created_by) === currentUser?.id;

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
        // Xóa luôn file video trong IndexedDB nếu đây là video máy tính
        // (db.listening.deleteEpisode cũng dọn, đây là lớp dự phòng)
        if (currentEpisode.localMediaId) {
          try { await deleteLocalMedia(currentEpisode.localMediaId); } catch {}
        }
        toast.success('Đã xóa video thành công!');
        navigate('/skills/listening');
      }catch(error){toast.error(error.message);}
    }
  };

  const handleSaveEpisode = (e) => {
    e.preventDefault();
    if (!editingEpisode) return;
    const isLocalVideo = !!editingEpisode.localMediaId;
    if (coreActive && !isLocalVideo) return toast.error('Sửa video chưa nối server.');
    db.listening.updateEpisode(editingEpisode.id, {
      title: editingEpisode.title,
      deTitle: editingEpisode.deTitle,
      ...(isLocalVideo ? {} : { youtubeId: editingEpisode.youtubeId }),
      level: editingEpisode.level,
      duration: editingEpisode.duration,
    });
    setEditingEpisode(null);
    toast.success('Đã lưu thông tin video!');
  };

  if (!resolvedEpisode) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4 animate-rise">
        <h2 className="font-display text-xl font-bold">Không tìm thấy video này</h2>
        <p className="text-sm text-muted-foreground">Video có thể đã bị xóa hoặc link không còn đúng. Quay lại danh sách để chọn tập khác.</p>
        <button onClick={() => navigate('/skills/listening')} className="tap px-4 py-2 rounded-sm bg-accent text-accent-foreground text-xs font-mono font-bold shadow-sm">Về danh sách tập</button>
      </div>
    );
  }

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
          <div
            ref={videoFrameRef}
            className="surface overflow-hidden border border-border shadow-md aspect-video relative bg-black rounded-sm"
          >
            {isLocalEpisode ? (
              localVideoUrl ? (
                <video
                  ref={localVideoRef}
                  src={localVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
                  {localVideoError ? (
                    <>
                      <p className="text-sm font-mono text-rose-300">{localVideoError}</p>
                      <p className="text-xs text-white/60">
                        Video máy tính chỉ lưu trong trình duyệt đã import. Mở lại bằng đúng trình duyệt/máy đó, hoặc import lại video.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-mono text-white/70">Đang tải video từ bộ nhớ máy…</p>
                  )}
                </div>
              )
            ) : (
              <div id="youtube-player-iframe" className="w-full h-full" />
            )}

            {/* Phụ đề trên video kiểu YouTube: hộp đen mờ gọn, chữ trắng căn
                giữa, tối đa 2 dòng mỗi thứ tiếng, chỉ hiện câu hiện tại.
                Tắt bằng nút CC thì biến mất hoàn toàn, video sạch. */}
            {subtitleOn && subtitles[activeSubIndex] &&
              ((showGerman && currentSub.de?.trim()) || (showVietnamese && currentSub.vi?.trim())) && (
              <div className={`absolute ${isLocalEpisode ? 'bottom-12' : 'bottom-10'} left-0 right-0 pointer-events-none flex justify-center z-20 px-4`}>
                <div
                  ref={subtitleBoxRef}
                  className={`pointer-events-auto max-w-3xl touch-none bg-black/70 px-3 py-1.5 text-center ${subtitleDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ transform: `translate(${subtitlePos.x}px, ${subtitlePos.y}px)` }}
                  onPointerDown={handleSubtitlePointerDown}
                  onPointerMove={handleSubtitlePointerMove}
                  onPointerUp={endSubtitleDrag}
                  onPointerCancel={endSubtitleDrag}
                  onClickCapture={handleSubtitleClickCapture}
                  title="Kéo để di chuyển phụ đề — bấm vào một từ để tra nghĩa"
                >
                  {showGerman && currentSub.de && (
                    <div
                      className={`pointer-events-auto text-white font-semibold leading-snug line-clamp-2 ${subSize.de}`}
                      onClick={pauseVideoForLookup}
                      title="Bấm vào một từ để tra nghĩa"
                    >
                      <LookupText key={activeSubIndex} text={currentSub.de} translation={currentSub.vi || ''} />
                    </div>
                  )}
                  {showVietnamese && currentSub.vi && (
                    <div className={`text-white/90 leading-snug line-clamp-2 ${subSize.vi}`}>
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

              {subtitles.length === 0 ? (
                <div className="p-4 rounded-sm border border-border bg-card text-sm text-muted-foreground">
                  Video chưa có phụ đề nên chưa chép chính tả được. Hãy bấm “Thêm phụ đề” ở cột lời thoại để tải file .srt/.vtt lên.
                </div>
              ) : (
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
              )}

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

              {/* Nút "Phụ đề": bấm mở menu cài đặt phụ đề (bật/tắt, cỡ chữ,
                  độ trễ). Các chỉnh phụ đề nằm gọn trong menu để thanh trên
                  chỉ còn 3 nút: Tiếng Đức, Dịch Việt, Phụ đề. */}
              <div className="relative" ref={subtitleMenuRef}>
                <button
                  type="button"
                  onClick={() => setSubtitleMenuOpen(value => !value)}
                  aria-expanded={subtitleMenuOpen}
                  aria-haspopup="true"
                  className={`tap px-2.5 py-1 rounded-sm text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all ${
                    subtitleOn
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-card border-border text-muted-foreground'
                  }`}
                  title="Cài đặt phụ đề trên video"
                >
                  <Captions className="w-3.5 h-3.5" />
                  <span>Phụ đề</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${subtitleMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {subtitleMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 z-30 w-64 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card p-3 shadow-xl space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold">Bật phụ đề</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={subtitleOn}
                        aria-label="Bật hoặc tắt phụ đề trên video"
                        onClick={() => setSubtitleOn(value => !value)}
                        className={`tap relative w-9 h-5 shrink-0 rounded-full transition-colors ${subtitleOn ? 'bg-accent' : 'bg-muted'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${subtitleOn ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono font-semibold">Cỡ chữ</span>
                      <div className="flex gap-1" role="group" aria-label="Cỡ chữ phụ đề trên video">
                        {[
                          ['small', 'Nhỏ'],
                          ['medium', 'Vừa'],
                          ['large', 'Lớn'],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSubtitleSize(value)}
                            aria-pressed={subtitleSize === value}
                            className={`tap flex-1 px-2 py-1 rounded-sm border text-xs font-mono font-bold ${
                              subtitleSize === value
                                ? 'bg-accent/10 border-accent/30 text-accent'
                                : 'bg-card border-border text-muted-foreground'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold">Trễ phụ đề</span>
                        <span className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold text-foreground">{formatSubtitleOffset(subtitleOffset)}</span>
                          <button
                            type="button"
                            onClick={() => changeSubtitleOffset(0)}
                            disabled={subtitleOffset === 0}
                            className="tap px-1.5 py-0.5 rounded-sm border border-border bg-card text-foreground text-xs hover:bg-muted disabled:opacity-40"
                            title="Đặt độ trễ phụ đề về 0"
                          >
                            ↺ 0
                          </button>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-10}
                        max={10}
                        step={0.5}
                        value={subtitleOffset}
                        onChange={(e) => changeSubtitleOffset(Number(e.target.value))}
                        className="w-full"
                        aria-label="Độ trễ phụ đề (giây)"
                      />
                      <p className="text-[11px] text-muted-foreground">Phụ đề chậm hơn tiếng thì kéo sang +, nhanh hơn thì kéo sang -. Lưu riêng cho video này.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {currentEpisode.youtubeId && (
                <button
                  type="button"
                  disabled={captionBusy || translatingBusy}
                  onClick={fetchCaptions}
                  className="tap px-2.5 py-1 text-xs border border-border bg-card hover:bg-muted font-mono rounded-sm transition-colors"
                >
                  {captionBusy ? 'Đang lấy & dịch…' : 'Lấy bản hiện lời'}
                </button>
              )}
              {(!currentEpisode.youtubeId || subtitles.length === 0) && (
                <button
                  type="button"
                  onClick={() => subtitleFileRef.current?.click()}
                  className="tap px-2.5 py-1 text-xs border border-border bg-card hover:bg-muted font-mono rounded-sm transition-colors"
                >
                  {subtitles.length ? 'Thay phụ đề' : 'Thêm phụ đề'}
                </button>
              )}
              {subtitles.length > 0 && (!subtitles[0]?.vi || !subtitles[Math.floor(subtitles.length / 2)]?.vi) && (
                <button
                  type="button"
                  disabled={translatingBusy || captionBusy}
                  onClick={translateCaptions}
                  className="tap px-2.5 py-1 text-xs border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 font-mono rounded-sm transition-colors"
                >
                  {translatingBusy ? 'Đang dịch…' : 'Dịch tiếng Việt'}
                </button>
              )}
              <button
                onClick={handleCopyTranscript}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Sao chép toàn bộ phụ đề"
              >
                <Copy className="w-4 h-4" />
              </button>
              {subtitles.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadSrt}
                  className="tap px-2.5 py-1 text-xs border border-border bg-card hover:bg-muted font-mono rounded-sm transition-colors flex items-center gap-1.5"
                  title="Tải file phụ đề .srt về máy để mở ở ngoài (VLC...)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải .srt</span>
                </button>
              )}
            </div>
          </div>

          {/* Transcript Scroll Container (Auto-highlight & auto-scroll) */}
          <input
            ref={subtitleFileRef}
            type="file"
            accept=".srt,.vtt"
            className="hidden"
            onChange={handleSubtitleFile}
          />
          <div className="surface p-2 border border-border max-h-[600px] overflow-y-auto space-y-2">
            {subtitles.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs font-mono text-muted-foreground">Chưa có phụ đề cho video này.</p>
                <button
                  type="button"
                  onClick={() => subtitleFileRef.current?.click()}
                  className="tap px-3 py-1.5 text-xs border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 font-mono rounded-sm transition-colors"
                >
                  Thêm phụ đề (.srt / .vtt)
                </button>
              </div>
            ) : (
              subtitles.map((sub, idx) => {
                const isActive = activeSubIndex === idx;
                const isLearned = learnedSubs.has(sub.id || idx);

                const totalSec = Math.floor(Number(sub.start) || 0);
                const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
                const sec = String(totalSec % 60).padStart(2, '0');

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
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingSub(idx);
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-accent"
                            title="Sửa câu phụ đề này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {editingSubIndex === idx ? (
                      <div onClick={(e) => e.stopPropagation()} className="space-y-2 mt-1">
                        <textarea
                          rows={2}
                          value={editingSubDe}
                          onChange={(e) => setEditingSubDe(e.target.value)}
                          placeholder="Câu tiếng Đức..."
                          className="w-full p-2 text-sm font-heading rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <textarea
                          rows={2}
                          value={editingSubVi}
                          onChange={(e) => setEditingSubVi(e.target.value)}
                          placeholder="Dịch tiếng Việt (để trống nếu chưa có)..."
                          className="w-full p-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={savingSub}
                            onClick={(e) => { e.stopPropagation(); saveEditedSub(); }}
                            className="tap px-3 py-1 rounded-sm bg-accent text-accent-foreground text-xs font-mono font-bold disabled:opacity-50"
                          >
                            {savingSub ? 'Đang lưu…' : 'Lưu câu này'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingSubIndex(null); }}
                            className="tap px-3 py-1 rounded-sm border border-border bg-card text-xs font-mono hover:bg-muted"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                      </>
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

              {editingEpisode.localMediaId ? (
                <p className="font-body text-sm text-muted-foreground">Video máy tính — tập này không có YouTube ID, sửa tên và cấp độ rồi lưu là được.</p>
              ) : (
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
              )}

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
