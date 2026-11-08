import {elioClient} from '@/lib/elio-auth-runtime';
import {EXAM_CATEGORIES,examCategory} from '@/lib/exam-categories';
import {useRouter} from '@/lib/router';
import {ImportCollectionTarget} from '@/components/common/CollectionTools';
import {activeCollectionId} from '@/lib/collection-types';
import {createPortal} from 'react-dom';
import {reviewedGrammar,reviewedExams} from '@/core/elio/reviewed-import';
// ====================================================================
// SPRACHMEISTERSCHAFT — UNIVERSAL DOCUMENT IMPORT CENTER
// Tuân thủ 12 nguyên tắc nghiêm ngặt:
// 1. Đa nguồn: PDF, DOCX, XLSX/XLS, CSV/TSV, TXT, JSON, OCR Ảnh, YouTube
// 2. Quy trình 4 bước chuẩn: Chọn nguồn/đích -> Trích xuất -> Xem trước & Sửa -> Lưu & Báo cáo
// 3. Bảo toàn nguyên bản (ä/ö/ü/ß), chống Prompt Injection
// 4. Chuẩn hóa 14 cột từ vựng, hỗ trợ chọn sheet XLSX, nhận diện BOM CSV
// 5. Phân quyền: Super Admin (Toàn hệ thống / Cá nhân / Nội bộ) - User (Cá nhân)
// ====================================================================

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import {elioImport} from '@/lib/elio-import-runtime';
import {importVocabularyJSON} from '@/core/elio/import-binding';
import {
  X,
  UploadCloud,
  FileText,
  Youtube,
  Globe,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Layers,
  RefreshCw,
  FileSpreadsheet,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { LEVEL_IDS } from '@/data/levels';
import { toast } from 'sonner';
import {
  detectFileType,
  parseExcelFile,
  parseCsvTsvText,
  parseTxtVocab,
  parseDocxFile,
  parsePdfFile,
  parseYouTubeSubtitles,
  extractYouTubeInfo,
  parseGrammarInput,
  parseExamJsonInput,
  parseMultiExams,
  parseSituationInput,
  performImageOcr,
  VOCAB_14_COLUMNS,
} from '@/lib/document-parsers';

async function extractCoreImportFile(file){
 if(detectFileType(file)==='pdf'){const parsed=await parsePdfFile(file);const text=parsed.fullText||parsed.rawText||'';if(text.trim()&&!parsed.hasScannedPages)return {text,warnings:[]};}
 return elioImport.extractFile(file);
}

export function UniversalImportModal({ isOpen, onClose, defaultType = 'vocabulary', initialScope = null, defaultCollectionId = null, onSuccess }) {
 const {navigate,search}=useRouter();
 const [examBoard,setExamBoard]=useState(()=>examCategory(new URLSearchParams(search).get('exam'))||'unclassified');
 useEffect(()=>{if(isOpen)setExamBoard(examCategory(new URLSearchParams(search).get('exam'))||'unclassified');},[isOpen,search]);
  // Navigation: 1: Config & Input -> 2: Preview & Edit -> 3: Sync Report
  const [step, setStep] = useState(1);
  const [targetCollectionId,setTargetCollectionId]=useState(defaultCollectionId||activeCollectionId());
  const draftOwner=useRef(null), draftGeneration=useRef(0), savingImport=useRef(false);
  useEffect(()=>{const reset=()=>{if(elioImport.isActive()){draftGeneration.current++;draftOwner.current=null;savingImport.current=false;setIsSubmitting(false);setIsProcessing(false);setGrammarExercisesJson('');setExtractedItems([]);setSelectedFile(null);setManualText('');setTitle('');setYoutubeUrl('');setYoutubeSubtitles('');setIssuesList([]);setSyncReport(null);setExcelSheets([]);setDetectedExams([]);setExamContent(null);setSituationContent(null);setGrammarContent({rule:'',exercises:[]});setCurrentUser(db.auth.getUser());setIsAdminState(db.auth.isAdmin());setScope(db.auth.isAdmin()?'public':'private');setStep(1);}};window.addEventListener('sprach_auth_change',reset);return()=>window.removeEventListener('sprach_auth_change',reset);},[]);

  // General Settings
  const [contentType, setContentType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('B1');
  const [scope, setScope] = useState('public');
  const [inputMethod, setInputMethod] = useState('file'); // 'file' | 'manual'

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('unknown');
  const [excelSheets, setExcelSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ message: '', percent: 0 });

  // Direct Manual Content State
  const [manualText, setManualText] = useState('');
  const [grammarExercisesJson, setGrammarExercisesJson] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [listeningLinkType,setListeningLinkType]=useState('video'),[playlistMeta,setPlaylistMeta]=useState(null),[captionIssue,setCaptionIssue]=useState('');
  const [youtubeSubtitles, setYoutubeSubtitles] = useState('');

  // Extracted Data for Preview & Editing
  const [extractedItems, setExtractedItems] = useState([]);
  const [duplicateMode, setDuplicateMode] = useState('fill_blank'); // 'skip' | 'fill_blank' | 'overwrite'
  const [grammarContent, setGrammarContent] = useState({ rule: '', exercises: [] });
  const [examContent, setExamContent] = useState(null);
  const [detectedExams, setDetectedExams] = useState([]);
  const [situationContent, setSituationContent] = useState(null);
  const [issuesList, setIssuesList] = useState([]);

  // Final Summary Report
  const [syncReport, setSyncReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => db.auth.getUser());
  const [isAdminState, setIsAdminState] = useState(() => db.auth.isAdmin());
  const isAdmin = isAdminState;

  // Reset or adjust initial values when modal opens
  useEffect(() => {
    draftGeneration.current++;
    if (isOpen) {
      setContentType(defaultType);
      setInputMethod(defaultType==='listening'?'manual':'file');setPlaylistMeta(null);setCaptionIssue('');setListeningLinkType('video');
      setTargetCollectionId(defaultCollectionId||activeCollectionId());
      if(elioImport.isActive()){setDuplicateMode('skip');draftOwner.current=db.auth.getUser()?.id;}
      setStep(1);
      setExtractedItems([]);
      setDetectedExams([]);
      setExamContent(null);
      setSyncReport(null);
      setSelectedFile(null);
      setProcessProgress({ message: '', percent: 0 });
      const currentAdmin = db.auth.isAdmin();
      setIsAdminState(currentAdmin);
      setCurrentUser(db.auth.getUser());
      // Default scope
      if (initialScope) {
        setScope(initialScope);
      } else {
        setScope(currentAdmin ? 'public' : 'private');
      }
    }
  }, [isOpen, defaultType, initialScope,defaultCollectionId]);

  useEffect(()=>{if(!isOpen||typeof document==='undefined')return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[isOpen]);

  if (!isOpen || typeof document==='undefined') return null;

  // Handle File Selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const detected = detectFileType(file);
    setFileType(detected);

    if (!title) {
      // Auto-set title from file name without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // If Excel, inspect sheet names upfront
    if (detected === 'xlsx') {
      try {
        const parsed = await parseExcelFile(file, 0);
        setExcelSheets(parsed.sheetNames || []);
        setSelectedSheet(parsed.currentSheet || (parsed.sheetNames?.[0] || ''));
      } catch (err) {
        toast.error('Lỗi đọc bảng tính Excel: ' + err.message);
      }
    }
  };

  // Check Duplicates against existing Vocabulary
  const checkVocabularyDuplicates = (items) => {
    const existingCards = db.vocabulary.findMany();
    const existingMap = new Map();
    existingCards.forEach((c) => {
      const key = `${(c.article || '').trim()} ${(c.german || '').trim()}`.toLowerCase().trim();
      existingMap.set(key, c);
    });

    return items.map((item) => {
      const key = `${(item.article || '').trim()} ${(item.german || '').trim()}`.toLowerCase().trim();
      const existing = existingMap.get(key);
      return {
        ...item,
        _isDuplicate: !!existing,
        _existingCard: existing || null,
      };
    });
  };

  // Step 1 -> Step 2: Trigger Extraction Process
  const handleStartExtraction = async () => {
    const extractionOwner=db.auth.getUser()?.id, extractionGeneration=draftGeneration.current;
    const assertCurrentDraft=()=>{if(elioImport.isActive()&&(draftGeneration.current!==extractionGeneration||draftOwner.current!==extractionOwner||db.auth.getUser()?.id!==extractionOwner))throw Error('Tài khoản đã thay đổi; không hiển thị tài liệu của tài khoản trước.');};
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho bộ tài liệu!');
      return;
    }

    if(elioImport.isActive())draftOwner.current=db.auth.getUser()?.id;
    setIsProcessing(true);
    setProcessProgress({ message: 'Bắt đầu đọc và phân tích cấu trúc...', percent: 10 });
    setIssuesList([]);

    try {
      if(['reading','writing','speaking'].includes(contentType)||contentType==='listening'&&inputMethod==='file'&&selectedFile){
        let content=manualText;
        if(inputMethod==='file'&&selectedFile){
          const type=detectFileType(selectedFile);
          if(type==='docx')content=(await parseDocxFile(selectedFile)).rawText;
          else if(type==='pdf'||type==='image')content=elioImport.isActive()?(await extractCoreImportFile(selectedFile)).text:(await parsePdfFile(selectedFile)).fullText;
          else content=await selectedFile.text();
        }
        if(!content?.trim())throw Error('Chưa có văn bản gốc để nhập.');
        assertCurrentDraft();setManualText(content);setExtractedItems([{id:'document',title,level,content,_valid:true}]);setStep(2);setIsProcessing(false);return;
      }
      // CASE A: LISTENING (YouTube)
      if (contentType === 'listening') {
        setCaptionIssue('');setPlaylistMeta(null);
        if(listeningLinkType==='playlist'){
          if(!elioImport.isActive())throw Error('Import playlist cần đăng nhập backend Elio.');
          setProcessProgress({message:'Đang đọc danh sách video thật từ playlist…',percent:40});
          const playlist=await elioClient.listeningPlaylist(youtubeUrl);assertCurrentDraft();setPlaylistMeta(playlist);setExtractedItems(playlist.items.map(v=>({...v,_valid:true})));setStep(2);setIsProcessing(false);return;
        }
        const info = extractYouTubeInfo(youtubeUrl);
        if (!info.videoId) {
          throw new Error('Đường link YouTube hoặc Video ID không hợp lệ.');
        }

        setProcessProgress({ message: 'Đang phân tích phụ đề và mốc thời gian...', percent: 60 });
        let subs=[];if(youtubeSubtitles.trim())subs=parseYouTubeSubtitles(youtubeSubtitles);else if(elioImport.isActive()){try{subs=await elioImport.transcript(youtubeUrl);}catch(error){setCaptionIssue('Chưa lấy được phụ đề gốc: '+error.message+' Bạn có thể lưu link video trước và thử CC sau.');}}

        assertCurrentDraft();setExtractedItems(subs);
        setProcessProgress({ message: 'Hoàn thành trích xuất video!', percent: 100 });
        setStep(2);
        setIsProcessing(false);
        return;
      }

      // CASE B: GRAMMAR
      if (contentType === 'grammar') {
        setProcessProgress({ message: 'Phân tích bài giảng Markdown & bài tập...', percent: 50 });
        let ruleText = manualText;
        if (inputMethod === 'file' && selectedFile) {
          if(elioImport.isActive()&&['pdf','image'].includes(fileType)){const draft=await extractCoreImportFile(selectedFile);ruleText=draft.text;
          }else if (fileType === 'docx') {
            const docxRes = await parseDocxFile(selectedFile);
            ruleText = docxRes.rawText;
          } else if (fileType === 'pdf') {
            const pdfRes = await parsePdfFile(selectedFile, (p) => {
              setProcessProgress({ message: `Đang đọc PDF trang ${p.current}/${p.total}`, percent: p.percent });
            });
            ruleText = pdfRes.fullText;
          } else {
            ruleText = await selectedFile.text();
          }
        }

        const parsedGrammar = elioImport.isActive()?await reviewedGrammar(ruleText,grammarExercisesJson,{title,level}):parseGrammarInput(ruleText, grammarExercisesJson);
        assertCurrentDraft();
        setGrammarContent(parsedGrammar);
        setIssuesList(parsedGrammar.issues || []);
        setStep(2);
        setIsProcessing(false);
        return;
      }

      // CASE C: EXAM SIMULATION (Single or Multi-Exam PDF/DOCX/TXT/JSON)
      if (contentType === 'exam') {
        setProcessProgress({ message: 'Đang trích xuất và phân tích cấu trúc đề thi...', percent: 30 });
        let rawExamText = manualText;
        if (inputMethod === 'file') {
          if (!selectedFile) throw new Error('Vui lòng chọn tệp tin đề thi tải lên.');
          if(elioImport.isActive()&&['pdf','image'].includes(fileType)){const draft=await extractCoreImportFile(selectedFile);rawExamText=draft.text;
          }else if (fileType === 'pdf') {
            setProcessProgress({ message: 'Đang trích xuất nội dung từ PDF đa đề thi...', percent: 45 });
            const pdfRes = await parsePdfFile(selectedFile, (p) => {
              setProcessProgress({ message: `Đang quét PDF trang ${p.current}/${p.total}`, percent: p.percent });
            });
            rawExamText = pdfRes.rawText;
          } else if (fileType === 'docx') {
            setProcessProgress({ message: 'Đang đọc tài liệu Word DOCX...', percent: 50 });
            const docxRes = await parseDocxFile(selectedFile);
            rawExamText = docxRes.rawText;
          } else {
            rawExamText = await selectedFile.text();
          }
        }

        setManualText(rawExamText);
        if(elioImport.isActive()&&!/^\s*[\[{]/.test(rawExamText)){assertCurrentDraft();setDetectedExams([]);setExamContent({title,level,_rawDocument:true});setIssuesList(['Văn bản đề được giữ nguyên. Sau khi lưu, mở phòng luyện để AI tách câu hỏi; có thể bổ sung PDF đáp án sau.']);setStep(2);setIsProcessing(false);return;}
        const multiRes = elioImport.isActive()?{success:true,exams:reviewedExams(rawExamText),issues:[]}:parseMultiExams(rawExamText, { level, provider: 'Goethe' });
        assertCurrentDraft();
        if (!multiRes.success || multiRes.exams.length === 0) {
          throw new Error(multiRes.issues.join('; ') || 'Không tìm thấy cấu trúc đề thi hợp lệ.');
        }

        setDetectedExams(multiRes.exams);
        setExamContent(multiRes.exams[0]);
        setIssuesList(multiRes.issues || []);
        setStep(2);
        setIsProcessing(false);
        return;
      }

      // CASE D: SITUATIONS
      if (contentType === 'situation') {
        setProcessProgress({ message: 'Phân tích mẫu câu giao tiếp...', percent: 50 });
        let textOrJson = manualText;
        if (inputMethod === 'file' && selectedFile) {
          textOrJson = await selectedFile.text();
        }
        const parsedSit = parseSituationInput(textOrJson);
        setSituationContent(parsedSit);
        setManualText(textOrJson);
        setStep(2);
        setIsProcessing(false);
        return;
      }

      // CASE E: VOCABULARY & OTHER TEXT (PDF, DOCX, XLSX, CSV, TXT, OCR IMAGE)
      let parsedVocab = [];
      let issues = [];

      if (inputMethod === 'file') {
        if (!selectedFile) throw new Error('Vui lòng chọn tệp tin cần tải lên.');

        if(elioImport.isActive()&&(fileType==='pdf'||fileType==='image')){
          const draft=await extractCoreImportFile(selectedFile);const parsed=parseTxtVocab(draft.text);parsedVocab=parsed.items;issues=[...draft.warnings,...parsed.issues,'Bản nháp OCR: kiểm tra và sửa dữ liệu trước khi lưu.'];
        }else if(elioImport.isActive()&&fileType==='json'){parsedVocab=importVocabularyJSON(await selectedFile.text());
        }else if (fileType === 'xlsx') {
          setProcessProgress({ message: `Đang đọc Sheet "${selectedSheet}"...`, percent: 40 });
          const res = await parseExcelFile(selectedFile, selectedSheet);
          parsedVocab = res.items;
          issues = res.issues;
        } else if (fileType === 'csv' || fileType === 'tsv') {
          setProcessProgress({ message: 'Đang giải mã CSV/TSV chuẩn UTF-8...', percent: 40 });
          const text = await selectedFile.text();
          const res = parseCsvTsvText(text);
          parsedVocab = res.items;
          issues = res.issues;
        } else if (fileType === 'txt') {
          setProcessProgress({ message: 'Đang đọc từng dòng văn bản TXT...', percent: 40 });
          const text = await selectedFile.text();
          const res = parseTxtVocab(text);
          parsedVocab = res.items;
          issues = res.issues;
        } else if (fileType === 'docx') {
          setProcessProgress({ message: 'Đang trích xuất văn bản từ tài liệu DOCX...', percent: 40 });
          const docxRes = await parseDocxFile(selectedFile);
          const txtRes = parseTxtVocab(docxRes.rawText);
          parsedVocab = txtRes.items;
          issues = txtRes.issues;
        } else if (fileType === 'pdf') {
          setProcessProgress({ message: 'Đang quét các trang tệp PDF...', percent: 30 });
          const pdfRes = await parsePdfFile(selectedFile, (p) => {
            setProcessProgress({ message: `Đang quét PDF trang ${p.current}/${p.total}`, percent: p.percent });
          });
          const txtRes = parseTxtVocab(pdfRes.fullText);
          parsedVocab = txtRes.items;
          issues = txtRes.issues;
          if (pdfRes.hasScannedPages) {
            issues.push(`Tệp PDF có ${pdfRes.scannedPagesCount} trang scan hình ảnh (ít văn bản số).`);
          }
        } else if (fileType === 'image') {
          const ocrRes = await performImageOcr(selectedFile, (msg) => {
            setProcessProgress({ message: msg, percent: 65 });
          });
          if (ocrRes.items && Array.isArray(ocrRes.items)) {
            parsedVocab = ocrRes.items.map((it, idx) => ({
              _id: `ocr_${idx}`,
              _valid: !!it.german,
              german: it.german || '',
              article: it.article || '',
              vietnamese: it.vietnamese || '',
              english: '',
              word_type: it.article ? 'noun' : 'word',
              level,
              topic: title,
              example_de: it.example_de || '',
              example_vi: '',
              explanation_de: '',
              synonyms: '',
              collocations: '',
              plural: '',
              notes: 'Trích xuất từ OCR Ảnh',
            }));
          }
        } else {
          // Plain Text fallback
          const text = await selectedFile.text();
          const txtRes = parseTxtVocab(text);
          parsedVocab = txtRes.items;
          issues = txtRes.issues;
        }
      } else {
        // Manual Text input
        setProcessProgress({ message: 'Đang phân tích văn bản nhập tay...', percent: 50 });
        const res = elioImport.isActive()&&/^\s*[\[{]/.test(manualText)?{items:importVocabularyJSON(manualText),issues:[]}:parseTxtVocab(manualText);
        parsedVocab = res.items;
        issues = res.issues;
      }

      // Check duplicates for vocabulary
      const withDuplicates = elioImport.isActive()?parsedVocab:checkVocabularyDuplicates(parsedVocab);
      assertCurrentDraft();setExtractedItems(withDuplicates);
      setIssuesList(issues);

      setProcessProgress({ message: 'Hoàn thành!', percent: 100 });
      setStep(2);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      toast.error('Lỗi trích xuất tài liệu: ' + err.message);
    }
  };

  // Update a single field in the preview table
  const handleUpdateItemField = (index, field, value) => {
    setExtractedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'german' || field === 'vietnamese') {
        copy[index]._valid = !!(copy[index].german && copy[index].vietnamese);
      }
      return copy;
    });
  };

  // Delete an item from the preview list
  const handleDeleteItem = (index) => {
    setExtractedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add a blank row to the preview list
  const handleAddBlankItem = () => {
    const newItem = {
      _id: `manual_new_${Date.now()}`,
      _valid: false,
      german: '',
      article: '',
      vietnamese: '',
      english: '',
      word_type: 'noun',
      level,
      topic: title,
      example_de: '',
      example_vi: '',
      explanation_de: '',
      synonyms: '',
      collocations: '',
      plural: '',
      notes: '',
    };
    setExtractedItems((prev) => [newItem, ...prev]);
  };

  // Step 2 -> Step 3: Confirm Save and Synchronize
  const handleConfirmSave = async () => {
    if(savingImport.current)return;const saveGeneration=draftGeneration.current; savingImport.current=true;
    setIsSubmitting(true);

    try {
      if(targetCollectionId&&!elioImport.isActive())throw Error('Cần đăng nhập server để import vào bộ.');
      if(elioImport.isActive()){if(draftOwner.current!==db.auth.getUser()?.id)throw Error('Tài khoản đã thay đổi; hãy trích xuất lại tài liệu.');const result=await elioImport.save({contentType,title,level,scope,rows:extractedItems,youtubeUrl,duplicateMode,grammarContent,exams:detectedExams.length?detectedExams:[examContent],organizerId:targetCollectionId||null,examBoard,playlistItems:contentType==='listening'&&listeningLinkType==='playlist'?extractedItems.map(v=>({id:v.id,title:v.title})):null,rawText:manualText,situationContent});if(saveGeneration!==draftGeneration.current)return;setSyncReport({title,contentType,level,scope,totalExtracted:extractedItems.length,validCount:extractedItems.filter(i=>i._valid!==false).length,...result,timestamp:new Date().toLocaleTimeString('vi-VN')});setStep(3);setIsSubmitting(false);savingImport.current=false;window.dispatchEvent(new CustomEvent('sprach_core_imported'));toast.success('Server đã xác nhận nhập bộ mới; không ghi đè dữ liệu cũ.');if(onSuccess)onSuccess();if(contentType==='listening'&&!extractedItems[0]?.content){onClose();navigate('/skills/listening?listenMode=youtube');return;}if(['reading','listening','writing','speaking','grammar','exam'].includes(contentType)){onClose();navigate('/practice/'+encodeURIComponent(result.recordId)+'?build=1');}return;}
      let savedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      // 1. VOCABULARY IMPORT
      if (contentType === 'vocabulary') {
        const validItems = extractedItems.filter((i) => i._valid);

        for (const item of validItems) {
          if (item._isDuplicate) {
            if (duplicateMode === 'skip') {
              skippedCount++;
              continue;
            } else if (duplicateMode === 'fill_blank' && item._existingCard) {
              // Fill blanks only, never overwrite existing values
              const existing = item._existingCard;
              const updates = {};
              if (!existing.example_de && item.example_de) updates.example_de = item.example_de;
              if (!existing.example_vi && item.example_vi) updates.example_vi = item.example_vi;
              if (!existing.vietnamese && item.vietnamese) updates.vietnamese = item.vietnamese;
              if (!existing.article && item.article) updates.article = item.article;
              if (Object.keys(updates).length > 0) {
                db.vocabulary.update(existing.id, updates);
                updatedCount++;
              } else {
                skippedCount++;
              }
              continue;
            } else if (duplicateMode === 'overwrite' && item._existingCard) {
              db.vocabulary.update(item._existingCard.id, {
                german: item.german,
                article: item.article,
                vietnamese: item.vietnamese,
                example_de: item.example_de,
                example_vi: item.example_vi,
                level: item.level || level,
                topic: item.topic || title,
              });
              updatedCount++;
              continue;
            }
          }

          // New card creation
          db.vocabulary.create({
            german: item.german,
            article: item.article,
            vietnamese: item.vietnamese,
            example_de: item.example_de,
            example_vi: item.example_vi,
            word_type: item.word_type,
            level: item.level || level,
            topic: item.topic || title,
          });
          savedCount++;
        }

        // Record into Universal Imports for audit & scope tracking
        db.universal.create({
          type: 'vocabulary',
          title,
          level,
          data: {
            totalExtracted: extractedItems.length,
            savedCount,
            updatedCount,
            skippedCount,
          },
          scope: scope || 'public',
        });
      }

      // 2. LISTENING / YOUTUBE IMPORT
      else if (contentType === 'listening') {
        const info = extractYouTubeInfo(youtubeUrl);
        const effectiveScope = scope || 'public';

        let targetCollectionId = 'nicos-weg-a1';

        if (effectiveScope === 'private') {
          let myCol = db.listening.getCollections({ scope: 'private' }).find((c) => c.id === 'my-personal-videos');
          if (!myCol) {
            myCol = db.listening.createCollection({
              id: 'my-personal-videos',
              title: 'Kho Video Cá Nhân Của Tôi',
              deTitle: 'Meine persönliche Videosammlung',
              provider: 'Video của tôi',
              level,
              thumbnail: `https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg`,
              description: 'Các video YouTube do bạn tự nhập để luyện nghe và chép chính tả riêng.',
              scope: 'private',
            });
          }
          targetCollectionId = myCol.id;
        } else {
          const newCol = db.listening.createCollection({
            title,
            deTitle: title,
            provider: 'Elio Einfach Official',
            level,
            thumbnail: `https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg`,
            description: `Bộ video luyện nghe chuẩn cấp độ ${level}: ${title}`,
            scope: effectiveScope,
          });
          targetCollectionId = newCol.id;
        }

        db.listening.createEpisode({
          collectionId: targetCollectionId,
          title,
          level,
          youtubeId: info.videoId,
          subtitles: extractedItems,
          scope: effectiveScope,
        });

        savedCount = 1;
      }

      // 3. GRAMMAR IMPORT
      else if (contentType === 'grammar') {
        db.universal.create({
          type: 'grammar',
          title,
          level,
          data: {
            title_vi: title,
            title_de: title,
            rule: grammarContent.rule,
            exercises: grammarContent.exercises,
          },
          scope: scope || 'public',
        });
        savedCount = 1;
      }

      // 4. EXAM IMPORT (Saves to Universal Central Repository so it surfaces in Schreiben, Sprechen, Lesen, Hören & Exams)
      else if (contentType === 'exam') {
        const examsToSave = detectedExams && detectedExams.length > 0 ? detectedExams : [examContent];
        examsToSave.forEach((ex) => {
          db.universal.create({
            type: 'exam',
            title: ex.title || title,
            level: ex.level || level,
            data: ex,
            scope: scope || 'public',
          });
        });
        savedCount = examsToSave.length;
      }

      // 5. SITUATION IMPORT
      else if (contentType === 'situation') {
        db.universal.create({
          type: 'situation',
          title: situationContent?.title_vi || title,
          level,
          data: situationContent,
          scope: scope || 'public',
        });
        savedCount = 1;
      }

      // 6. OTHER SKILLS (Reading, Writing, Speaking)
      else {
        db.universal.create({
          type: contentType,
          title,
          level,
          data: {
            rawText: manualText,
            items: extractedItems,
          },
          scope: scope || 'public',
        });
        savedCount = 1;
      }

      // Prepare Report
      const report = {
        title,
        contentType,
        level,
        scope: scope || 'public',
        totalExtracted: contentType === 'vocabulary' ? extractedItems.length : 1,
        validCount: contentType === 'vocabulary' ? extractedItems.filter((i) => i._valid).length : 1,
        savedCount,
        updatedCount,
        skippedCount,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      };

      setSyncReport(report);
      setStep(3);
      setIsSubmitting(false);savingImport.current=false;

      // Notify entire app of db change
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      toast.success(`Đã nạp thành công bộ tài liệu: "${title}"!`);

      if (onSuccess) onSuccess();
    } catch (err) {
      if(saveGeneration!==draftGeneration.current)return;
      setIsSubmitting(false);savingImport.current=false;
      toast.error('Có lỗi xảy ra khi lưu vào hệ thống: ' + err.message);
    }
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Trung tâm nhập tài liệu" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="surface max-w-4xl w-full p-5 sm:p-7 relative border-2 border-border shadow-2xl animate-rise my-4 max-h-[92vh] flex flex-col">
        {/* Header with 3 Steps Progress */}
        <div className="flex items-start justify-between pb-4 border-b border-border shrink-0">
          <div>
            <div className="eyebrow flex items-center gap-2 mb-1">
              <span>TRUNG TÂM IMPORT TÀI LIỆU TOÀN NĂNG</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                12 Chuẩn Học Thuật
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {step === 1 && 'Bước 1: Chọn nguồn tài liệu & Cấu hình đích'}
              {step === 2 && 'Bước 2: Xem trước, Đối chiếu trùng & Chỉnh sửa'}
              {step === 3 && 'Bước 3: Báo cáo kết quả & Trạng thái đồng bộ'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center gap-2 py-3 border-b border-border/60 shrink-0 text-xs font-mono">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step === 1 ? 'bg-accent text-accent-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
            <span>1. Nguồn & Đích</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step === 2 ? 'bg-accent text-accent-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
            <span>2. Xem trước & Sửa</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step === 3 ? 'bg-emerald-600 text-white font-bold' : 'bg-muted text-muted-foreground'}`}>
            <span>3. Báo cáo lưu</span>
          </div>
        </div>

        {/* ================= STEP 1: CONFIG & INPUT ================= */}
        {step < 3 && <ImportCollectionTarget contentType={contentType} value={targetCollectionId} onChange={setTargetCollectionId} onScopeChange={setScope}/>}
        {step === 1 && (
          <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
            {/* Category and Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Đích nạp dữ liệu *
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-sm border border-border bg-card text-foreground font-mono"
                >
                  <option value="vocabulary">📚 Bộ từ vựng theo cấp độ (14 cột chuẩn)</option>
                  <option value="listening">🎧 Luyện nghe & Diktat (YouTube Video/Playlist)</option>
                  <option value="grammar">🧩 Chuyên đề Ngữ pháp (Markdown & Bài tập)</option>
                  <option value="exam">📜 Bộ đề thi mô phỏng CEFR (Goethe, telc, ÖSD)</option>
                  <option value="situation">💬 Tình huống giao tiếp (Alltagssituationen)</option>
                  <option value="reading">📖 Kỹ năng Đọc hiểu văn bản</option>
                  <option value="writing">✍️ Kỹ năng Viết (Đề bài & Tiêu chí)</option>
                  <option value="speaking">🗣️ Kỹ năng Nói & Phỏng vấn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Cấp độ chuẩn hóa (CEFR) *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-sm border border-border bg-card text-foreground font-mono font-bold text-accent"
                >
                  {LEVEL_IDS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Trình độ {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {['reading','listening','writing','speaking','grammar','exam'].includes(contentType)&&<label className="block text-sm font-heading">Kỳ thi / Học chung<select aria-label="Kỳ thi của tài liệu import" value={examBoard} onChange={e=>setExamBoard(e.target.value)} className="block w-full border border-border bg-card p-2 mt-1">{EXAM_CATEGORIES.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}
            {/* Title */}
            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Tiêu đề bộ tài liệu *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Từ vựng B1 Khí hậu & Năng lượng / Đề thi telc B1 Ả Rập..."
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground font-heading"
              />
            </div>

            {/* Scope Permissions: Super Admin vs Regular User */}
            <div className="p-3.5 bg-muted/30 rounded-sm border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <span>Quyền phân phối & Hiển thị (Scope) *</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    scope === 'public'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : scope === 'admin_only'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                  }`}>
                    {scope === 'public' ? '🌍 Toàn hệ thống (Publish)' : scope === 'admin_only' ? '🔒 Nội bộ Admin' : '👤 Kho cá nhân'}
                  </span>
                  {!isAdminState && (
                    <button
                      type="button"
                      onClick={() => {
                        db.auth.toggleAdminMode();
                        setIsAdminState(true);
                        toast.success('Đã kích hoạt chế độ Quản trị viên!');
                      }}
                      className="tap text-[10px] font-mono text-accent hover:underline font-bold"
                    >
                      👑 Bật Admin
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Scope Cards - Admin can choose all; normal users can only import to private */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAdminState) {
                      toast.warning('Chỉ Quản trị viên mới có quyền Publish kho dùng chung toàn hệ thống.');
                      return;
                    }
                    setScope('public');
                  }}
                  className={`tap p-2.5 rounded-sm border text-left text-xs font-mono transition-all flex items-start gap-2.5 ${
                    !isAdminState ? 'opacity-60 cursor-not-allowed border-dashed' : ''
                  } ${
                    scope === 'public'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <span>🌍 Toàn hệ thống</span>
                      {!isAdminState && <span className="text-[9px] text-amber-600">(Admin)</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-snug">Publish công khai cho mọi học viên</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('private')}
                  className={`tap p-2.5 rounded-sm border text-left text-xs font-mono transition-all flex items-start gap-2.5 ${
                    scope === 'private'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200 font-semibold ring-1 ring-blue-500'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">👤 Kho cá nhân</div>
                    <div className="text-[10px] text-muted-foreground leading-snug">Chỉ riêng tài khoản bạn thấy & học</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAdminState) {
                      toast.warning('Chỉ Quản trị viên mới có quyền đặt chế độ Nội bộ Admin.');
                      return;
                    }
                    setScope('admin_only');
                  }}
                  className={`tap p-2.5 rounded-sm border text-left text-xs font-mono transition-all flex items-start gap-2.5 ${
                    !isAdminState ? 'opacity-60 cursor-not-allowed border-dashed' : ''
                  } ${
                    scope === 'admin_only'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-semibold ring-1 ring-amber-500'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <span>🔒 Nội bộ Admin</span>
                      {!isAdminState && <span className="text-[9px] text-amber-600">(Admin)</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-snug">Chỉ ban quản trị kiểm duyệt</div>
                  </div>
                </button>
              </div>

              {/* Informative helper note */}
              <div className="p-2 bg-card border border-border rounded text-[11px] font-mono text-muted-foreground flex items-center gap-2">
                {scope === 'public' ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Nội dung sẽ được <strong>Publish toàn hệ thống</strong>: Mọi học viên đều có thể thấy và thực hành trong danh mục chung.</span>
                  </>
                ) : scope === 'private' ? (
                  <>
                    <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Nội dung sẽ được lưu vào <strong>Kho cá nhân</strong>: Chỉ riêng tài khoản hiện tại của bạn truy cập được.</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Nội dung được lưu ở chế độ <strong>Nội bộ Admin</strong>: Đang biên tập hoặc kiểm duyệt, chưa công khai.</span>
                  </>
                )}
              </div>
            </div>

            {/* Input Method Toggle */}
            <div>
              <div className="flex items-center gap-2 border-b border-border mb-3 pb-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setInputMethod('file')}
                  className={`tap px-3 py-1.5 rounded-sm flex items-center gap-1.5 ${
                    inputMethod === 'file'
                      ? 'bg-accent text-accent-foreground font-bold'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Tải tệp tin (PDF, DOCX, XLSX, CSV, TXT, OCR Ảnh)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMethod('manual')}
                  className={`tap px-3 py-1.5 rounded-sm flex items-center gap-1.5 ${
                    inputMethod === 'manual'
                      ? 'bg-accent text-accent-foreground font-bold'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Nhập trực tiếp / Dán nội dung</span>
                </button>
              </div>

              {/* METHOD 1: FILE UPLOAD */}
              {inputMethod === 'file' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-accent/60 bg-muted/20 hover:bg-muted/30 p-6 rounded-sm text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.xlsx,.xls,.csv,.tsv,.txt,.json,.md,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                    />
                    <UploadCloud className="w-8 h-8 text-accent animate-bounce" />
                    <div className="font-heading font-medium text-sm text-foreground">
                      {selectedFile ? (
                        <span className="text-accent font-bold">{selectedFile.name}</span>
                      ) : (
                        'Nhấn vào đây để tải tệp từ máy tính của bạn'
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Hỗ trợ: PDF (văn bản & trang scan), DOCX, Excel XLSX (chọn sheet), CSV/TSV chuẩn UTF-8, TXT, JSON, Ảnh JPG/PNG/WebP
                    </p>
                  </div>

                  {/* Sheet Selector for Excel */}
                  {fileType === 'xlsx' && excelSheets.length > 1 && (
                    <div className="p-3 bg-muted/40 rounded-sm border border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-mono font-medium text-foreground">Chọn Sheet cần nạp:</span>
                      </div>
                      <select
                        value={selectedSheet}
                        onChange={(e) => setSelectedSheet(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                      >
                        {excelSheets.map((sh) => (
                          <option key={sh} value={sh}>
                            Sheet: {sh}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* METHOD 2: DIRECT MANUAL INPUT */}
              {inputMethod === 'manual' && (
                <div className="space-y-3">
                  {contentType === 'listening' ? (
                    <div className="space-y-3">
                      <fieldset className="flex flex-wrap gap-3"><legend className="font-heading text-sm mb-2">Loại đường dẫn YouTube</legend>{[['video','Một video'],['playlist','Cả playlist']].map(([id,label])=><label key={id} className="flex items-center gap-2 text-sm"><input type="radio" name="youtube-link-type" checked={listeningLinkType===id} onChange={()=>{setListeningLinkType(id);setExtractedItems([]);setPlaylistMeta(null);setCaptionIssue('');}}/>{label}</label>)}</fieldset>
                      <div>
                        <label className="block text-xs font-mono font-medium text-foreground mb-1 flex items-center gap-1.5">
                          <Youtube className="w-3.5 h-3.5 text-rose-600" />
                          <span>{listeningLinkType==='playlist'?'Đường link playlist YouTube *':'Đường link YouTube Video hoặc YouTube ID *'}</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder={listeningLinkType==='playlist'?'https://www.youtube.com/playlist?list=…':'https://www.youtube.com/watch?v=… hoặc Video ID'}
                          className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                        />
                      </div>

                      {listeningLinkType==='video'&&<div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-mono font-medium text-foreground">
                            Phụ đề kèm timestamp (Định dạng: <code>Phút:Giây - Tiếng Đức | Tiếng Việt</code> hoặc SRT)
                          </label>
                          <span className="text-[10px] font-mono text-muted-foreground">Không bắt buộc</span>
                        </div>
                        <textarea
                          rows={6}
                          value={youtubeSubtitles}
                          onChange={(e) => setYoutubeSubtitles(e.target.value)}
                          placeholder={`0:05 - Wie lange lernen Sie schon Deutsch? | Bạn học tiếng Đức bao lâu rồi?\n0:08 - Ich lerne seit einem Jahr Deutsch. | Tôi học được một năm rồi.\n0:14 - Richtig, ich weiß das! | Đúng rồi, tôi biết điều đó!`}
                          className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                        />
                      </div>}{listeningLinkType==='playlist'&&<p className="text-sm text-muted-foreground">Đọc toàn bộ danh sách trước khi lưu vào bộ đã chọn. Video được lưu trước; phụ đề CC được lấy riêng sau khi import.</p>}
                    </div>
                  ) : contentType === 'grammar' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono font-medium text-foreground mb-1">
                          Nội dung bài học Markdown (Giữ nguyên bảng biểu, in đậm, ví dụ Đức - Việt) *
                        </label>
                        <textarea
                          rows={6}
                          required
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          placeholder="### 1. Cấu trúc câu\n\n| Đại từ | Động từ chia | Tân ngữ |\n|---|---|---|\n| Ich | habe | ein Buch |\n\n**Ghi chú:** Động từ luôn ở vị trí thứ 2."
                          className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-medium text-foreground mb-1">
                          Ngân hàng bài tập JSON (fill, quiz, build) — Có thể để trống nếu chưa có
                        </label>
                        <textarea
                          rows={4}
                          value={grammarExercisesJson}
                          onChange={(e) => setGrammarExercisesJson(e.target.value)}
                          placeholder={`[\n  {\n    "type": "quiz",\n    "question": "Ich ___ ein Buch.",\n    "options": ["habe", "hast", "hat", "haben"],\n    "answer": "habe",\n    "explanation": "Đại từ Ich đi với habe."\n  }\n]`}
                          className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono text-accent"
                        />
                      </div>
                    </div>
                  ) : contentType === 'vocabulary' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-mono font-medium text-foreground">
                          Danh sách từ vựng (Định dạng: <code>[Mạo từ] Từ Đức - Nghĩa tiếng Việt - Ví dụ Đức - Dịch Việt</code>)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setManualText(
                              `der Apfel - quả táo - Ich esse einen Apfel. - Tôi ăn một quả táo.\ndie Sonne - mặt trời - Die Sonne scheint. - Mặt trời đang chiếu sáng.\ndas Buch - cuốn sách - Das Buch ist sehr interessant. - Cuốn sách rất thú vị.`
                            )
                          }
                          className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Điền mẫu nhanh</span>
                        </button>
                      </div>
                      <textarea
                        rows={7}
                        required
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder={`der Vater - người bố - Mein Vater ist Ingenieur. - Bố tôi là kỹ sư.\ndie Mutter - người mẹ - Meine Mutter kocht gut. - Mẹ tôi nấu ăn ngon.\ndas Kind - đứa trẻ - Das Kind geht zur Schule. - Đứa trẻ đến trường.`}
                        className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-mono font-medium text-foreground mb-1">
                        Nội dung chi tiết (Văn bản thuần, cấu trúc đề thi JSON hoặc tình huống)
                      </label>
                      <textarea
                        rows={7}
                        required
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Dán nội dung JSON đề thi hoặc đoạn văn đọc hiểu tại đây..."
                        className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Processing Progress Bar */}
            {isProcessing && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-sm space-y-1.5 animate-pulse">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-accent font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{processProgress.message}</span>
                  </span>
                  <span className="text-accent font-bold">{processProgress.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${processProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: PREVIEW & EDIT ================= */}
        {step === 2 && (
          <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
            {/* Header Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-muted/40 rounded-sm border border-border">
                <div className="text-muted-foreground text-[10px]">TỔNG MỤC ĐỌC ĐƯỢC</div>
                <div className="font-bold text-foreground text-sm">
                  {contentType === 'vocabulary' ? extractedItems.length : 1}
                </div>
              </div>

              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
                <div className="text-emerald-700 dark:text-emerald-400 text-[10px]">HỢP LỆ SẴN SÀNG NẠP</div>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {contentType === 'vocabulary' ? extractedItems.filter((i) => i._valid).length : 1}
                </div>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                <div className="text-amber-700 dark:text-amber-400 text-[10px]">MỤC TRÙNG LẶP</div>
                <div className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                  {contentType === 'vocabulary' ? extractedItems.filter((i) => i._isDuplicate).length : 0}
                </div>
              </div>

              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-sm">
                <div className="text-rose-700 dark:text-rose-400 text-[10px]">CẦN KIỂM TRA</div>
                <div className="font-bold text-rose-700 dark:text-rose-400 text-sm">
                  {issuesList.length}
                </div>
              </div>
            </div>

            {/* Warning Issues Banner */}
            {issuesList.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs font-mono text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Cảnh báo dữ liệu cần lưu ý:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-24 overflow-y-auto">
                  {issuesList.slice(0, 10).map((iss, idx) => (
                    <li key={idx}>{iss}</li>
                  ))}
                  {issuesList.length > 10 && (
                    <li className="font-semibold">...và {issuesList.length - 10} cảnh báo khác.</li>
                  )}
                </ul>
              </div>
            )}

            {/* PREVIEW: VOCABULARY TABLE */}
            {contentType === 'vocabulary' && (
              <div className="space-y-3">
                {/* Duplicate Mode Selector */}
                <div className="p-3 bg-muted/30 border border-border rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Xử lý khi phát hiện từ đã có trong hệ thống:</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setDuplicateMode('fill_blank')}
                      className={`px-2.5 py-1 rounded-sm border ${
                        duplicateMode === 'fill_blank'
                          ? 'bg-accent text-accent-foreground font-bold border-accent'
                          : 'bg-card border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      Chỉ điền ô trống (Không ghi đè)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateMode('skip')}
                      className={`px-2.5 py-1 rounded-sm border ${
                        duplicateMode === 'skip'
                          ? 'bg-accent text-accent-foreground font-bold border-accent'
                          : 'bg-card border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      Bỏ qua từ trùng
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateMode('overwrite')}
                      className={`px-2.5 py-1 rounded-sm border ${
                        duplicateMode === 'overwrite'
                          ? 'bg-accent text-accent-foreground font-bold border-accent'
                          : 'bg-card border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      Ghi đè cập nhật
                    </button>
                  </div>
                </div>

                {/* Table Header and Add Button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-foreground">
                    Bảng xem trước & chỉnh sửa trực tiếp ({extractedItems.length} từ):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBlankItem}
                    className="tap px-2.5 py-1 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted text-foreground flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm dòng mới</span>
                  </button>
                </div>

                {/* Inline Editable Table */}
                <div className="border border-border rounded-sm overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-muted text-muted-foreground sticky top-0 border-b border-border z-10">
                      <tr>
                        <th className="p-2 w-12 text-center">#</th>
                        <th className="p-2 w-20">Mạo từ</th>
                        <th className="p-2 min-w-[140px]">Từ tiếng Đức *</th>
                        <th className="p-2 min-w-[160px]">Nghĩa tiếng Việt *</th>
                        <th className="p-2 min-w-[180px]">Ví dụ tiếng Đức</th>
                        <th className="p-2 min-w-[160px]">Dịch ví dụ</th>
                        <th className="p-2 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {extractedItems.map((item, idx) => (
                        <tr
                          key={item._id || idx}
                          className={`hover:bg-muted/40 transition-colors ${
                            !item._valid
                              ? 'bg-rose-500/5'
                              : item._isDuplicate
                              ? 'bg-amber-500/5'
                              : ''
                          }`}
                        >
                          <td className="p-2 text-center text-[10px] text-muted-foreground font-bold">
                            {idx + 1}
                            {item._isDuplicate && (
                              <span className="block text-[8px] text-amber-600 font-bold">TRÙNG</span>
                            )}
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={item.article || ''}
                              onChange={(e) => handleUpdateItemField(idx, 'article', e.target.value)}
                              placeholder="der/die/das"
                              className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-xs font-mono"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={item.german || ''}
                              onChange={(e) => handleUpdateItemField(idx, 'german', e.target.value)}
                              placeholder="Từ tiếng Đức..."
                              className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-xs font-heading font-semibold text-foreground"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={item.vietnamese || ''}
                              onChange={(e) => handleUpdateItemField(idx, 'vietnamese', e.target.value)}
                              placeholder="Nghĩa tiếng Việt..."
                              className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-xs font-sans text-foreground"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={item.example_de || ''}
                              onChange={(e) => handleUpdateItemField(idx, 'example_de', e.target.value)}
                              placeholder="Beispielsatz..."
                              className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-xs font-heading italic text-muted-foreground"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={item.example_vi || ''}
                              onChange={(e) => handleUpdateItemField(idx, 'example_vi', e.target.value)}
                              placeholder="Dịch nghĩa ví dụ..."
                              className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-xs font-sans text-muted-foreground"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1 text-muted-foreground hover:text-rose-600 transition-colors rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PREVIEW: GRAMMAR LESSON & EXERCISES */}
            {contentType === 'grammar' && (
              <div className="space-y-4">
                <div className="p-4 bg-card border border-border rounded-sm space-y-2">
                  <div className="text-xs font-mono font-bold text-accent">NỘI DUNG BÀI HỌC MARKDOWN:</div>
                  <pre className="text-xs font-mono bg-muted/40 p-3 rounded-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {grammarContent.rule}
                  </pre>
                </div>

                <div className="p-4 bg-card border border-border rounded-sm space-y-2">
                  <div className="text-xs font-mono font-bold text-accent">
                    NGÂN HÀNG BÀI TẬP ({grammarContent.exercises?.length || 0} câu):
                  </div>
                  {grammarContent.exercises?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {grammarContent.exercises.map((ex, idx) => (
                        <div key={idx} className="p-2.5 bg-muted/30 border border-border rounded-sm text-xs font-mono">
                          <div className="font-bold text-foreground">
                            Câu {idx + 1} ({ex.type}): {ex.question}
                          </div>
                          <div className="text-emerald-600 mt-1">Đáp án: {ex.answer}</div>
                          {ex.explanation && (
                            <div className="text-muted-foreground italic text-[11px] mt-0.5">
                              Giải thích: {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-muted-foreground italic">
                      Chưa có bài tập đính kèm. Bài học sẽ được nạp dưới dạng lý thuyết bài giảng.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* PREVIEW: LISTENING SUBTITLES */}
            {contentType==='listening'&&playlistMeta&&<section className="surface border border-border p-4 space-y-3"><h3 className="font-heading font-semibold">{playlistMeta.title}</h3><p>{extractedItems.length} video có thể nhập · {playlistMeta.unavailable} video riêng tư/không khả dụng không được nhập.</p><p>Chưa lấy phụ đề CC cho các video này.</p><ol className="max-h-72 overflow-y-auto list-decimal pl-5">{extractedItems.map(v=><li key={v.id} className="py-1">{v.title}</li>)}</ol></section>}
            {captionIssue&&<p role="status" className="border border-border p-3 text-sm">{captionIssue}</p>}
            {contentType === 'listening' && !playlistMeta && !extractedItems[0]?.content && (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 border border-border rounded-sm text-xs font-mono flex items-center justify-between">
                  <span>YouTube ID: <strong>{extractYouTubeInfo(youtubeUrl).videoId}</strong></span>
                  <span>Tổng số câu phụ đề: <strong>{extractedItems.length}</strong></span>
                </div>

                <div className="border border-border rounded-sm max-h-72 overflow-y-auto divide-y divide-border bg-card">
                  {extractedItems.map((sub, idx) => (
                    <div key={idx} className="p-2.5 text-xs font-mono flex items-start gap-3">
                      <span className="font-bold text-accent shrink-0 w-16">
                        {Math.floor(sub.start / 60)}:{(sub.start % 60).toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <div className="font-heading font-semibold text-foreground">{sub.de}</div>
                        {sub.vi && <div className="text-muted-foreground text-[11px] mt-0.5">{sub.vi}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extractedItems[0]?.content&&<div className="border border-border rounded-sm p-4 space-y-2"><h3 className="font-heading font-semibold">Văn bản nguồn đã đọc</h3><pre className="whitespace-pre-wrap font-body text-sm max-h-96 overflow-auto">{extractedItems[0].content}</pre><p className="font-body text-sm">Sau khi lưu, hệ thống mở phòng luyện và tách câu hỏi. Đáp án có thể bổ sung sau.</p></div>}
            {/* PREVIEW: EXAM SIMULATION (MULTI-EXAM SUPPORT) */}
            {contentType === 'exam' && (detectedExams.length > 0 || examContent) && (
              <div className="space-y-4">
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-sm text-xs font-mono text-accent flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{examContent?._rawDocument?'Văn bản đề đã đọc · chờ tách câu hỏi sau khi lưu':<>Đã nhận diện: {detectedExams.length || 1} bộ đề có cấu trúc</>}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Kho đề dùng chung: Tự xuất hiện tại Luyện viết, Luyện nói, Luyện đọc & Thi thử
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {(detectedExams.length > 0 ? detectedExams : [examContent]).map((ex, exIdx) => {
                    const wtCount = ex.writingTasks?.length || (ex.writing?.task ? 1 : 0);
                    const spCount = ex.speakingTasks?.length || (ex.speaking?.prompt ? 1 : 0);
                    const rdCount = ex.reading?.length || 0;
                    const lsCount = ex.listening?.length || 0;

                    return (
                      <div key={ex.id || exIdx} className="p-4 bg-card border border-border rounded-sm space-y-3 text-xs font-mono shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground block mb-0.5 font-bold">
                              Tiêu đề Bộ đề #{exIdx + 1} (Bạn có thể bấm sửa):
                            </label>
                            <input
                              type="text"
                              value={ex.title}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                if (detectedExams.length > 0) {
                                  const updated = [...detectedExams];
                                  updated[exIdx] = { ...updated[exIdx], title: newTitle };
                                  setDetectedExams(updated);
                                } else {
                                  setExamContent({ ...examContent, title: newTitle });
                                }
                              }}
                              className="w-full px-2.5 py-1 text-xs font-bold font-heading rounded-sm border border-border bg-background text-foreground focus:ring-1 focus:ring-accent"
                            />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded bg-accent/15 text-accent font-bold text-xs border border-accent/30">
                              {ex.provider} • Trình độ {ex.level}
                            </span>
                          </div>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="p-2 bg-muted/40 rounded-sm border border-border/50">
                            <div className="text-[10px] text-muted-foreground font-semibold">✍️ SCHREIBEN</div>
                            <div className="font-bold text-foreground text-xs mt-0.5">{wtCount} Phần (Viết)</div>
                          </div>
                          <div className="p-2 bg-muted/40 rounded-sm border border-border/50">
                            <div className="text-[10px] text-muted-foreground font-semibold">🗣️ SPRECHEN</div>
                            <div className="font-bold text-foreground text-xs mt-0.5">{spCount} Phần (Nói)</div>
                          </div>
                          <div className="p-2 bg-muted/40 rounded-sm border border-border/50">
                            <div className="text-[10px] text-muted-foreground font-semibold">📖 LESEN</div>
                            <div className="font-bold text-foreground text-xs mt-0.5">{rdCount} Phần (Đọc)</div>
                          </div>
                          <div className="p-2 bg-muted/40 rounded-sm border border-border/50">
                            <div className="text-[10px] text-muted-foreground font-semibold">🎧 HÖREN</div>
                            <div className="font-bold text-foreground text-xs mt-0.5">{lsCount} Phần (Nghe)</div>
                          </div>
                        </div>

                        {/* Detail tasks list */}
                        {ex.writingTasks && ex.writingTasks.length > 0 && (
                          <div className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-foreground">✍️ Phần viết:</span>
                            {ex.writingTasks.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px]">
                                {t.teil || `Teil ${idx + 1}`}: {t.title}
                              </span>
                            ))}
                          </div>
                        )}
                        {ex.speakingTasks && ex.speakingTasks.length > 0 && (
                          <div className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-foreground">🗣️ Phần nói:</span>
                            {ex.speakingTasks.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px]">
                                {t.teil || `Teil ${idx + 1}`}: {t.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3: SYNC REPORT ================= */}
        {step === 3 && syncReport && (
          <div className="overflow-y-auto flex-1 py-6 space-y-5 pr-1 text-center animate-rise">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Đồng bộ thành công vào hệ thống!
              </h3>
              <p className="font-heading italic text-sm text-muted-foreground mt-1">
                Bộ nội dung đã sẵn sàng trong cơ sở dữ liệu và có hiệu lực tức thời.
              </p>
            </div>

            {/* Report Breakdown Card */}
            <div className="max-w-md mx-auto surface p-5 border border-border text-left space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Bộ tài liệu:</span>
                <span className="font-bold text-foreground">{syncReport.title}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Đích nạp & Cấp độ:</span>
                <span className="font-bold text-accent uppercase">{syncReport.contentType} ({syncReport.level})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Quyền hiển thị (Scope):</span>
                <span className="font-bold text-foreground">
                  {syncReport.scope === 'public' ? '🌍 Toàn hệ thống' : syncReport.scope === 'private' ? '👤 Kho cá nhân' : '🔒 Nội bộ Admin'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Số mục thêm mới:</span>
                <span className="font-bold text-emerald-600">+{syncReport.savedCount}</span>
              </div>
              {syncReport.updatedCount > 0 && (
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Số mục cập nhật / điền thêm:</span>
                  <span className="font-bold text-blue-600">{syncReport.updatedCount}</span>
                </div>
              )}
              {syncReport.skippedCount > 0 && (
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Số mục trùng lặp bỏ qua:</span>
                  <span className="font-bold text-amber-600">{syncReport.skippedCount}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Thời gian đồng bộ:</span>
                <span>{syncReport.timestamp}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= FOOTER ACTION BUTTONS ================= */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="tap px-4 py-2 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-foreground"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleStartExtraction}
                className="tap px-6 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý trích xuất...</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp tục: Xem trước & Sửa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="tap px-4 py-2 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-foreground flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại cấu hình</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSave}
                className="tap px-6 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu vào hệ thống...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác nhận nạp vào hệ thống</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setExtractedItems([]);
                  setSyncReport(null);
                  setSelectedFile(null);
                }}
                className="tap px-4 py-2 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-foreground"
              >
                + Nhập tệp tiếp theo
              </button>

              <button
                type="button"
                onClick={onClose}
                className="tap px-6 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm"
              >
                Đóng cửa sổ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>, document.body
  );
}

export default UniversalImportModal;
