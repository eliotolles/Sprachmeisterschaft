import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/db';
import {
  AI_PROVIDERS,
  FREE_AI_MODELS,
  APP_AI_TASKS,
} from '@/data/ai-models-catalog';
import { testAiConnection, testAiTaskSpecific } from '@/lib/ai-evaluator';
import { getAllExams } from '@/data/all-exams';
import { GRAMMAR_CORE } from '@/data/grammar';
import { SITUATIONS } from '@/data/situations';
import { toast } from 'sonner';
import {
  FileBarChart,
  Activity,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bot,
  Zap,
  RefreshCw,
  Sparkles,
  Clock,
  Send,
  Wrench,
  Copy,
  Download,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowRight,
  HelpCircle,
  Check,
} from 'lucide-react';

export function AdminReportsTab({
  aiConfigs = [],
  setAiConfigs,
  aiAssignments = {},
  setAiAssignments,
  onNavigateTab,
}) {
  // Trạng thái quét & giám sát
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [lastScannedAt, setLastScannedAt] = useState(null);

  // Kết quả giám sát từng con AI
  const [aiMonitorResults, setAiMonitorResults] = useState({});
  // Danh sách lỗi & cảnh báo rà soát được
  const [detectedIssues, setDetectedIssues] = useState([]);
  // Tab con trong Báo cáo: 'overview' | 'issues' | 'fleet' | 'chat'
  const [subTab, setSubTab] = useState('overview');

  // Chat tương tác với Con AI Quản lý (Sentinel)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'sentinel',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: 'Chào Quản trị viên! Tôi là **Elio Sentinel** — AI Giám sát & Quản lý Hệ thống. Nhiệm vụ của tôi là kiểm tra, giám sát liên tục toàn bộ các con AI khác đang phục vụ học viên, đồng thời rà soát mọi lỗi phát sinh trong hệ thống để báo cáo kịp thời cho bạn. Bạn có thể bấm "Chạy rà soát toàn bộ" hoặc hỏi tôi bất kỳ vấn đề gì về hệ thống!',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const chatEndRef = useRef(null);

  // Tự động cuộn chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ====================================================================
  // 1. THU THẬP & PHÂN TÍCH CHỈ SỐ HỆ THỐNG
  // ====================================================================
  const stats = useMemo(() => {
    const totalConfigs = aiConfigs.length;
    const activeConfigs = aiConfigs.filter((c) => c.enabled !== false).length;
    const visionConfigs = aiConfigs.filter((c) => c.hasVision).length;

    // Tác vụ đã gán AI
    const totalTasks = APP_AI_TASKS.length;
    const assignedTasksCount = Object.keys(aiAssignments || {}).filter(
      (taskId) => aiAssignments[taskId]?.model
    ).length;

    // Điểm độ trễ trung bình từ các lần test
    const testedEntries = Object.values(aiMonitorResults).filter((r) => r.latency);
    const avgLatency =
      testedEntries.length > 0
        ? Math.round(
            testedEntries.reduce((acc, r) => acc + (r.latency || 0), 0) /
              testedEntries.length
          )
        : null;

    // Số lượng lỗi
    const criticalIssues = detectedIssues.filter((i) => i.level === 'critical');
    const warningIssues = detectedIssues.filter((i) => i.level === 'warning');
    const infoIssues = detectedIssues.filter((i) => i.level === 'info');

    // Chỉ số sức khỏe hệ thống (0 - 100)
    let healthScore = 100;
    if (criticalIssues.length > 0) healthScore -= criticalIssues.length * 20;
    if (warningIssues.length > 0) healthScore -= warningIssues.length * 8;
    if (assignedTasksCount < totalTasks) {
      healthScore -= (totalTasks - assignedTasksCount) * 5;
    }
    if (totalConfigs === 0) healthScore = 0;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      totalConfigs,
      activeConfigs,
      visionConfigs,
      totalTasks,
      assignedTasksCount,
      avgLatency,
      criticalCount: criticalIssues.length,
      warningCount: warningIssues.length,
      infoCount: infoIssues.length,
      healthScore,
    };
  }, [aiConfigs, aiAssignments, aiMonitorResults, detectedIssues]);

  // ====================================================================
  // 2. RÀ SOÁT LỖI TỔNG THỂ (AI & NỘI DUNG & BẢO MẬT)
  // ====================================================================
  const runDeepAudit = async () => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStatusText('Đang khởi tạo Elio Sentinel và rà soát cấu hình các con AI...');

    const newIssues = [];
    const monitorMap = {};

    try {
      // BƯỚC 1: Quét cấu hình danh sách AI
      setScanProgress(25);
      setScanStatusText('Đang kiểm tra thông số và tính tương thích của từng con AI...');

      if (aiConfigs.length === 0) {
        newIssues.push({
          id: 'err-no-ai',
          level: 'critical',
          category: 'Cấu hình AI',
          title: 'Hệ thống chưa có cấu hình AI nào!',
          desc: 'Hiện tại chưa có bất kỳ nhà cung cấp AI nào được thiết lập. Học viên sẽ không thể dùng tính năng chấm bài, giải thích ngữ pháp hay đàm thoại Elio.',
          fixAction: 'add_default_gemini',
          fixLabel: 'Thêm ngay Google Gemini (Free Tier)',
        });
      }

      aiConfigs.forEach((cfg) => {
        // Kiểm tra API Key
        if (!cfg.apiKey?.trim() && cfg.provider !== 'custom') {
          newIssues.push({
            id: `err-key-${cfg.id}`,
            level: 'critical',
            category: 'API Key',
            title: `AI [${cfg.name}] đang thiếu API Key`,
            desc: `Nhà cung cấp ${cfg.provider.toUpperCase()} với model ${cfg.model} chưa được điền API Key hoặc key bị rỗng.`,
            fixAction: 'navigate_ai_tab',
            fixLabel: 'Mở tab AI & Cấu hình lại',
          });
        }

        // Kiểm tra Backup Model
        if (!cfg.backupModel?.trim()) {
          newIssues.push({
            id: `warn-backup-${cfg.id}`,
            level: 'warning',
            category: 'Dự phòng Failover',
            title: `AI [${cfg.name}] chưa có Model dự phòng`,
            desc: `Nếu model ${cfg.model} gặp sự cố hoặc quá tải (Rate limit), tác vụ có thể bị gián đoạn vì chưa có backup model tự động.`,
            fixAction: 'set_default_backup',
            targetConfigId: cfg.id,
            fixLabel: 'Tự động gán model dự phòng tương thích',
          });
        }
      });

      // BƯỚC 2: Quét phân công tác vụ (Task Assignments)
      setScanProgress(50);
      setScanStatusText('Đang đối chiếu phân công tác vụ ứng dụng với khả năng của AI...');

      APP_AI_TASKS.forEach((task) => {
        const assigned = aiAssignments[task.id];
        if (!assigned || !assigned.model) {
          newIssues.push({
            id: `err-unassigned-${task.id}`,
            level: 'critical',
            category: 'Phân công tác vụ',
            title: `Tác vụ "${task.name}" chưa được giao cho AI nào`,
            desc: `Tác vụ thuộc nhóm [${task.category}] đang bị bỏ trống. Khi học viên truy cập tính năng này sẽ gặp thông báo lỗi.`,
            fixAction: 'assign_recommended_task',
            taskId: task.id,
            recommendedModel: task.defaultRecommendation,
            fixLabel: `Gán tự động model ${task.defaultRecommendation}`,
          });
        } else {
          // Kiểm tra tác vụ cần Vision
          if (task.needsVision) {
            const matchedCfg = aiConfigs.find(
              (c) => c.provider === assigned.provider && c.model === assigned.model
            );
            if (matchedCfg && !matchedCfg.hasVision) {
              newIssues.push({
                id: `err-vision-mismatch-${task.id}`,
                level: 'critical',
                category: 'Tương thích Vision/OCR',
                title: `Lỗi bất tương thích: "${task.name}" yêu cầu Vision nhưng model không hỗ trợ!`,
                desc: `Model ${assigned.model} hiện tại không có khả năng đọc ảnh chụp bài tập hoặc PDF.`,
                fixAction: 'fix_vision_assignment',
                taskId: task.id,
                fixLabel: 'Chuyển sang Gemini Flash (Đọc ảnh tốt nhất)',
              });
            }
          }
        }
      });

      // BƯỚC 3: Giám sát kết nối thực tế (Ping các con AI)
      setScanProgress(75);
      setScanStatusText('Đang thực hiện ping kiểm tra tốc độ phản hồi thực tế của các con AI...');

      for (const cfg of aiConfigs) {
        if (!cfg.apiKey?.trim() && cfg.provider !== 'custom') {
          monitorMap[cfg.id] = {
            success: false,
            message: 'Thiếu API Key',
            latency: null,
            status: 'missing_key',
          };
          continue;
        }

        const startPing = Date.now();
        try {
          const res = await testAiConnection(cfg);
          const elapsed = Date.now() - startPing;
          monitorMap[cfg.id] = {
            success: Boolean(res.success),
            message: res.message || (res.success ? 'Hoạt động ổn định' : 'Lỗi kết nối'),
            latency: res.success ? elapsed : null,
            status: res.success ? 'online' : 'error',
          };

          if (!res.success) {
            newIssues.push({
              id: `err-ping-${cfg.id}`,
              level: 'critical',
              category: 'Kết nối mạng AI',
              title: `AI [${cfg.name}] không phản hồi (Ping thất bại)`,
              desc: res.message || 'Máy chủ nhà cung cấp từ chối hoặc sai thông tin xác thực.',
              fixAction: 'navigate_ai_tab',
              fixLabel: 'Kiểm tra lại khóa API',
            });
          }
        } catch (err) {
          monitorMap[cfg.id] = {
            success: false,
            message: err.message || 'Timeout / Lỗi mạng',
            latency: null,
            status: 'error',
          };
          newIssues.push({
            id: `err-ping-catch-${cfg.id}`,
            level: 'critical',
            category: 'Lỗi ngoại lệ AI',
            title: `AI [${cfg.name}] gặp lỗi ngoại lệ khi kiểm tra`,
            desc: err.message,
            fixAction: 'navigate_ai_tab',
            fixLabel: 'Xem chi tiết lỗi',
          });
        }
      }

      // BƯỚC 4: Rà soát kho nội dung học tập
      setScanProgress(90);
      setScanStatusText('Đang rà soát dữ liệu kho học tập (Đề thi, Ngữ pháp, Tình huống)...');

      try {
        const exams = getAllExams() || [];
        if (exams.length === 0) {
          newIssues.push({
            id: 'warn-no-exams',
            level: 'warning',
            category: 'Kho Đề thi',
            title: 'Kho đề thi chưa có dữ liệu nào!',
            desc: 'Cần import đề thi Goethe, telc hoặc ÖSD để học viên luyện tập.',
            fixAction: 'open_import_exam',
            fixLabel: 'Mở cửa sổ Import Đề thi',
          });
        }

        const grammarCount = (GRAMMAR_CORE || []).length;
        if (grammarCount === 0) {
          newIssues.push({
            id: 'warn-no-grammar',
            level: 'warning',
            category: 'Kho Ngữ pháp',
            title: 'Kho ngữ pháp cốt lõi đang trống',
            desc: 'Chưa có các chủ đề ngữ pháp A1-B2 sẵn sàng.',
            fixAction: 'open_import_grammar',
            fixLabel: 'Mở Import Ngữ pháp',
          });
        }
      } catch (e) {
        // Bỏ qua nếu môi trường test không có dữ liệu
      }

      // Đề xuất tối ưu chi phí (Info)
      const hasGemini = aiConfigs.some((c) => c.provider === 'gemini');
      if (!hasGemini) {
        newIssues.push({
          id: 'info-recommend-gemini',
          level: 'info',
          category: 'Tối ưu Chi phí',
          title: 'Khuyến nghị thêm Google Gemini 2.5 Flash',
          desc: 'Gemini 2.5 Flash hoàn toàn miễn phí 15 RPM tại Google AI Studio, đọc được ảnh bài tập, PDF và tốc độ cực nhanh.',
          fixAction: 'add_default_gemini',
          fixLabel: 'Thêm cấu hình Gemini 2.5 Flash',
        });
      }

      setScanProgress(100);
      setScanStatusText('Hoàn tất rà soát!');
      setAiMonitorResults(monitorMap);
      setDetectedIssues(newIssues);
      setLastScannedAt(new Date());

      // Thông báo con AI Sentinel cập nhật chat
      const issueSummaryText =
        newIssues.length === 0
          ? '🎉 **Hệ thống hoàn hảo!** Toàn bộ các con AI đang hoạt động ổn định, phản hồi nhanh và không phát hiện bất kỳ lỗi nào.'
          : `⚠️ **Báo cáo rà soát:** Phát hiện **${newIssues.length} vấn đề** (gồm ${newIssues.filter((i) => i.level === 'critical').length} lỗi nghiêm trọng, ${newIssues.filter((i) => i.level === 'warning').length} cảnh báo). Tôi đã liệt kê chi tiết trong danh sách lỗi bên dưới kèm nút khắc phục nhanh!`;

      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-scan-${Date.now()}`,
          sender: 'sentinel',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: `Tôi vừa hoàn tất giám sát toàn bộ ${aiConfigs.length} con AI và rà soát hệ thống.\n\n${issueSummaryText}`,
        },
      ]);

      toast.success('Elio Sentinel đã hoàn tất giám sát và rà soát lỗi!');
    } catch (err) {
      toast.error('Có lỗi trong quá trình quét: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Tự động quét 1 lần khi mới mở trang nếu chưa quét
  useEffect(() => {
    if (!lastScannedAt && aiConfigs.length > 0) {
      runDeepAudit();
    }
  }, []);

  // ====================================================================
  // 3. TỰ ĐỘNG KHẮC PHỤC LỖI (AUTO-FIX ACTIONS)
  // ====================================================================
  const handleAutoFix = async (issue) => {
    try {
      if (issue.fixAction === 'add_default_gemini') {
        const newCfg = {
          id: `ai-cfg-gemini-${Date.now()}`,
          name: 'Google Gemini 2.5 Flash (Free Tier)',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          backupModel: 'gemini-2.0-flash',
          apiKey: '',
          hasVision: true,
          priority: 1,
          enabled: true,
          discoveredAt: new Date().toISOString(),
        };
        await db.aiConfig.saveConfig(newCfg);
        if (setAiConfigs) setAiConfigs(db.aiConfig.getConfigs());
        toast.success('Đã thêm mẫu cấu hình Gemini 2.5 Flash! Hãy nhập API Key để kích hoạt.');
        // Loại bỏ issue khỏi list
        setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
      } else if (issue.fixAction === 'assign_recommended_task') {
        // Tìm config phù hợp nhất hoặc tạo mới
        const suitableCfg = aiConfigs.find((c) => c.hasVision || c.provider === 'gemini') || aiConfigs[0];
        const prov = suitableCfg?.provider || 'gemini';
        const model = suitableCfg?.model || issue.recommendedModel || 'gemini-2.5-flash';

        await db.aiConfig.setAssignment(issue.taskId, prov, model);
        if (setAiAssignments) setAiAssignments(db.aiConfig.getAssignments());
        toast.success(`Đã tự động gán [${prov.toUpperCase()} - ${model}] cho tác vụ!`);
        setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
      } else if (issue.fixAction === 'fix_vision_assignment') {
        const visionCfg = aiConfigs.find((c) => c.hasVision);
        if (visionCfg) {
          await db.aiConfig.setAssignment(issue.taskId, visionCfg.provider, visionCfg.model);
          if (setAiAssignments) setAiAssignments(db.aiConfig.getAssignments());
          toast.success(`Đã đổi tác vụ sang model có Vision: ${visionCfg.model}!`);
        } else {
          toast.info('Bạn cần bật cờ "Hỗ trợ Vision" cho ít nhất 1 cấu hình AI ở tab AI & phân công.');
        }
        setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
      } else if (issue.fixAction === 'set_default_backup') {
        const cfg = aiConfigs.find((c) => c.id === issue.targetConfigId);
        if (cfg) {
          const defaultBackup =
            cfg.provider === 'gemini'
              ? 'gemini-2.0-flash'
              : cfg.provider === 'groq'
              ? 'llama-3.3-70b-versatile'
              : 'gemini-2.5-flash';
          await db.aiConfig.saveConfig({ ...cfg, backupModel: defaultBackup });
          if (setAiConfigs) setAiConfigs(db.aiConfig.getConfigs());
          toast.success(`Đã gán model dự phòng: ${defaultBackup}!`);
          setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
        }
      } else if (issue.fixAction === 'navigate_ai_tab') {
        if (onNavigateTab) onNavigateTab('ai');
      } else {
        toast.info('Vui lòng xử lý lỗi này tại tab cấu hình tương ứng.');
      }
    } catch (err) {
      toast.error('Lỗi khi khắc phục: ' + err.message);
    }
  };

  // ====================================================================
  // 4. CHAT TƯƠNG TÁC VỚI CON AI QUẢN LÝ (SENTINEL)
  // ====================================================================
  const handleSendMessage = (e) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: query,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Con AI Sentinel trả lời dựa trên dữ liệu hệ thống
    setTimeout(() => {
      let replyText = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('nhanh nhất') || qLower.includes('tốc độ') || qLower.includes('latency')) {
        const latencies = Object.entries(aiMonitorResults)
          .filter(([_, r]) => r.latency)
          .map(([cfgId, r]) => {
            const cfg = aiConfigs.find((c) => c.id === cfgId);
            return { name: cfg?.name || cfgId, latency: r.latency };
          })
          .sort((a, b) => a.latency - b.latency);

        if (latencies.length > 0) {
          replyText = `⚡ **Báo cáo tốc độ phản hồi:**\nCon AI nhanh nhất hiện tại là **${latencies[0].name}** với độ trễ chỉ **${latencies[0].latency}ms**.\n\nBảng xếp hạng:\n` +
            latencies.map((l, idx) => `${idx + 1}. ${l.name}: **${l.latency}ms**`).join('\n');
        } else {
          replyText = 'Hiện tại chưa có dữ liệu độ trễ đo lường. Bạn hãy bấm nút **"Chạy rà soát toàn bộ"** ở góc trên để tôi đo đạc độ trễ của từng con AI nhé!';
        }
      } else if (qLower.includes('lỗi') || qLower.includes('sự cố') || qLower.includes('nghiêm trọng') || qLower.includes('bug')) {
        if (detectedIssues.length === 0) {
          replyText = '✅ **Không có lỗi nào!** Tất cả các con AI và cấu hình hệ thống đang hoạt động an toàn và chuẩn mực 100%.';
        } else {
          const crit = detectedIssues.filter((i) => i.level === 'critical');
          replyText = `🚨 **Báo cáo lỗi tức thì:**\nHiện có **${detectedIssues.length} vấn đề**, trong đó có **${crit.length} lỗi nghiêm trọng**:\n\n` +
            detectedIssues
              .slice(0, 4)
              .map((i, idx) => `• **${i.title}** (${i.category}): ${i.desc}`)
              .join('\n\n') +
            '\n\n👉 Bạn hãy chuyển qua tab **"Danh sách lỗi rà soát"** để bấm nút tự động sửa từng lỗi nhé!';
        }
      } else if (qLower.includes('miễn phí') || qLower.includes('tiết kiệm') || qLower.includes('chi phí') || qLower.includes('free')) {
        replyText = `💡 **Chiến lược Zero-Cost (Chi phí 0đ) tôi đề xuất cho bạn:**\n\n` +
          `1. **Tác vụ Đọc ảnh bài tập & OCR (ocr_image):** Dùng **Google Gemini 2.5 Flash** (Free 15 RPM tại Google AI Studio) — đây là model đọc ảnh mạnh nhất hiện nay.\n` +
          `2. **Tác vụ Chấm viết & Đàm thoại Elio (writing_grading, elio_chat):** Dùng **Groq (Llama 3.3 70B)** hoặc **DeepSeek R1/V3 Free trên OpenRouter** (tốc độ 300 token/s, miễn phí 100%).\n` +
          `3. **Tác vụ Thẩm định kỳ thi (exam_evaluation):** Dùng **DeepSeek R1 Distill** trên Groq hoặc Together AI để suy luận logic giải thích từng câu hỏi.\n\n` +
          `Khi cấu hình như trên, hệ thống của bạn vận hành trơn tru mà không mất một đồng chi phí API nào!`;
      } else {
        replyText = `Tôi đã ghi nhận yêu cầu: "${query}".\n\n📊 **Tình trạng tổng quan hiện tại:**\n• Tổng số AI đang giám sát: **${aiConfigs.length} con**\n• Số tác vụ đã phân công: **${Object.keys(aiAssignments).length}/${APP_AI_TASKS.length} tác vụ**\n• Điểm sức khỏe hệ thống: **${stats.healthScore}/100 điểm**\n• Số lỗi đang chờ xử lý: **${detectedIssues.length} mục**\n\nBạn có thể bảo tôi kiểm tra lại kết nối hoặc đề xuất cách sửa lỗi bất cứ lúc nào!`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          sender: 'sentinel',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: replyText,
        },
      ]);
    }, 600);
  };

  // Sao chép báo cáo Markdown
  const handleCopyReport = () => {
    const reportText = generateExecutiveReportText({
      stats,
      aiConfigs,
      aiAssignments,
      aiMonitorResults,
      detectedIssues,
      lastScannedAt,
    });
    navigator.clipboard.writeText(reportText);
    toast.success('Đã sao chép toàn bộ bản báo cáo quản trị vào bộ nhớ tạm!');
  };

  return (
    <div className="space-y-6 animate-fade-in font-body">

      {/* ============================================================ */}
      {/* HEADER: THẺ ĐIỀU HÀNH CỦA CHIEF AI SUPERVISOR */}
      {/* ============================================================ */}
      <div className="surface p-5 sm:p-6 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/5 via-card to-card shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 shadow-sm relative">
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                  AI Quản lý & Giám sát Hệ thống · Chief AI Supervisor
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ĐANG GIÁM SÁT 24/7
                </span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <span>Elio Sentinel</span>
                <span className="text-xs font-mono font-normal text-muted-foreground hidden sm:inline">
                  (Báo cáo kiểm soát toàn diện dàn AI & Rà soát lỗi)
                </span>
              </h2>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Nhiệm vụ: Đo lường độ trễ, kiểm tra tính sẵn sàng của tất cả các con AI trong hệ thống, phát hiện các điểm nghẽn, kiểm tra nội dung học tập và tự động lập báo cáo cho Quản trị viên.
              </p>
            </div>
          </div>

          {/* Nút hành động chính */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              type="button"
              disabled={isScanning}
              onClick={runDeepAudit}
              className="tap px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-mono text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 hover:opacity-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Đang rà soát...' : 'Chạy rà soát toàn bộ'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              className="tap px-3.5 py-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-mono text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép báo cáo</span>
            </button>
          </div>
        </div>

        {/* Thanh tiến trình khi đang quét */}
        {isScanning && (
          <div className="space-y-1.5 pt-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 text-accent font-semibold">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                {scanStatusText}
              </span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4 CHỈ SỐ ĐIỀU HÀNH CỐT LÕI (EXECUTIVE KPI CARDS) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        {/* Điểm sức khỏe */}
        <div className="surface p-4 rounded-xl border border-border bg-card space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sức khỏe Hệ thống</span>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-heading ${
                stats.healthScore >= 90
                  ? 'text-emerald-500'
                  : stats.healthScore >= 70
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
            >
              {stats.healthScore}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {stats.healthScore >= 90 ? 'Tối ưu' : stats.healthScore >= 70 ? 'Cần chú ý' : 'Nguy cơ'}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {stats.criticalCount > 0 ? `${stats.criticalCount} lỗi cần xử lý ngay` : 'Không có lỗi nguy hiểm'}
          </div>
        </div>

        {/* Dàn AI đang giám sát */}
        <div className="surface p-4 rounded-xl border border-border bg-card space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Con AI hoạt động</span>
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              {stats.activeConfigs}/{stats.totalConfigs}
            </span>
            <span className="text-[11px] text-muted-foreground">con AI</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {stats.visionConfigs} con hỗ trợ đọc ảnh Vision
          </div>
        </div>

        {/* Phân công tác vụ */}
        <div className="surface p-4 rounded-xl border border-border bg-card space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tác vụ đã phân công</span>
            <Layers className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              {stats.assignedTasksCount}/{stats.totalTasks}
            </span>
            <span className="text-[11px] text-muted-foreground">nhiệm vụ</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {stats.totalTasks - stats.assignedTasksCount === 0
              ? 'Đủ 100% tác vụ trong app'
              : `Còn ${stats.totalTasks - stats.assignedTasksCount} tác vụ trống`}
          </div>
        </div>

        {/* Độ trễ trung bình */}
        <div className="surface p-4 rounded-xl border border-border bg-card space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Độ trễ trung bình</span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              {stats.avgLatency ? `${stats.avgLatency}ms` : '---'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {stats.avgLatency && stats.avgLatency < 500 ? 'Rất nhanh' : stats.avgLatency ? 'Bình thường' : 'Chưa đo'}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {lastScannedAt ? `Quét lúc ${lastScannedAt.toLocaleTimeString('vi-VN')}` : 'Chưa quét'}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* THANH ĐIỀU HƯỚNG CÁC TAB CON CỦA BÁO CÁO */}
      {/* ============================================================ */}
      <div className="flex items-center gap-1 border-b border-border pb-1 overflow-x-auto text-xs font-mono">
        {[
          { id: 'overview', label: '📊 Bản Báo cáo Tổng hợp', count: null },
          { id: 'issues', label: '⚠️ Danh sách Lỗi & Rà soát', count: detectedIssues.length },
          { id: 'fleet', label: '🤖 Giám sát từng con AI', count: aiConfigs.length },
          { id: 'chat', label: '💬 Hỏi đáp với Sentinel AI', count: null },
        ].map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`tap px-3.5 py-2 rounded-t-lg font-medium flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                isActive
                  ? 'border-accent text-accent bg-accent/5 font-bold shadow-xs'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    tab.id === 'issues'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB CON 1: BẢN BÁO CÁO TỔNG HỢP CỦA CON AI QUẢN LÝ */}
      {/* ============================================================ */}
      {subTab === 'overview' && (
        <div className="space-y-5 animate-fade-in">
          {/* Nhận xét điều hành từ Sentinel */}
          <div className="surface p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Bot className="w-5 h-5 text-accent" />
              <h3 className="font-heading font-bold text-base text-foreground">
                Đánh giá Tổng quan từ Trưởng ban Giám sát AI
              </h3>
            </div>

            <div className="space-y-3 text-sm text-foreground/90 leading-relaxed font-body">
              <p>
                <strong>Kính gửi Quản trị viên,</strong> sau quá trình quét và theo dõi trực tiếp toàn bộ hạ tầng trí tuệ nhân tạo của <em>Sprachmeisterschaft</em>, tôi xin gửi bản báo cáo hiện trạng như sau:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-1.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Điểm mạnh hệ thống
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Hệ thống có <strong>{stats.activeConfigs} con AI</strong> đang sẵn sàng phục vụ.</li>
                    <li>Có <strong>{stats.visionConfigs} con AI</strong> hỗ trợ công nghệ đọc ảnh đa phương thức (Vision).</li>
                    <li>Các tác vụ học tập quan trọng đều được cô lập và chạy với cấu hình riêng biệt.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-1.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Điểm cần lưu ý & Khắc phục
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {stats.criticalCount > 0 ? (
                      <li className="text-rose-600 dark:text-rose-400 font-semibold">
                        Có {stats.criticalCount} lỗi nghiêm trọng cần xử lý ngay để tránh gián đoạn học tập.
                      </li>
                    ) : (
                      <li>Không phát hiện lỗi nghiêm trọng nào về cấu hình.</li>
                    )}
                    <li>
                      {stats.totalTasks - stats.assignedTasksCount > 0
                        ? `Còn ${stats.totalTasks - stats.assignedTasksCount} tác vụ chưa được chỉ định AI cụ thể.`
                        : 'Toàn bộ 100% tác vụ đã được phân công đầy đủ.'}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Khuyến nghị tối ưu của Sentinel */}
              <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 space-y-2">
                <div className="font-heading font-bold text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Khuyến nghị Tối ưu hóa từ Sentinel AI
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed font-mono">
                  1. <strong>Tối đa hóa Free Tier:</strong> Nên cấu hình <em>Google Gemini 2.5 Flash</em> làm model chính cho OCR và chấm viết, đồng thời dùng <em>Groq (Llama 3.3 70B)</em> cho đàm thoại Elio để đạt tốc độ 300 token/s mà không tốn chi phí.<br />
                  2. <strong>Bật dự phòng Failover:</strong> Luôn cài đặt ít nhất một Backup Model cho mỗi cấu hình AI để hệ thống tự động nhảy sang model phụ khi nhà mạng hoặc API bị nghẽn.<br />
                  3. <strong>Kiểm tra định kỳ:</strong> Hãy bấm "Chạy rà soát toàn bộ" mỗi khi bạn thêm mới bài học hoặc cập nhật khóa API.
                </p>
              </div>
            </div>
          </div>

          {/* Tóm tắt nhanh các lỗi được phát hiện */}
          {detectedIssues.length > 0 && (
            <div className="surface p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Các vấn đề vừa được rà soát ({detectedIssues.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSubTab('issues')}
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <span>Xem & Sửa tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-border/60">
                {detectedIssues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="py-2.5 flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            issue.level === 'critical'
                              ? 'bg-rose-500'
                              : issue.level === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span>{issue.title}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">{issue.desc}</p>
                    </div>
                    {issue.fixLabel && (
                      <button
                        type="button"
                        onClick={() => handleAutoFix(issue)}
                        className="tap px-2.5 py-1 rounded bg-accent text-accent-foreground text-[11px] font-semibold shrink-0"
                      >
                        {issue.fixLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CON 2: DANH SÁCH LỖI & RÀ SOÁT TỨC THÌ (BUG TRACKER) */}
      {/* ============================================================ */}
      {subTab === 'issues' && (
        <div className="space-y-4 animate-fade-in font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-accent" />
                <span>Báo cáo Rà soát Lỗi Hệ thống</span>
              </h3>
              <p className="text-xs text-muted-foreground font-body">
                Elio Sentinel liên tục rà soát cấu hình AI, kho dữ liệu bài học và tính tương thích tác vụ.
              </p>
            </div>
            <button
              type="button"
              disabled={isScanning}
              onClick={runDeepAudit}
              className="tap px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Quét lại ngay</span>
            </button>
          </div>

          {detectedIssues.length === 0 ? (
            <div className="surface p-12 text-center rounded-xl border border-border bg-card space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-base text-foreground">
                Không phát hiện lỗi nào!
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto font-body">
                Toàn bộ các con AI và phân công tác vụ đều đáp ứng đầy đủ tiêu chuẩn vận hành an toàn và mượt mà.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {detectedIssues.map((issue) => {
                const isCrit = issue.level === 'critical';
                const isWarn = issue.level === 'warning';
                return (
                  <div
                    key={issue.id}
                    className={`surface p-4 rounded-xl border transition-all ${
                      isCrit
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : isWarn
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-blue-500/30 bg-blue-500/5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCrit
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : isWarn
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {isCrit ? 'NGHIÊM TRỌNG' : isWarn ? 'CẢNH BÁO' : 'ĐỀ XUẤT TỐI ƯU'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">[{issue.category}]</span>
                        </div>
                        <h4 className="font-heading font-bold text-sm text-foreground">
                          {issue.title}
                        </h4>
                        <p className="text-xs text-muted-foreground font-body leading-relaxed">
                          {issue.desc}
                        </p>
                      </div>

                      {issue.fixLabel && (
                        <button
                          type="button"
                          onClick={() => handleAutoFix(issue)}
                          className="tap px-3.5 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm self-start sm:self-center"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{issue.fixLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CON 3: BẢNG GIÁM SÁT CHI TIẾT TỪNG CON AI (AI FLEET) */}
      {/* ============================================================ */}
      {subTab === 'fleet' && (
        <div className="space-y-4 animate-fade-in font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" />
                <span>Bảng Giám sát Dàn AI (AI Fleet Monitoring)</span>
              </h3>
              <p className="text-xs text-muted-foreground font-body">
                Theo dõi trạng thái sống, độ trễ và tác vụ được giao cho từng con AI.
              </p>
            </div>
            <button
              type="button"
              disabled={isScanning}
              onClick={runDeepAudit}
              className="tap px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Ping lại tất cả</span>
            </button>
          </div>

          <div className="surface rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-border">
                <thead className="bg-muted/40 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Tên & Nhà cung cấp</th>
                    <th className="p-3">Model & Dự phòng</th>
                    <th className="p-3">Tác vụ được giao</th>
                    <th className="p-3">Khả năng Vision</th>
                    <th className="p-3">Trạng thái kết nối</th>
                    <th className="p-3">Độ trễ (Latency)</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {aiConfigs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Chưa có con AI nào được cấu hình trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    aiConfigs.map((cfg) => {
                      const mon = aiMonitorResults[cfg.id] || {};
                      // Lấy các task gán cho config này
                      const assignedTasks = APP_AI_TASKS.filter(
                        (t) =>
                          aiAssignments[t.id]?.provider === cfg.provider &&
                          aiAssignments[t.id]?.model === cfg.model
                      );

                      return (
                        <tr key={cfg.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-foreground">{cfg.name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{cfg.provider}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-accent">{cfg.model}</div>
                            {cfg.backupModel ? (
                              <div className="text-[10px] text-muted-foreground">Backup: {cfg.backupModel}</div>
                            ) : (
                              <div className="text-[10px] text-amber-500">Chưa có backup</div>
                            )}
                          </td>
                          <td className="p-3">
                            {assignedTasks.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedTasks.map((t) => (
                                  <span
                                    key={t.id}
                                    className="px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-semibold"
                                  >
                                    {t.name.split('(')[0]}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Chưa gán tác vụ</span>
                            )}
                          </td>
                          <td className="p-3">
                            {cfg.hasVision ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                                Vision OK
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">Chỉ văn bản</span>
                            )}
                          </td>
                          <td className="p-3">
                            {mon.status === 'online' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Online
                              </span>
                            ) : mon.status === 'missing_key' ? (
                              <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                                <XCircle className="w-3 h-3" />
                                Thiếu Key
                              </span>
                            ) : mon.status === 'error' ? (
                              <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]" title={mon.message}>
                                <AlertTriangle className="w-3 h-3" />
                                Lỗi kết nối
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Chưa kiểm tra</span>
                            )}
                          </td>
                          <td className="p-3 font-bold">
                            {mon.latency ? (
                              <span className={mon.latency < 400 ? 'text-emerald-500' : 'text-foreground'}>
                                {mon.latency}ms
                              </span>
                            ) : (
                              <span className="text-muted-foreground">---</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                toast.info(`Đang ping kiểm tra ${cfg.name}...`);
                                const start = Date.now();
                                const res = await testAiConnection(cfg);
                                const elapsed = Date.now() - start;
                                setAiMonitorResults((prev) => ({
                                  ...prev,
                                  [cfg.id]: {
                                    success: res.success,
                                    message: res.message,
                                    latency: res.success ? elapsed : null,
                                    status: res.success ? 'online' : 'error',
                                  },
                                }));
                                toast[res.success ? 'success' : 'error'](res.message);
                              }}
                              className="tap px-2 py-1 rounded border border-border hover:bg-muted text-[11px] font-semibold"
                            >
                              Test Ping
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CON 4: HỎI ĐÁP VỚI CHIEF AI SENTINEL (COMMAND CENTER) */}
      {/* ============================================================ */}
      {subTab === 'chat' && (
        <div className="surface rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-[520px] animate-fade-in font-body">
          {/* Header chat */}
          <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-bold font-heading text-xs">
                AI
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
                  <span>Trò chuyện cùng Elio Sentinel</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Hỏi trực tiếp về tình trạng, sự cố, độ trễ hoặc xin giải pháp tối ưu hệ thống
                </div>
              </div>
            </div>
          </div>

          {/* Hộp tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {chatMessages.map((msg) => {
              const isSentinel = msg.sender === 'sentinel';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isSentinel ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-[10px] font-bold ${
                      isSentinel
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {isSentinel ? 'AI' : 'Tôi'}
                  </div>
                  <div
                    className={`p-3.5 rounded-xl max-w-lg leading-relaxed whitespace-pre-wrap ${
                      isSentinel
                        ? 'bg-muted/50 border border-border text-foreground font-mono text-xs'
                        : 'bg-accent text-accent-foreground font-sans'
                    }`}
                  >
                    {msg.text}
                    <div className="text-[10px] text-muted-foreground/80 mt-1.5 text-right font-mono">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh */}
          <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex flex-wrap gap-1.5 text-[11px] font-mono">
            <span className="text-muted-foreground py-0.5">Hỏi nhanh:</span>
            {[
              'Con AI nào đang phản hồi nhanh nhất?',
              'Có lỗi nào nghiêm trọng không?',
              'Làm sao để hệ thống chạy hoàn toàn miễn phí?',
              'Kiểm tra lại tác vụ Chấm bài viết',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setInputQuery(q);
                }}
                className="tap px-2 py-0.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Ô nhập lệnh / câu hỏi */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Nhập câu hỏi hoặc yêu cầu cho Elio Sentinel (VD: Tối ưu lại model cho tôi)..."
              className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-mono"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="tap px-4 py-2 rounded-lg bg-accent text-accent-foreground font-mono text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

/**
 * Hàm sinh chuỗi báo cáo điều hành dạng Markdown
 */
function generateExecutiveReportText({
  stats,
  aiConfigs,
  aiAssignments,
  aiMonitorResults,
  detectedIssues,
  lastScannedAt,
}) {
  const timeStr = lastScannedAt
    ? lastScannedAt.toLocaleString('vi-VN')
    : new Date().toLocaleString('vi-VN');

  return `# BÁO CÁO ĐIỀU HÀNH HẠ TẦNG TRÍ TUỆ NHÂN TẠO & RÀ SOÁT LỖI
**Hệ thống:** Sprachmeisterschaft (DeutschMaster A1-C2)
**Cơ quan giám sát:** Elio Sentinel · Chief AI Supervisor
**Thời điểm lập báo cáo:** ${timeStr}

---

## 1. CHỈ SỐ SỨC KHỎE HỆ THỐNG
- **Điểm sức khỏe tổng thể:** ${stats.healthScore}/100 điểm
- **Tổng số con AI đang vận hành:** ${stats.activeConfigs}/${stats.totalConfigs}
- **Số con AI hỗ trợ Vision (Đọc ảnh/PDF):** ${stats.visionConfigs}
- **Số tác vụ đã được phân công:** ${stats.assignedTasksCount}/${stats.totalTasks} tác vụ
- **Độ trễ trung bình toàn hệ thống:** ${stats.avgLatency ? `${stats.avgLatency}ms` : 'Chưa đo lường'}
- **Tổng số vấn đề phát hiện:** ${detectedIssues.length} (Gồm ${stats.criticalCount} lỗi nghiêm trọng)

---

## 2. DANH SÁCH CÁC CON AI TRONG HỆ THỐNG
${aiConfigs
  .map((c, idx) => {
    const mon = aiMonitorResults[c.id] || {};
    return `${idx + 1}. **${c.name}** (${c.provider.toUpperCase()})
   - Model chính: \`${c.model}\` | Model dự phòng: \`${c.backupModel || 'Chưa cài đặt'}\`
   - Đa phương thức: ${c.hasVision ? 'Có Vision' : 'Chỉ văn bản'}
   - Tình trạng kết nối: ${mon.status === 'online' ? '🟢 Hoạt động tốt' : '🔴 Sự cố/Chưa kiểm tra'}
   - Độ trễ: ${mon.latency ? `${mon.latency}ms` : '---'}`;
  })
  .join('\n\n')}

---

## 3. CÁC LỖI & ĐIỂM NGHẼN RÀ SOÁT ĐƯỢC
${
  detectedIssues.length === 0
    ? '✅ Không phát hiện lỗi nào. Hệ thống đạt trạng thái lý tưởng.'
    : detectedIssues
        .map(
          (i, idx) =>
            `${idx + 1}. [${i.level.toUpperCase()}] **${i.title}**\n   - Phân loại: ${i.category}\n   - Chi tiết: ${i.desc}`
        )
        .join('\n\n')
}

---

## 4. KHUYẾN NGHỊ TỐI ƯU TỪ CHIEF AI SUPERVISOR
1. Ưu tiên sử dụng Gemini 2.5 Flash cho các tác vụ Vision & OCR đề thi (Free tier 15 RPM).
2. Tận dụng Groq (Llama 3.3 70B) cho đàm thoại Elio để đạt tốc độ tức thì 300 token/s.
3. Luôn cấu hình Backup Model cho tất cả các con AI để đảm bảo cơ chế chuyển mạch tự động không bị đứt đoạn.
`;
}

export default AdminReportsTab;
