import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { LEVEL_IDS } from '@/data/levels';
import { SPECIALTIES } from '@/data/specialties';
import { buildLevelDecks } from '@/lib/level-deck-adapter';
import { toast } from 'sonner';
import { getYouTubeTranscript, extractYouTubeId } from '@/lib/youtube-transcript-extractor';
import { batchTranslateCues } from '@/lib/translator';
import {
  detectFileType,
  parseExcelFile,
  parseCsvTsvText,
  parseTxtVocab,
  parseDocxFile,
  parsePdfFile,
  parseYouTubeSubtitles,
  parseGrammarInput,
  parseExamJsonInput,
  parseMultiExams,
  parseSituationInput,
  VOCAB_14_COLUMNS,
} from '@/lib/document-parsers';
import {
  X,
  Upload,
  FileText,
  Youtube,
  BookOpen,
  Headphones,
  Edit3,
  Award,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

const MODULES = [
  { id: 'vocabulary', label: 'Từ vựng', icon: BookOpen, desc: 'Excel, CSV, TXT, TSV, JSON, PDF' },
  { id: 'grammar', label: 'Ngữ pháp', icon: Layers, desc: 'Bài giảng Markdown tay hoặc tài liệu PDF/DOCX' },
  { id: 'exam', label: 'Đề thi tổng hợp', icon: Award, desc: 'Goethe, telc, ÖSD (Đọc, Viết, Nói, Nghe)' },
  { id: 'listening', label: 'Luyện nghe YouTube', icon: Headphones, desc: 'Dán link video, tự động bóc tách bản hiện lời CC' },
  { id: 'reading', label: 'Bài đọc hiểu', icon: FileText, desc: 'Văn bản đọc & trắc nghiệm' },
  { id: 'writing', label: 'Luyện viết', icon: Edit3, desc: 'Đề viết thư, bài luận & tiêu chí' },
  { id: 'speaking', label: 'Luyện nói / Phỏng vấn', icon: MessageSquare, desc: 'Chủ đề thuyết trình & phỏng vấn AI' },
];

export function UniversalImportModal({
  isOpen,
  onClose,
  defaultType = 'vocabulary',
  initialScope = null,
  defaultCollectionId = null,
  onSuccess,
}) {
  const { navigate } = useRouter();
  const isAdmin = db.auth.isAdmin();
  const currentUser = db.auth.getUser();

  const [activeModule, setActiveModule] = useState(defaultType || 'vocabulary');
  const [level, setLevel] = useState('B1');
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState(initialScope || (isAdmin ? 'public' : 'private'));
  const [step, setStep] = useState(1); // 1: Input, 2: Preview & Confirm, 3: Success

  // File & Input States
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [warningText, setWarningText] = useState('');

  // Module 1: Từ vựng
  const [vocabText, setVocabText] = useState('');
  const [vocabItems, setVocabItems] = useState([]);
  const [vocabDuplicateMode, setVocabDuplicateMode] = useState('fill_blank');
  const [vocabTargetSection, setVocabTargetSection] = useState('levels'); // 'levels' | 'specialties' | 'personal' | 'situations'
  const [vocabTargetDeckId, setVocabTargetDeckId] = useState('');
  const [vocabTargetSpecialtyId, setVocabTargetSpecialtyId] = useState('pflege');
  const [availableLevelDecks, setAvailableLevelDecks] = useState([]);

  // Module 2: Ngữ pháp
  const [grammarMode, setGrammarMode] = useState('manual'); // 'manual' | 'file'
  const [grammarContent, setGrammarContent] = useState('');
  const [grammarExercisesJson, setGrammarExercisesJson] = useState('');
  const [grammarParsed, setGrammarParsed] = useState({ rule: '', exercises: [] });

  // Module 3: Đề thi
  const [examProvider, setExamProvider] = useState('Goethe');
  const [examSkill, setExamSkill] = useState('reading');
  const [examTeil, setExamTeil] = useState(1);
  const [examTasks, setExamTasks] = useState([]);

  // Module 4: Luyện nghe (YouTube & Podcast)
  const [targetCollectionId, setTargetCollectionId] = useState(defaultCollectionId || '');
  const [listeningMode, setListeningMode] = useState('youtube'); // 'youtube' | 'quiz' | 'podcast' | 'dictation' | 'shadowing'
  const [listeningCollections, setListeningCollections] = useState([]);
  const [listeningLinkType, setListeningLinkType] = useState('video'); // 'video' | 'playlist'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistManualList, setPlaylistManualList] = useState('');
  const [youtubeCues, setYoutubeCues] = useState([]);
  const [customSubtitles, setCustomSubtitles] = useState('');

  // Module 5: Kỹ năng khác
  const [readingText, setReadingText] = useState('');
  const [readingQuestions, setReadingQuestions] = useState('');
  const [writingPrompt, setWritingPrompt] = useState('');
  const [writingMinutes, setWritingMinutes] = useState(60);
  const [writingWords, setWritingWords] = useState(80);
  const [speakingPrompt, setSpeakingPrompt] = useState('');

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      const isVocabSub = ['situation', 'situations', 'specialties', 'specialty', 'levels', 'level', 'personal'].includes(defaultType);
      setActiveModule(isVocabSub ? 'vocabulary' : (defaultType || 'vocabulary'));
      setStep(1);
      setSelectedFile(null);
      setVocabItems([]);
      setYoutubeCues([]);
      setExamTasks([]);
      setWarningText('');
      setProgressText('');
      setTitle('');

      if (['situation', 'situations'].includes(defaultType)) {
        setVocabTargetSection('situations');
      } else if (['specialties', 'specialty'].includes(defaultType)) {
        setVocabTargetSection('specialties');
      } else if (['levels', 'level'].includes(defaultType)) {
        setVocabTargetSection('levels');
      } else if (defaultType === 'personal') {
        setVocabTargetSection('personal');
      }

      // Nạp danh sách bộ từ vựng theo cấp độ
      try {
        const decks = buildLevelDecks(db.vocabulary.findMany());
        setAvailableLevelDecks(decks);
      } catch {
        setAvailableLevelDecks([]);
      }

      // Nạp danh sách bộ nghe hiện có trong hệ thống
      try {
        const cols = db.listening.getCollections() || [];
        setListeningCollections(cols);
        if (defaultCollectionId) {
          setTargetCollectionId(defaultCollectionId);
          const found = cols.find(c => c.id === defaultCollectionId);
          if (found) {
            if (found.level) setLevel(found.level);
            if (found.scope) setScope(found.scope);
          }
        } else {
          setTargetCollectionId('');
        }
      } catch {
        setListeningCollections([]);
        setTargetCollectionId('');
      }
    }
  }, [isOpen, defaultType, defaultCollectionId]);

  // Khóa cuộn trang nền khi mở popup độc lập
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ==========================================
  // XỬ LÝ TRÍCH XUẤT TỪNG MODULE (BƯỚC 1 -> BƯỚC 2)
  // ==========================================
  const handleExtract = async () => {
    setIsProcessing(true);
    setWarningText('');
    setProgressText('Đang xử lý dữ liệu...');

    try {
      // 1. MODULE TỪ VỰNG
      if (activeModule === 'vocabulary') {
        let items = [];
        if (selectedFile) {
          const ext = selectedFile.name.split('.').pop().toLowerCase();
          if (['xlsx', 'xls'].includes(ext)) {
            setProgressText('Đang đọc bảng tính Excel...');
            const parsed = await parseExcelFile(selectedFile);
            items = parsed.items || [];
          } else if (['csv', 'tsv'].includes(ext)) {
            const text = await selectedFile.text();
            items = parseCsvTsvText(text);
          } else if (ext === 'txt') {
            const text = await selectedFile.text();
            items = parseTxtVocab(text);
          } else if (ext === 'json') {
            const data = JSON.parse(await selectedFile.text());
            items = Array.isArray(data) ? data : data.words || data.items || [];
          } else if (ext === 'pdf') {
            setProgressText('Đang trích xuất từ vựng từ PDF...');
            const pdf = await parsePdfFile(selectedFile);
            items = parseTxtVocab(pdf.fullText);
          }
        } else if (vocabText.trim()) {
          // Nhập text trực tiếp dạng "das Haus - ngôi nhà" hoặc CSV/Tab
          items = parseTxtVocab(vocabText);
        }

        if (!items || !items.length) {
          throw new Error('Không tìm thấy từ vựng hợp lệ. Vui lòng kiểm tra lại định dạng tệp hoặc văn bản nhập.');
        }

        // Bổ sung thuộc tính kiểm tra
        let targetTopic = title.trim();
        if (vocabTargetSection === 'specialties') {
          const spec = SPECIALTIES.find(s => s.id === vocabTargetSpecialtyId);
          targetTopic = targetTopic || (spec ? spec.vi : 'Chuyên ngành');
        } else if (vocabTargetSection === 'levels') {
          if (vocabTargetDeckId) {
            const foundDeck = availableLevelDecks.find(d => d.id === vocabTargetDeckId);
            if (foundDeck) targetTopic = foundDeck.title;
          }
          if (!targetTopic) targetTopic = title.trim() || `Bộ từ vựng ${level}`;
        } else if (vocabTargetSection === 'situations') {
          targetTopic = targetTopic || 'Tình huống giao tiếp';
        } else {
          targetTopic = targetTopic || 'Bộ thẻ cá nhân';
        }

        const formatted = items.map((item, idx) => ({
          _id: `v_${Date.now()}_${idx}`,
          german: item.german || item.de || '',
          vietnamese: item.vietnamese || item.vi || '',
          article: item.article || (item.german?.match(/^(der|die|das)\s/i)?.[1]?.toLowerCase() || ''),
          example_de: item.example_de || item.exampleDe || '',
          example_vi: item.example_vi || item.exampleVi || '',
          word_type: item.word_type || item.type || '',
          level: item.level || level,
          topic: item.topic || targetTopic,
        })).filter(i => i.german.trim());

        if (!formatted.length) throw new Error('Mỗi từ cần có từ tiếng Đức (German).');

        setVocabItems(formatted);
        if (!title.trim() && selectedFile) setTitle(selectedFile.name.replace(/\.[^.]+$/, ''));
        else if (!title.trim()) setTitle(targetTopic);
        setStep(2);
      }

      // 2. MODULE NGỮ PHÁP
      else if (activeModule === 'grammar') {
        let rule = '';
        let exercises = [];

        if (grammarMode === 'manual') {
          if (!grammarContent.trim()) throw new Error('Vui lòng nhập nội dung bài giảng Markdown.');
          rule = grammarContent.trim();
          if (grammarExercisesJson.trim()) {
            try {
              exercises = JSON.parse(grammarExercisesJson);
            } catch {
              throw new Error('Ngân hàng bài tập JSON không đúng cú pháp.');
            }
          }
        } else if (selectedFile) {
          const ext = selectedFile.name.split('.').pop().toLowerCase();
          if (ext === 'pdf') {
            const pdf = await parsePdfFile(selectedFile);
            rule = pdf.fullText;
          } else if (ext === 'docx') {
            const docx = await parseDocxFile(selectedFile);
            rule = docx.rawText;
          } else {
            rule = await selectedFile.text();
          }
        }

        if (!rule.trim()) throw new Error('Chưa có nội dung lý thuyết bài giảng.');

        setGrammarParsed({ rule, exercises: Array.isArray(exercises) ? exercises : [] });
        if (!title.trim()) setTitle(selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'Bài giảng ngữ pháp ' + level);
        setStep(2);
      }

      // 3. MODULE ĐỀ THI TỔNG HỢP (ExamLibrary)
      else if (activeModule === 'exam') {
        let rawContent = '';
        if (selectedFile) {
          const ext = selectedFile.name.split('.').pop().toLowerCase();
          if (ext === 'pdf') {
            const pdf = await parsePdfFile(selectedFile);
            rawContent = pdf.rawText;
          } else if (ext === 'docx') {
            const docx = await parseDocxFile(selectedFile);
            rawContent = docx.rawText;
          } else if (ext === 'json') {
            const data = JSON.parse(await selectedFile.text());
            setExamTasks(Array.isArray(data) ? data : data.tasks || [data]);
            setStep(2);
            return;
          } else {
            rawContent = await selectedFile.text();
          }
        }

        if (!rawContent.trim()) throw new Error('Vui lòng chọn tệp đề thi để trích xuất.');

        // Phân tách đề thi
        const multi = parseMultiExams(rawContent, { level, provider: examProvider });
        if (!multi.success || !multi.exams?.length) {
          // Fallback tạo task thủ công
          setExamTasks([{
            title: title || selectedFile?.name.replace(/\.[^.]+$/, '') || `Đề thi ${examProvider} ${level}`,
            exam: examProvider,
            level,
            skill: examSkill,
            teil: examTeil,
            content: rawContent,
            questions: [],
          }]);
        } else {
          setExamTasks(multi.exams.map((e, idx) => ({
            title: e.title || `Phần thi ${idx + 1}`,
            exam: e.exam || examProvider,
            level: e.level || level,
            skill: e.skill || examSkill,
            teil: e.teil || idx + 1,
            content: e.content || rawContent,
            questions: e.questions || [],
          })));
        }
        if (!title.trim()) setTitle(selectedFile?.name.replace(/\.[^.]+$/, '') || `Bộ đề ${examProvider} ${level}`);
        setStep(2);
      }

      // 4. MODULE LUYỆN NGHE (YouTube)
      else if (activeModule === 'listening') {
        if (listeningLinkType === 'playlist') {
          setProgressText('Đang lấy danh sách các tập từ Playlist YouTube...');
          const listMatch = (youtubeUrl || '').match(/[?&]list=([^#&?]+)/);
          const playlistId = listMatch ? listMatch[1] : null;

          let items = [];
          const seen = new Set();

          // 1. Phân tích nếu có danh sách video do người dùng dán vào
          if (playlistManualList && playlistManualList.trim()) {
            const lines = playlistManualList.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const vidMatch = trimmed.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|^)([a-zA-Z0-9_-]{11})/);
              const vid = vidMatch ? vidMatch[1] : null;
              if (vid && !seen.has(vid)) {
                seen.add(vid);
                const parts = trimmed.split('|');
                const customTitle = parts[1] ? parts[1].trim() : `Tập ${items.length + 1}`;
                items.push({ id: vid, title: customTitle, selected: true });
              }
            }
          }

          // 2. Thử gọi các public instance Invidious để lấy toàn bộ playlist
          if (playlistId && items.length === 0) {
            const instances = [
              'https://invidious.nerdvpn.de',
              'https://inv.tux.pizza',
              'https://yt.drgnz.club',
              'https://vid.priv.au'
            ];
            for (const base of instances) {
              try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 6000);
                const res = await fetch(`${base}/api/v1/playlists/${playlistId}`, { signal: controller.signal });
                clearTimeout(tid);
                if (res.ok) {
                  const data = await res.json();
                  if (Array.isArray(data.videos) && data.videos.length > 0) {
                    for (const v of data.videos) {
                      if (v.videoId && !seen.has(v.videoId)) {
                        seen.add(v.videoId);
                        items.push({
                          id: v.videoId,
                          title: v.title || `Tập ${items.length + 1}`,
                          selected: true
                        });
                      }
                    }
                    if (items.length > 0) {
                      if (!title.trim() && data.title) setTitle(data.title);
                      break;
                    }
                  }
                }
              } catch {}
            }
          }

          if (items.length === 0) {
            const singleId = extractYouTubeId(youtubeUrl);
            if (singleId) {
              items.push({ id: singleId, title: 'Tập 1', selected: true });
            } else {
              throw new Error('Chưa tìm thấy video nào. Hãy kiểm tra lại link Playlist hoặc dán danh sách URL các video.');
            }
          }

          setPlaylistVideos(items);
          if (!title.trim()) setTitle(`Bộ Playlist YouTube (${items.length} tập)`);
          setStep(2);
        } else {
          const videoId = extractYouTubeId(youtubeUrl);
          if (!videoId) throw new Error('Đường link YouTube hoặc Video ID không hợp lệ.');

          let cues = [];
          if (customSubtitles.trim()) {
            cues = parseYouTubeSubtitles(customSubtitles);
          } else {
            setProgressText('Đang tự động bóc tách bản hiện lời từ YouTube...');
            const transcriptRes = await getYouTubeTranscript(videoId, 'de');
            if (transcriptRes.available && Array.isArray(transcriptRes.cues) && transcriptRes.cues.length > 0) {
              cues = transcriptRes.cues.map((c, idx) => ({
                _id: `cue-${idx}`,
                start: c.start,
                end: c.end,
                de: c.text,
                vi: '',
              }));

              // Tự động dịch sang tiếng Việt
              try {
                setProgressText('Đang tự động dịch sang tiếng Việt...');
                cues = await batchTranslateCues(cues);
              } catch (e) {
                console.warn('Lỗi dịch sang tiếng Việt khi import:', e);
              }
            } else {
              setWarningText(transcriptRes.reason || 'Video chưa có phụ đề tiếng Đức tự động. Bạn vẫn có thể lưu video và bổ sung sau.');
            }
          }

          setYoutubeCues(cues);
          if (!title.trim()) setTitle('Video YouTube · ' + videoId);
          setStep(2);
        }
      }

      // 5. CÁC MODULE KỸ NĂNG KHÁC (Reading, Writing, Speaking)
      else if (['reading', 'writing', 'speaking'].includes(activeModule)) {
        if (!title.trim()) setTitle(`Tài liệu luyện ${activeModule} ${level}`);
        setStep(2);
      }

    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // XÁC NHẬN LƯU VÀO DATABASE (BƯỚC 2 -> HOÀN TẤT)
  // ==========================================
  const handleConfirmSave = async () => {
    setIsProcessing(true);
    setProgressText('Đang lưu vào kho học tập...');

    try {
      // 1. LƯU TỪ VỰNG
      if (activeModule === 'vocabulary') {
        let addedCount = 0;
        let finalTopic = title.trim();
        if (vocabTargetSection === 'specialties') {
          const spec = SPECIALTIES.find(s => s.id === vocabTargetSpecialtyId);
          finalTopic = finalTopic || (spec ? spec.vi : 'Chuyên ngành');
        } else if (vocabTargetSection === 'levels') {
          if (vocabTargetDeckId) {
            const foundDeck = availableLevelDecks.find(d => d.id === vocabTargetDeckId);
            if (foundDeck) finalTopic = foundDeck.title;
          }
          if (!finalTopic) finalTopic = title.trim() || `Bộ từ vựng ${level}`;
        } else if (vocabTargetSection === 'situations') {
          finalTopic = finalTopic || 'Tình huống giao tiếp';
        } else {
          finalTopic = finalTopic || 'Bộ thẻ cá nhân';
        }

        for (const item of vocabItems) {
          db.vocabulary.create({
            german: item.german,
            article: item.article,
            vietnamese: item.vietnamese,
            example_de: item.example_de,
            example_vi: item.example_vi,
            word_type: item.word_type,
            level: item.level || level,
            topic: item.topic || finalTopic,
          });
          addedCount++;
        }

        // Nếu là tình huống giao tiếp, lưu cả dạng situation vào universal để hiển thị trong /vocabulary/situations
        if (vocabTargetSection === 'situations') {
          db.universal.create({
            type: 'situation',
            title: finalTopic,
            level,
            scope,
            data: {
              title_vi: finalTopic,
              title_de: finalTopic,
              level,
              description: `Tình huống nhập từ tài liệu: ${finalTopic}`,
              dialogue: vocabItems.map(item => ({
                speaker: 'A',
                de: item.german + (item.example_de ? `. ${item.example_de}` : ''),
                vi: item.vietnamese + (item.example_vi ? `. ${item.example_vi}` : ''),
              })),
              keywords: vocabItems.map(i => i.german),
            },
          });
        }

        db.universal.create({
          type: 'vocabulary',
          title: finalTopic,
          level,
          scope,
          data: {
            total: vocabItems.length,
            added: addedCount,
            section: vocabTargetSection,
            specialtyId: vocabTargetSection === 'specialties' ? vocabTargetSpecialtyId : undefined,
          },
        });
        toast.success(`Đã lưu thành công ${addedCount} từ vựng vào "${finalTopic}"!`);
      }

      // 2. LƯU NGỮ PHÁP
      else if (activeModule === 'grammar') {
        db.universal.create({
          type: 'grammar',
          title: title || 'Chủ điểm ngữ pháp ' + level,
          level,
          scope,
          data: {
            title_vi: title,
            title_de: title,
            level,
            explanation: grammarParsed.rule,
            exercises: grammarParsed.exercises,
          },
        });
        toast.success(`Đã lưu bài giảng ngữ pháp "${title}"!`);
      }

      // 3. LƯU ĐỀ THI
      else if (activeModule === 'exam') {
        for (const task of examTasks) {
          db.universal.create({
            type: 'exam',
            title: task.title || title,
            level: task.level || level,
            scope,
            data: {
              exam: task.exam || examProvider,
              level: task.level || level,
              skill: task.skill || examSkill,
              teil: task.teil || 1,
              content: task.content,
              questions: task.questions || [],
            },
          });
        }
        toast.success(`Đã lưu ${examTasks.length} phần thi vào kho Luyện thi & Thi thử!`);
      }

      // 4. LƯU VIDEO HOẶC PLAYLIST LUYỆN NGHE
      else if (activeModule === 'listening') {
        let col = null;
        if (targetCollectionId) {
          col = db.listening.getCollectionById(targetCollectionId) || listeningCollections.find(c => c.id === targetCollectionId);
        }

        const colTitle = col ? col.title : (title || (listeningLinkType === 'playlist' ? 'Bộ Playlist YouTube' : 'Video cá nhân'));

        if (!col) {
          col = db.listening.createCollection({
            title: colTitle,
            deTitle: colTitle,
            provider: listeningMode === 'podcast' ? 'Podcast' : (listeningLinkType === 'playlist' ? 'YouTube Playlist' : (scope === 'private' ? 'Video của tôi' : 'Cộng đồng')),
            category: listeningMode,
            level,
            scope,
            thumbnail: listeningLinkType === 'playlist' && playlistVideos[0]?.id ? `https://img.youtube.com/vi/${playlistVideos[0].id}/hqdefault.jpg` : undefined,
            description: `Bộ luyện nghe ${colTitle}`,
          });
        }

        if (listeningLinkType === 'playlist') {
          const selectedVideos = playlistVideos.filter(v => v.selected !== false);
          if (selectedVideos.length === 0) throw new Error('Vui lòng chọn ít nhất 1 video từ playlist để lưu.');

          for (const v of selectedVideos) {
            db.listening.createEpisode({
              collectionId: col.id,
              title: v.title,
              deTitle: v.title,
              level,
              youtubeId: v.id,
              scope,
              category: listeningMode,
              subtitles: [],
            });
          }

          toast.success(`Đã lưu thành công bộ "${col.title}" gồm ${selectedVideos.length} tập video!`);
        } else {
          const videoId = extractYouTubeId(youtubeUrl);
          const episodeTitle = (targetCollectionId && title) ? title : colTitle;
          db.listening.createEpisode({
            collectionId: col.id,
            title: episodeTitle,
            deTitle: episodeTitle,
            level,
            youtubeId: videoId,
            scope,
            category: listeningMode,
            subtitles: youtubeCues,
          });

          toast.success(`Đã thêm video "${episodeTitle}" vào bộ "${col.title}" thành công!`);
        }
      }

      // 5. LƯU KỸ NĂNG KHÁC (Reading, Writing, Speaking)
      else {
        db.universal.create({
          type: activeModule,
          title: title || `Bài luyện ${activeModule} ${level}`,
          level,
          scope,
          data: {
            readingText,
            readingQuestions,
            writingPrompt,
            writingMinutes,
            writingWords,
            speakingPrompt,
          },
        });
        toast.success(`Đã lưu bài luyện ${activeModule}!`);
      }

      // Phát sự kiện cập nhật toàn hệ thống
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      window.dispatchEvent(new CustomEvent('sprach_listening_change'));
      setStep(3);
      if (onSuccess) onSuccess();

    } catch (err) {
      toast.error('Lỗi khi lưu: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const modalContent = (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="surface border border-border w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl overflow-hidden my-auto"
      >
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span>Import Tài Liệu Học Tập</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-mono font-medium">
                {MODULES.find(m => m.id === activeModule)?.label}
              </span>
            </h2>
            <p className="text-xs font-body text-muted-foreground mt-0.5">
              Quy trình riêng biệt cho từng kỹ năng · Offline-first không lỗi mạng · Giữ nguyên vẹn dữ liệu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODULE TABS (CHỌN KỸ NĂNG) */}
        {step === 1 && (
          <div className="border-b border-border bg-muted/30 px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {MODULES.map(m => {
              const Icon = m.icon;
              const isActive = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setActiveModule(m.id); setStep(1); }}
                  className={`tap px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* BODY NỘI DUNG */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* ======================================================== */}
          {/* BƯỚC 1: NHẬP LIỆU (TỪNG MODULE RIÊNG BIỆT) */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-5">
              
              {/* THÔNG TIN CHUNG: TIÊU ĐỀ, CẤP ĐỘ, PHẠM VI & CHỌN BỘ ĐÍCH */}
              {activeModule === 'listening' ? (
                <div className="space-y-3 p-3.5 sm:p-4 rounded-xl border border-accent/20 bg-accent/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-medium text-foreground flex items-center justify-between">
                        <span className="font-bold text-accent">Import vào bộ nào? *</span>
                        <span className="text-[10px] text-muted-foreground">Chọn bộ đã có hoặc tạo mới</span>
                      </label>
                      <select
                        value={targetCollectionId}
                        onChange={e => {
                          const val = e.target.value;
                          setTargetCollectionId(val);
                          if (val) {
                            const found = listeningCollections.find(c => c.id === val);
                            if (found) {
                              if (found.level) setLevel(found.level);
                              if (found.scope) setScope(found.scope);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card font-mono text-foreground font-semibold cursor-pointer shadow-2xs"
                      >
                        <option value="">+ Tạo bộ nghe mới (nhập tên bên dưới)</option>
                        {listeningCollections.map(col => (
                          <option key={col.id} value={col.id}>
                            📁 {col.title} ({col.level || 'B1'} · {col.scope === 'public' ? 'Kho chung' : 'Cá nhân'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">
                        Mục luyện nghe (Chế độ tương ứng ở kho nghe)
                      </label>
                      <select
                        value={listeningMode}
                        onChange={e => setListeningMode(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card font-mono cursor-pointer shadow-2xs"
                      >
                        <option value="youtube">📺 YouTube (Dán link, học với phụ đề)</option>
                        <option value="quiz">🎧 Bài nghe & Quiz (Nghe, hiểu và trả lời câu hỏi)</option>
                        <option value="podcast">🎙️ Podcast (Các tập nghe do bạn hoặc Admin thêm)</option>
                        <option value="dictation">✍️ Chép chính tả (Nghe từng câu, gõ và đối chiếu)</option>
                        <option value="shadowing">🗣️ Shadowing (Nghe mẫu, ghi âm và nghe lại)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">
                        {targetCollectionId ? 'Tiêu đề tập video (Tùy chọn)' : 'Tên bộ nghe mới *'}
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={targetCollectionId ? 'Để trống sẽ lấy tên từ video YouTube...' : 'VD: Märchen, Deutsch lernen B1...'}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">Cấp độ đích</label>
                      <select
                        value={level}
                        onChange={e => setLevel(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card font-mono"
                      >
                        {LEVEL_IDS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">Phạm vi lưu</label>
                      <select
                        value={scope}
                        onChange={e => setScope(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      >
                        <option value="private">Chỉ riêng tôi (Cá nhân)</option>
                        {isAdmin && <option value="public">Kho chung toàn hệ thống (Super Admin)</option>}
                      </select>
                    </div>
                  </div>
                </div>
              ) : activeModule === 'vocabulary' ? (
                <div className="space-y-3 p-3.5 sm:p-4 rounded-xl border border-accent/20 bg-accent/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Mục đích đến & Phân loại từ vựng
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Chọn routing lưu tương ứng trong hệ thống Từ vựng
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-mono font-medium text-muted-foreground">
                        Mục từ vựng đích (Routing)
                      </label>
                      <select
                        value={vocabTargetSection}
                        onChange={e => {
                          const val = e.target.value;
                          setVocabTargetSection(val);
                          if (val === 'specialties') {
                            const spec = SPECIALTIES.find(s => s.id === vocabTargetSpecialtyId) || SPECIALTIES[0];
                            if (spec) setTitle(`${spec.vi} · ${spec.de}`);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card font-mono font-semibold text-accent"
                      >
                        <option value="levels">📚 Bộ từ theo cấp độ (/vocabulary/levels)</option>
                        <option value="specialties">💼 Chuyên ngành (/vocabulary/specialties)</option>
                        <option value="situations">💬 Tình huống giao tiếp (/vocabulary/situations)</option>
                        <option value="personal">🗂️ Bộ thẻ của tôi (/vocabulary - Thẻ cá nhân)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">Cấp độ đích</label>
                      <select
                        value={level}
                        onChange={e => setLevel(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card font-mono"
                      >
                        {LEVEL_IDS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">Phạm vi lưu</label>
                      <select
                        value={scope}
                        onChange={e => setScope(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      >
                        <option value="private">Chỉ riêng tôi (Cá nhân)</option>
                        {isAdmin && <option value="public">Kho chung toàn hệ thống (Super Admin)</option>}
                      </select>
                    </div>
                  </div>

                  {vocabTargetSection === 'specialties' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">
                        Chọn Chuyên ngành (1 trong {SPECIALTIES.length} chuyên ngành thực tế)
                      </label>
                      <select
                        value={vocabTargetSpecialtyId}
                        onChange={e => {
                          const sid = e.target.value;
                          setVocabTargetSpecialtyId(sid);
                          const spec = SPECIALTIES.find(s => s.id === sid);
                          if (spec) setTitle(`${spec.vi} · ${spec.de}`);
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      >
                        {SPECIALTIES.map(s => (
                          <option key={s.id} value={s.id}>
                            #{s.code} {s.vi} — {s.de} ({s.topic})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {vocabTargetSection === 'levels' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-mono font-medium text-muted-foreground">
                          Chọn bộ có sẵn hoặc nhập mới bên phải
                        </label>
                        <select
                          value={vocabTargetDeckId}
                          onChange={e => {
                            const val = e.target.value;
                            setVocabTargetDeckId(val);
                            if (val) {
                              const d = availableLevelDecks.find(deck => deck.id === val);
                              if (d) setTitle(d.title);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-xs font-mono"
                        >
                          <option value="">-- Nhập tên bộ mới --</option>
                          {availableLevelDecks.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.title} ({d.cards?.length || 0} từ)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-mono font-medium text-muted-foreground">Tên bộ từ vựng</label>
                        <input
                          type="text"
                          value={title}
                          onChange={e => {
                            setTitle(e.target.value);
                            setVocabTargetDeckId('');
                          }}
                          placeholder="VD: Goethe B1 Lektion 1..."
                          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                        />
                      </div>
                    </div>
                  )}

                  {vocabTargetSection === 'situations' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">
                        Tên tình huống giao tiếp
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="VD: Hỏi đường tại ga tàu, Đặt bàn tại nhà hàng..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      />
                    </div>
                  )}

                  {vocabTargetSection === 'personal' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-mono font-medium text-muted-foreground">
                        Tên bộ thẻ cá nhân (SRS)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="VD: Từ vựng tự học tuần này..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-mono font-medium text-muted-foreground">Tên bộ / Chủ đề</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="VD: Goethe B1 Lektion 1..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-muted-foreground">Cấp độ đích</label>
                    <select
                      value={level}
                      onChange={e => setLevel(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card font-mono"
                    >
                      {LEVEL_IDS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-muted-foreground">Phạm vi lưu</label>
                    <select
                      value={scope}
                      onChange={e => setScope(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                    >
                      <option value="private">Chỉ riêng tôi (Cá nhân)</option>
                      {isAdmin && <option value="public">Kho chung toàn hệ thống (Super Admin)</option>}
                    </select>
                  </div>
                </div>
              )}

              {/* MODULE 1: TỪ VỰNG */}
              {activeModule === 'vocabulary' && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card/50">
                  <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span>Nhập từ vựng (Excel, CSV, TXT, PDF)</span>
                  </h3>
                  
                  {/* Tải tệp */}
                  <label className="border-2 border-dashed border-border hover:border-accent/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-card/30 hover:bg-card transition-all">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-foreground">
                      {selectedFile ? selectedFile.name : 'Chọn tệp Excel (.xlsx/.xls), CSV, TXT, PDF, JSON'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Nếu có cột nghĩa tiếng Việt sẽ nhập trực tiếp tức thì, không gọi AI
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.tsv,.txt,.json,.pdf,.png,.jpg"
                      onChange={e => setSelectedFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>

                  {/* Hoặc dán text */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-muted-foreground">
                      Hoặc dán văn bản từ vựng (Mỗi dòng một từ, VD: <code>das Haus - ngôi nhà</code> hoặc dạng bảng Tab):
                    </label>
                    <textarea
                      rows={5}
                      value={vocabText}
                      onChange={e => setVocabText(e.target.value)}
                      placeholder="das Haus - ngôi nhà&#10;arbeiten - làm việc&#10;schön - đẹp"
                      className="w-full p-3 font-mono text-xs rounded-lg border border-border bg-card"
                    />
                  </div>
                </div>
              )}

              {/* MODULE 2: NGỮ PHÁP */}
              {activeModule === 'grammar' && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card/50">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent" />
                      <span>Nhập bài giảng ngữ pháp</span>
                    </h3>
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setGrammarMode('manual')}
                        className={`px-3 py-1 rounded-md ${grammarMode === 'manual' ? 'bg-card font-bold shadow-xs text-foreground' : 'text-muted-foreground'}`}
                      >
                        Nhập Markdown tay (Không gọi AI)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrammarMode('file')}
                        className={`px-3 py-1 rounded-md ${grammarMode === 'file' ? 'bg-card font-bold shadow-xs text-foreground' : 'text-muted-foreground'}`}
                      >
                        Tải tệp PDF / Word
                      </button>
                    </div>
                  </div>

                  {grammarMode === 'manual' ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono font-medium text-muted-foreground">
                          Nội dung bài giảng (Markdown hỗ trợ tiêu đề <code>##</code>, in đậm <code>**</code>, và bảng <code>| --- |</code>):
                        </label>
                        <textarea
                          rows={8}
                          value={grammarContent}
                          onChange={e => setGrammarContent(e.target.value)}
                          placeholder="## 1. Quy tắc chia động từ&#10;Giải thích chi tiết...&#10;&#10;| Ngôi | Động từ |&#10;| --- | --- |&#10;| ich | lerne |"
                          className="w-full p-3 font-mono text-xs rounded-lg border border-border bg-card"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-mono font-medium text-muted-foreground">
                          Ngân hàng bài tập kèm theo (Định dạng JSON - Có thể để trống):
                        </label>
                        <textarea
                          rows={4}
                          value={grammarExercisesJson}
                          onChange={e => setGrammarExercisesJson(e.target.value)}
                          placeholder='[{"question":"Das Haus ___ gebaut.","answers":["wird"],"explanation":"Bị động với werden"}]'
                          className="w-full p-3 font-mono text-xs rounded-lg border border-border bg-card"
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-border hover:border-accent/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-card/30 hover:bg-card">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium text-foreground">
                        {selectedFile ? selectedFile.name : 'Chọn tệp PDF hoặc DOCX tài liệu ngữ pháp'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={e => setSelectedFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* MODULE 3: ĐỀ THI TỔNG HỢP */}
              {activeModule === 'exam' && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card/50">
                  <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent" />
                    <span>Bộ đề thi tổng hợp (Liên kết Luyện viết, Luyện nói, Thi thử)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-muted-foreground">Kỳ thi</label>
                      <select
                        value={examProvider}
                        onChange={e => setExamProvider(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      >
                        <option value="Goethe">Goethe-Zertifikat</option>
                        <option value="Telc">telc Deutsch</option>
                        <option value="ÖSD">ÖSD Zertifikat</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-muted-foreground">Kỹ năng mặc định</label>
                      <select
                        value={examSkill}
                        onChange={e => setExamSkill(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      >
                        <option value="reading">Đọc hiểu (Lesen)</option>
                        <option value="writing">Luyện viết (Schreiben)</option>
                        <option value="speaking">Luyện nói (Sprechen)</option>
                        <option value="listening">Luyện nghe (Hören)</option>
                        <option value="grammar">Sprachbausteine (Ngữ pháp)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-muted-foreground">Phần thi (Teil)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={examTeil}
                        onChange={e => setExamTeil(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                      />
                    </div>
                  </div>

                  <label className="border-2 border-dashed border-border hover:border-accent/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-card/30 hover:bg-card">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-foreground">
                      {selectedFile ? selectedFile.name : 'Chọn tệp PDF, Ảnh scan, Word hoặc JSON đề thi'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Chỉ lấy đáp án có sẵn từ tài liệu; không bịa đáp án làm sai đề gốc
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.xlsx,.csv,.json,.png,.jpg,.jpeg"
                      onChange={e => setSelectedFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* MODULE 4: LUYỆN NGHE YOUTUBE */}
              {activeModule === 'listening' && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-accent" />
                      <span>Nhập Video hoặc Playlist YouTube</span>
                    </h3>

                    {/* Switch Video vs Playlist */}
                    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setListeningLinkType('video')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          listeningLinkType === 'video'
                            ? 'bg-accent text-accent-foreground font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        1 Video đơn lẻ
                      </button>
                      <button
                        type="button"
                        onClick={() => setListeningLinkType('playlist')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          listeningLinkType === 'playlist'
                            ? 'bg-accent text-accent-foreground font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Playlist YouTube
                      </button>
                    </div>
                  </div>

                  {listeningLinkType === 'video' ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono font-medium text-muted-foreground">
                          Đường dẫn video YouTube hoặc Video ID *
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={youtubeUrl}
                            onChange={e => setYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card font-mono"
                          />
                          <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                        </div>
                      </div>

                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Tùy chọn: Tự dán phụ đề SRT hoặc timestamp nếu muốn tự chuẩn hóa
                        </summary>
                        <textarea
                          rows={4}
                          value={customSubtitles}
                          onChange={e => setCustomSubtitles(e.target.value)}
                          placeholder="0:10 Hallo zusammen | Xin chào mọi người&#10;0:15 Wie geht es Ihnen?"
                          className="w-full mt-2 p-3 font-mono text-xs rounded-lg border border-border bg-card"
                        />
                      </details>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono font-medium text-muted-foreground flex items-center justify-between">
                          <span>Đường dẫn Playlist YouTube *</span>
                          <span className="text-[10px] text-accent">Có chứa tham số list=...</span>
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={youtubeUrl}
                            onChange={e => setYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/playlist?list=PL..."
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card font-mono"
                          />
                          <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono font-medium text-muted-foreground">
                          Hoặc dán danh sách URL các video (mỗi dòng 1 link hoặc ID | Tên tập)
                        </label>
                        <textarea
                          rows={4}
                          value={playlistManualList}
                          onChange={e => setPlaylistManualList(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... | Tập 1: Xin chào&#10;https://www.youtube.com/watch?v=... | Tập 2: Gia đình tôi"
                          className="w-full p-2.5 font-mono text-xs rounded-lg border border-border bg-card"
                        />
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Hệ thống sẽ nạp toàn bộ danh sách tập vào một Bộ nghe mới. Phụ đề tiếng Đức & tiếng Việt sẽ được lấy tự động khi mở video.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODULE 5: READING, WRITING, SPEAKING */}
              {['reading', 'writing', 'speaking'].includes(activeModule) && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card/50">
                  <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-accent" />
                    <span>Nhập bài luyện kỹ năng {activeModule}</span>
                  </h3>
                  {activeModule === 'reading' && (
                    <div className="space-y-3">
                      <textarea
                        rows={6}
                        value={readingText}
                        onChange={e => setReadingText(e.target.value)}
                        placeholder="Dán nội dung văn bản bài đọc hiểu..."
                        className="w-full p-3 text-xs rounded-lg border border-border bg-card"
                      />
                    </div>
                  )}
                  {activeModule === 'writing' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-mono text-muted-foreground">Thời gian (phút)</label>
                          <input
                            type="number"
                            value={writingMinutes}
                            onChange={e => setWritingMinutes(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-mono text-muted-foreground">Số từ yêu cầu</label>
                          <input
                            type="number"
                            value={writingWords}
                            onChange={e => setWritingWords(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                          />
                        </div>
                      </div>
                      <textarea
                        rows={4}
                        value={writingPrompt}
                        onChange={e => setWritingPrompt(e.target.value)}
                        placeholder="Nội dung đề bài viết và các ý gợi ý (Leitpunkte)..."
                        className="w-full p-3 text-xs rounded-lg border border-border bg-card"
                      />
                    </div>
                  )}
                  {activeModule === 'speaking' && (
                    <textarea
                      rows={5}
                      value={speakingPrompt}
                      onChange={e => setSpeakingPrompt(e.target.value)}
                      placeholder="Chủ đề thuyết trình hoặc câu hỏi đàm thoại với giám khảo AI..."
                      className="w-full p-3 text-xs rounded-lg border border-border bg-card"
                    />
                  )}
                </div>
              )}

              {/* NÚT TIẾP TỤC SANG XEM TRƯỚC */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExtract}
                  className="tap px-5 py-2.5 rounded-lg bg-accent text-accent-foreground font-mono text-sm font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>{progressText}</span>
                    </>
                  ) : (
                    <>
                      <span>Trích xuất & Xem trước</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* BƯỚC 2: XEM TRƯỚC VÀ XÁC NHẬN LƯU */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3 bg-muted/40 border border-border rounded-lg flex items-center justify-between text-xs font-mono">
                <span>Chủ đề: <strong>{title}</strong> · Cấp độ: <strong>{level}</strong></span>
                <span className="text-accent font-bold">Bước 2: Kiểm tra trước khi lưu</span>
              </div>

              {warningText && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{warningText}</span>
                </div>
              )}

              {/* PREVIEW TỪ VỰNG */}
              {activeModule === 'vocabulary' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-muted-foreground">
                    Tổng số từ trích xuất: <strong>{vocabItems.length} từ</strong>
                  </div>
                  <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border bg-card">
                    {vocabItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 text-xs font-mono flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-6 text-right">{idx + 1}.</span>
                          <span className="font-bold text-foreground">{item.article ? `${item.article} ` : ''}{item.german}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-accent">{item.vietnamese || '(Chưa có nghĩa)'}</span>
                        </div>
                        {item.example_de && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-xs">{item.example_de}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PREVIEW NGỮ PHÁP */}
              {activeModule === 'grammar' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-muted-foreground">
                    Bài giảng kèm <strong>{grammarParsed.exercises.length} bài tập</strong>
                  </div>
                  <div className="max-h-72 overflow-y-auto border border-border p-4 rounded-lg bg-card text-xs font-mono whitespace-pre-wrap">
                    {grammarParsed.rule}
                  </div>
                </div>
              )}

              {/* PREVIEW ĐỀ THI */}
              {activeModule === 'exam' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-muted-foreground">
                    Tổng số phần thi: <strong>{examTasks.length} phần</strong>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {examTasks.map((task, idx) => (
                      <div key={idx} className="p-3 border border-border rounded-lg bg-card text-xs space-y-1">
                        <div className="font-bold text-foreground flex items-center justify-between">
                          <span>{task.title}</span>
                          <span className="px-2 py-0.5 rounded bg-muted font-mono">{task.skill} · Teil {task.teil}</span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{task.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PREVIEW PHỤ ĐỀ YOUTUBE HOẶC PLAYLIST */}
              {activeModule === 'listening' && (
                listeningLinkType === 'playlist' ? (
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-muted-foreground flex items-center justify-between">
                      <span>Đã tìm thấy: <strong>{playlistVideos.length} tập</strong></span>
                      <span>Đã chọn: <strong>{playlistVideos.filter(v => v.selected !== false).length} tập</strong></span>
                    </div>
                    <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border bg-card">
                      {playlistVideos.map((v, idx) => (
                        <div key={v.id || idx} className="p-2.5 text-xs font-mono flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={v.selected !== false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setPlaylistVideos(prev => prev.map((item, i) => i === idx ? { ...item, selected: checked } : item));
                            }}
                            className="rounded-sm text-accent focus:ring-accent"
                          />
                          <span className="text-muted-foreground shrink-0 w-8 text-right font-bold">#{idx + 1}</span>
                          <input
                            type="text"
                            value={v.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPlaylistVideos(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                            }}
                            className="flex-1 px-2 py-1 rounded border border-border bg-background text-foreground"
                          />
                          <span className="text-muted-foreground font-mono text-[10px] shrink-0">{v.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-muted-foreground flex items-center justify-between">
                      <span>Số câu thoại bóc tách: <strong>{youtubeCues.length} câu</strong></span>
                      <span>Video ID: <strong>{extractYouTubeId(youtubeUrl)}</strong></span>
                    </div>
                    <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border bg-card">
                      {youtubeCues.map((cue, idx) => (
                        <div key={idx} className="p-2.5 text-xs font-mono flex items-start gap-3">
                          <span className="text-accent font-bold shrink-0 w-16">
                            {Math.floor(cue.start / 60)}:{(cue.start % 60).toFixed(0).padStart(2, '0')}
                          </span>
                          <div className="flex-1 space-y-0.5">
                            <div className="text-foreground font-semibold">{cue.de || cue.text}</div>
                            {cue.vi && <div className="text-amber-500/90 text-[11px] italic">{cue.vi}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* CÁC KỸ NĂNG KHÁC */}
              {['reading', 'writing', 'speaking'].includes(activeModule) && (
                <div className="p-4 border border-border rounded-lg bg-card text-xs font-mono whitespace-pre-wrap">
                  {readingText || writingPrompt || speakingPrompt || 'Nội dung bài luyện'}
                </div>
              )}

              {/* NÚT ĐIỀU HƯỚNG BƯỚC 2 */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="tap px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-mono"
                >
                  ← Chỉnh sửa lại
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmSave}
                  className="tap px-5 py-2.5 rounded-lg bg-accent text-accent-foreground font-mono text-sm font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận & Lưu vào kho học</span>
                </button>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* BƯỚC 3: THÀNH CÔNG */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                Import Thành Công!
              </h3>
              <p className="text-xs text-muted-foreground font-mono max-w-md mx-auto">
                Tài liệu đã được lưu trực tiếp vào bộ nhớ học tập của bạn. Các phòng kỹ năng đã được cập nhật dữ liệu mới nhất.
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setSelectedFile(null); }}
                  className="tap px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-mono"
                >
                  + Nhập tiếp tài liệu khác
                </button>
                {activeModule === 'vocabulary' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (vocabTargetSection === 'levels') navigate('/vocabulary/levels');
                      else if (vocabTargetSection === 'specialties') navigate('/vocabulary/specialties');
                      else if (vocabTargetSection === 'situations') navigate('/vocabulary/situations');
                      else navigate('/vocabulary');
                    }}
                    className="tap px-4 py-2 rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-mono font-semibold flex items-center gap-1.5"
                  >
                    <span>Mở xem tại {
                      vocabTargetSection === 'levels' ? 'Bộ từ theo cấp độ' :
                      vocabTargetSection === 'specialties' ? 'Từ vựng chuyên ngành' :
                      vocabTargetSection === 'situations' ? 'Tình huống giao tiếp' : 'Bộ thẻ của tôi'
                    }</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeModule === 'listening' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/listening');
                    }}
                    className="tap px-4 py-2 rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-mono font-semibold flex items-center gap-1.5"
                  >
                    <span>Mở phòng Luyện nghe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="tap px-5 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-mono font-bold"
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default UniversalImportModal;
