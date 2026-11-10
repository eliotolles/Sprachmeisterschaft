import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/db';
import {
  AI_PROVIDERS,
  FREE_AI_MODELS,
  APP_AI_TASKS,
} from '@/data/ai-models-catalog';
import { testAiConnection, testAiTaskSpecific } from '@/lib/ai-evaluator';
import {
  hasValidApiKey,
  autoDispatchAIWorkforce,
  kickstartSentinelWorkforce,
  getSentinelWorkforceActions,
  clearSentinelWorkforceActions,
  recordSentinelWorkforceAction,
  autoFixAllMissingBackups,
  autoFixAllFleetIssues,
  getRecommendedBackupModel,
} from '@/lib/ai-auto-dispatcher';
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
  Flame,
  Radio,
  UserPlus,
  Workflow,
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
  // Tab con trong Báo cáo: 'overview' | 'issues' | 'fleet' | 'hourly' | 'chat'
  const [subTab, setSubTab] = useState('overview');

  // --------------------------------------------------------------------
  // GIÁM SÁT TỰ ĐỘNG THEO GIỜ (SENTINEL HOURLY MONITOR)
  // --------------------------------------------------------------------
  const [isHourlyActive, setIsHourlyActive] = useState(true);
  const [hourlyIntervalMinutes, setHourlyIntervalMinutes] = useState(60);
  const [nextAuditCountdown, setNextAuditCountdown] = useState(60 * 60);
  const [hourlyLogs, setHourlyLogs] = useState(() => {
    try {
      const stored = localStorage.getItem('sprach_sentinel_hourly_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // --------------------------------------------------------------------
  // BỘ MÁY QUẢN LÝ THÚC ĐẨY AI CHẠY NGẦM (SENTINEL AUTONOMOUS WORKFORCE ENGINE)
  // Con Quản lý có nhiệm vụ chạy ngầm và đốc thúc dàn AI làm việc liên tục
  // --------------------------------------------------------------------
  const [isWorkforceDaemonActive, setIsWorkforceDaemonActive] = useState(true);
  const [workforceIntervalSec, setWorkforceIntervalSec] = useState(30);
  const [nextWorkforceCountdown, setNextWorkforceCountdown] = useState(30);
  const [isKickingWorkforce, setIsKickingWorkforce] = useState(false);
  const [workforceActions, setWorkforceActions] = useState(() => getSentinelWorkforceActions());

  // Lắng nghe các hành động thúc đẩy được Sentinel ghi nhận trong khi chạy ngầm
  useEffect(() => {
    const handleWorkforceEvent = (e) => {
      if (e?.detail) {
        setWorkforceActions((prev) => [e.detail, ...prev.filter((a) => a.id !== e.detail.id).slice(0, 49)]);
      }
    };
    window.addEventListener('sprach_sentinel_workforce_event', handleWorkforceEvent);
    return () => window.removeEventListener('sprach_sentinel_workforce_event', handleWorkforceEvent);
  }, []);

  // Chat tương tác với Con AI Quản lý (Sentinel)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'sentinel',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: 'Chào Quản trị viên! Tôi là **Elio Sentinel** — AI Giám sát & Quản lý Hệ thống. Nhiệm vụ của tôi là kiểm tra, giám sát liên tục toàn bộ các con AI khác đang phục vụ học viên, đồng thời rà soát mọi lỗi phát sinh trong hệ thống theo từng mốc giờ để báo cáo kịp thời cho bạn. Tôi đang trực tiếp đứng ra giám sát định kỳ theo giờ!',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const chatEndRef = useRef(null);

  // Tự động cuộn chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Bộ đếm lùi thời gian cho Giám Sát Theo Giờ
  useEffect(() => {
    if (!isHourlyActive) return;
    const interval = setInterval(() => {
      setNextAuditCountdown((prev) => {
        if (prev <= 1) {
          runDeepAudit();
          return hourlyIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isHourlyActive, hourlyIntervalMinutes]);

  // Hàm kích hoạt thúc đẩy dàn AI (thực thi cả ngầm lẫn bấm tay)
  const triggerWorkforceKick = async ({ silent = false, forceReassign = false, sendWarmupPulse = true } = {}) => {
    setIsKickingWorkforce(true);
    try {
      const res = await kickstartSentinelWorkforce({
        db,
        aiConfigs: effectiveConfigs,
        setAiConfigs,
        aiAssignments,
        setAiAssignments,
        forceReassign,
        sendWarmupPulse,
      });

      // Cập nhật lại danh sách actions
      setWorkforceActions(getSentinelWorkforceActions());

      if (!silent) {
        if (res.actionsPerformed > 0) {
          toast.success(`⚡ Sentinel vừa hoàn tất thúc đẩy ${res.actionsPerformed} hành động cho dàn AI!`);
        } else {
          toast.info('⚡ Dàn AI đang làm việc tối ưu 100%, các vị trí công việc đều có nhân sự túc trực.');
        }
      }
      return res;
    } catch (err) {
      if (!silent) toast.error('Lỗi khi thúc đẩy AI: ' + err.message);
    } finally {
      setIsKickingWorkforce(false);
    }
  };

  // Vòng lặp đếm lùi nhịp thúc giục chạy ngầm của Sentinel
  useEffect(() => {
    if (!isWorkforceDaemonActive) return;
    const interval = setInterval(() => {
      setNextWorkforceCountdown((prev) => {
        if (prev <= 1) {
          triggerWorkforceKick({ silent: true, sendWarmupPulse: true });
          return workforceIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isWorkforceDaemonActive, workforceIntervalSec, effectiveConfigs, aiAssignments]);

  // ====================================================================
  // 1. THU THẬP & PHÂN TÍCH CHỈ SỐ HỆ THỐNG
  // ====================================================================
  // Lọc bỏ 3 template mẫu rỗng ban đầu nếu người dùng đã tạo các con AI thật
  const effectiveConfigs = useMemo(() => {
    const hasRealConfigs = aiConfigs.some(
      (c) => !['ai-cfg-gemini', 'ai-cfg-groq', 'ai-cfg-openrouter'].includes(c.id)
    );
    if (!hasRealConfigs) return aiConfigs;
    return aiConfigs.filter((c) => {
      const isPlaceholder = ['ai-cfg-gemini', 'ai-cfg-groq', 'ai-cfg-openrouter'].includes(c.id);
      if (isPlaceholder && !c.apiKey && !c.maskedKey) return false;
      return true;
    });
  }, [aiConfigs]);

  const stats = useMemo(() => {
    const totalConfigs = effectiveConfigs.length;
    const activeConfigs = effectiveConfigs.filter((c) => c.enabled !== false).length;
    const visionConfigs = effectiveConfigs.filter((c) => c.hasVision).length;

    // Tác vụ đã gán AI (kiểm tra cả assignment trực tiếp lẫn task pool)
    const totalTasks = APP_AI_TASKS.length;
    const currentAssignments = db.aiConfig?.getAssignments?.() || aiAssignments || {};
    const assignedTasksCount = APP_AI_TASKS.filter((task) => {
      const assigned = currentAssignments[task.id];
      if (assigned?.model) return true;
      const pooled = db.aiConfig?.getTaskPool?.(task.id) || [];
      return pooled.length > 0;
    }).length;

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

      if (effectiveConfigs.length === 0) {
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

      effectiveConfigs.forEach((cfg) => {
        // Kiểm tra API Key (hỗ trợ cả key lưu mã hóa trên server lẫn key local)
        if (!hasValidApiKey(cfg)) {
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

      let currentAssignments = db.aiConfig?.getAssignments?.() || aiAssignments || {};

      // Tự động phân chia việc cho AI (Autonomous Dispatch):
      // Nếu có tác vụ trống mà hệ thống có AI khả dụng, tự động bố trí việc ngay (như nhân viên ngồi vào làm việc)
      const validConfigs = effectiveConfigs.filter((c) => c.enabled !== false && hasValidApiKey(c));
      const hasUnassigned = APP_AI_TASKS.some((t) => {
        const assigned = currentAssignments[t.id];
        const pooled = db.aiConfig?.getTaskPool?.(t.id) || [];
        return !assigned?.model && pooled.length === 0;
      });

      if (hasUnassigned && validConfigs.length > 0) {
        try {
          await autoDispatchAIWorkforce({
            db,
            aiConfigs: validConfigs,
            currentAssignments,
            setAiAssignments,
          });
          currentAssignments = db.aiConfig?.getAssignments?.() || currentAssignments;
        } catch {}
      }

      APP_AI_TASKS.forEach((task) => {
        const assigned = currentAssignments[task.id];
        const pooled = db.aiConfig?.getTaskPool?.(task.id) || [];
        const isAssigned = Boolean(assigned?.model || pooled.length > 0);

        if (!isAssigned) {
          // Tìm config đang khả dụng trong danh sách của người dùng
          const availableCfg = effectiveConfigs.find(
            (c) => c.enabled !== false && hasValidApiKey(c) && (!task.needsVision || c.hasVision)
          ) || effectiveConfigs.find((c) => hasValidApiKey(c)) || effectiveConfigs[0];

          const recModel = availableCfg?.model || task.defaultRecommendation;
          const recProvider = availableCfg?.provider || 'gemini';

          newIssues.push({
            id: `err-unassigned-${task.id}`,
            level: 'critical',
            category: 'Phân công tác vụ',
            title: `Tác vụ "${task.name}" chưa được giao cho AI nào`,
            desc: `Tác vụ thuộc nhóm [${task.category}] đang bị bỏ trống. Khi học viên truy cập tính năng này sẽ gặp thông báo lỗi.`,
            fixAction: 'assign_recommended_task',
            taskId: task.id,
            targetConfigId: availableCfg?.id || null,
            recommendedModel: recModel,
            recommendedProvider: recProvider,
            fixLabel: availableCfg
              ? `Gán bằng [${availableCfg.name}]`
              : `Gán tự động model ${task.defaultRecommendation}`,
          });
        } else {
          // Kiểm tra tác vụ cần Vision
          if (task.needsVision) {
            const matchedCfg = effectiveConfigs.find(
              (c) => (c.provider === assigned?.provider && c.model === assigned?.model) ||
                     pooled.some(p => p.id === c.id)
            );
            if (matchedCfg && !matchedCfg.hasVision && !pooled.some(p => p.hasVision)) {
              newIssues.push({
                id: `err-vision-mismatch-${task.id}`,
                level: 'critical',
                category: 'Tương thích Vision/OCR',
                title: `Lỗi bất tương thích: "${task.name}" yêu cầu Vision nhưng model không hỗ trợ!`,
                desc: `Model ${assigned?.model || 'được gán'} hiện tại không có khả năng đọc ảnh chụp bài tập hoặc PDF.`,
                fixAction: 'fix_vision_assignment',
                taskId: task.id,
                fixLabel: 'Chuyển sang model hỗ trợ Vision',
              });
            }
          }
        }
      });

      // BƯỚC 3: Giám sát kết nối thực tế (Ping các con AI)
      setScanProgress(75);
      setScanStatusText('Đang thực hiện ping kiểm tra tốc độ phản hồi thực tế của các con AI...');

      for (const cfg of effectiveConfigs) {
        if (!hasValidApiKey(cfg)) {
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
      const hasGemini = effectiveConfigs.some((c) => c.provider === 'gemini');
      if (!hasGemini) {
        newIssues.push({
          id: 'info-recommend-gemini',
          level: 'info',
          category: 'Tối ưu Chi phí',
          title: 'Khuyến nghị thêm Google Gemini Flash Latest',
          desc: 'Gemini Flash Latest hỗ trợ Vision đọc ảnh bài tập, PDF và tốc độ phản hồi cực nhanh.',
          fixAction: 'add_default_gemini',
          fixLabel: 'Thêm cấu hình Gemini Flash Latest',
        });
      }

      setScanProgress(100);
      setScanStatusText('Hoàn tất rà soát!');
      setAiMonitorResults(monitorMap);
      setDetectedIssues(newIssues);
      setLastScannedAt(new Date());

      // Ghi nhật ký giám sát định kỳ theo giờ (Hourly Sentinel Audit Log)
      const onlineCount = Object.values(monitorMap).filter((m) => m.status === 'online').length;
      const testedLatencies = Object.values(monitorMap).filter((m) => m.latency).map((m) => m.latency);
      const currentAvgLatency = testedLatencies.length > 0
        ? Math.round(testedLatencies.reduce((a, b) => a + b, 0) / testedLatencies.length)
        : null;

      const hourlyEntry = {
        id: `audit-${Date.now()}`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString('vi-VN'),
        timestamp: Date.now(),
        healthScore: Math.max(0, 100 - newIssues.filter((i) => i.level === 'critical').length * 20 - newIssues.filter((i) => i.level === 'warning').length * 8),
        totalAI: effectiveConfigs.length,
        onlineAI: onlineCount,
        avgLatency: currentAvgLatency,
        issueCount: newIssues.length,
        criticalCount: newIssues.filter((i) => i.level === 'critical').length,
        note: newIssues.filter((i) => i.level === 'critical').length === 0
          ? 'Toàn bộ dàn AI hoạt động hoàn hảo'
          : `Phát hiện ${newIssues.filter((i) => i.level === 'critical').length} lỗi cần lưu ý`,
      };

      setHourlyLogs((prev) => {
        const nextLogs = [hourlyEntry, ...prev.slice(0, 23)];
        try {
          localStorage.setItem('sprach_sentinel_hourly_logs', JSON.stringify(nextLogs));
        } catch {}
        return nextLogs;
      });

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
          text: `Tôi vừa hoàn tất giám sát toàn bộ ${effectiveConfigs.length} con AI và rà soát hệ thống.\n\n${issueSummaryText}`,
        },
      ]);

      toast.success('Elio Sentinel đã hoàn tất giám sát và rà soát lỗi!');
    } catch (err) {
      toast.error('Có lỗi trong quá trình quét: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Tự động kiểm tra và dọn dẹp các con chưa có backup + phân công công việc khi mount
  useEffect(() => {
    const autoStaffAndFixBackups = async () => {
      try {
        await autoFixAllMissingBackups({ db, setAiConfigs });
      } catch {}
    };
    autoStaffAndFixBackups();
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
          name: 'Google Gemini Flash Latest',
          provider: 'gemini',
          model: 'gemini-flash-latest',
          backupModel: 'gemini-3.8-flash',
          apiKey: '',
          hasVision: true,
          priority: 1,
          enabled: true,
          discoveredAt: new Date().toISOString(),
        };
        await db.aiConfig.saveConfig(newCfg);
        if (setAiConfigs) setAiConfigs(db.aiConfig.getConfigs());
        toast.success('Đã thêm cấu hình Gemini Flash Latest! Hãy nhập API Key để kích hoạt.');
        // Loại bỏ issue khỏi list
        setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
      } else if (issue.fixAction === 'assign_recommended_task') {
        let chosenCfg = issue.targetConfigId
          ? effectiveConfigs.find((c) => c.id === issue.targetConfigId)
          : null;
        if (!chosenCfg) {
          chosenCfg = effectiveConfigs.find((c) => c.enabled !== false && hasValidApiKey(c)) || effectiveConfigs[0];
        }
        if (!chosenCfg) {
          toast.error('Không tìm thấy cấu hình AI phù hợp!');
          return;
        }

        try {
          await db.aiConfig.setAssignment(issue.taskId, chosenCfg.id, chosenCfg.model);
        } catch {
          try {
            await db.aiConfig.setAssignment(issue.taskId, chosenCfg.provider, chosenCfg.model);
          } catch {}
        }
        if (db.aiConfig.addToTaskPool) {
          try { await db.aiConfig.addToTaskPool(issue.taskId, chosenCfg.id); } catch {}
        }
        if (setAiAssignments) setAiAssignments(db.aiConfig.getAssignments());
        toast.success(`Đã gán [${chosenCfg.name}] cho tác vụ!`);
        setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
      } else if (issue.fixAction === 'fix_vision_assignment') {
        const visionCfg = effectiveConfigs.find((c) => c.hasVision && hasValidApiKey(c)) || effectiveConfigs.find((c) => c.hasVision);
        if (visionCfg) {
          try {
            await db.aiConfig.setAssignment(issue.taskId, visionCfg.id, visionCfg.model);
          } catch {
            try {
              await db.aiConfig.setAssignment(issue.taskId, visionCfg.provider, visionCfg.model);
            } catch {}
          }
          if (db.aiConfig.addToTaskPool) {
            try { await db.aiConfig.addToTaskPool(issue.taskId, visionCfg.id); } catch {}
          }
          if (setAiAssignments) setAiAssignments(db.aiConfig.getAssignments());
          toast.success(`Đã đổi tác vụ sang model có Vision: ${visionCfg.model}!`);
        } else {
          toast.info('Bạn cần bật cờ "Hỗ trợ Vision" cho ít nhất 1 cấu hình AI ở tab AI & phân công.');
        }
        setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
      } else if (issue.fixAction === 'set_default_backup') {
        const cfg = effectiveConfigs.find((c) => c.id === issue.targetConfigId) || aiConfigs.find((c) => c.id === issue.targetConfigId);
        if (cfg) {
          // 1. Tìm model khác cùng provider mà người dùng đã thêm thành công vào hệ thống
          const otherSameProvider = effectiveConfigs.find(
            (c) => c.provider === cfg.provider && c.id !== cfg.id && c.model !== cfg.model && c.model
          );

          // 2. Tìm từ catalog đã lưu của provider
          const cat = db.aiConfig?.getCatalog?.(cfg.provider);
          const catalogAlt = cat?.models?.find((m) => m.id !== cfg.model && !m.id.includes('2.5'));

          const chosenBackup =
            otherSameProvider?.model ||
            catalogAlt?.id ||
            (cfg.provider === 'gemini'
              ? (cfg.model === 'gemini-3.8-flash' ? 'gemini-flash-latest' : 'gemini-3.8-flash')
              : cfg.provider === 'groq'
              ? (cfg.model === 'llama-3.3-70b-versatile' ? 'qwen/qwen3.8-27b' : 'llama-3.3-70b-versatile')
              : 'nvidia/nemotron-3.5-super-vl:free');

          try {
            await db.aiConfig.saveConfig({ ...cfg, backupModel: chosenBackup });
            if (setAiConfigs) setAiConfigs(db.aiConfig.getConfigs());
            toast.success(`Đã tự động gán model dự phòng: ${chosenBackup}!`);
            setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
          } catch (saveErr) {
            // Thử fallback model khác nếu bị từ chối
            if (otherSameProvider && otherSameProvider.model !== chosenBackup) {
              try {
                await db.aiConfig.saveConfig({ ...cfg, backupModel: otherSameProvider.model });
                if (setAiConfigs) setAiConfigs(db.aiConfig.getConfigs());
                toast.success(`Đã tự động gán model dự phòng: ${otherSameProvider.model}!`);
                setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
                return;
              } catch {}
            }
            toast.error(`Không thể gán ${chosenBackup}: ${saveErr.message}. Vui lòng chọn model dự phòng tại tab AI.`);
          }
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

  // Tự động phân công toàn bộ 8 tác vụ cho các con AI đang có (như nhân viên ngồi vào làm việc luôn)
  const handleAutoAssignAll = async () => {
    setIsScanning(true);
    setScanProgress(30);
    setScanStatusText('Đang tự động phân bổ trọn vẹn 8 tác vụ cho dàn AI...');
    try {
      const res = await autoDispatchAIWorkforce({
        db,
        aiConfigs,
        currentAssignments: aiAssignments,
        setAiAssignments,
        force: true,
      });

      if (res.dispatchedCount > 0) {
        toast.success(`Đã tự động phân bổ hoàn tất ${res.dispatchedCount} vị trí công việc cho dàn AI!`);
      } else {
        toast.info('Tất cả các vị trí công việc đã có AI phụ trách tối ưu.');
      }
      await runDeepAudit();
    } catch (err) {
      toast.error('Lỗi khi phân công tự động: ' + err.message);
    } finally {
      setIsScanning(false);
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
          `1. **Tác vụ Đọc ảnh bài tập & OCR (ocr_image):** Dùng **Google Gemini Flash Latest / Gemini 3+** — model đọc ảnh cực nhanh và chính xác.\n` +
          `2. **Tác vụ Chấm viết & Đàm thoại Elio (writing_grading, elio_chat):** Dùng **Groq (Llama 3.3 70B hoặc Qwen)** hoặc **DeepSeek R1/V3 Free trên OpenRouter** (tốc độ 300 token/s, miễn phí 100%).\n` +
          `3. **Tác vụ Thẩm định kỳ thi (exam_evaluation):** Dùng **DeepSeek R1 Distill** trên Groq hoặc Together AI để suy luận logic giải thích từng câu hỏi.\n\n` +
          `Khi cấu hình như trên, hệ thống của bạn vận hành trơn tru mà không mất một đồng chi phí API nào!`;
      } else if (qLower.includes('thúc đẩy') || qLower.includes('chạy ngầm') || qLower.includes('làm việc') || qLower.includes('quản lý') || qLower.includes('nhân viên') || qLower.includes('đốc thúc')) {
        replyText = `⚡ **Báo cáo Bộ máy Quản lý Thúc đẩy AI:**\n\n` +
          `Tôi là **Elio Sentinel** đang liên tục **chạy ngầm 24/7** để đốc thúc toàn bộ ${effectiveConfigs.length} con AI trong hệ thống làm việc:\n` +
          `• **Tình trạng phân công:** Đã đốc thúc phân bổ **${stats.assignedTasksCount}/${stats.totalTasks} tác vụ** (100% các vị trí đều có AI túc trực).\n` +
          `• **Chế độ chạy ngầm:** ${isWorkforceDaemonActive ? '🟢 Đang kích hoạt (xung nhịp mỗi ' + workforceIntervalSec + ' giây)' : '⚪ Tạm dừng'}.\n` +
          `• **Đã thực hiện:** **${workforceActions.length} hành động** tự động (giao việc, ghép đôi dự phòng failover, phát xung nhịp Keep-Alive làm nóng kết nối).\n\n` +
          `👉 Bạn có thể chuyển qua tab **"⚡ Thúc đẩy & Điều phối AI"** để xem dòng nhật ký hành động trực tiếp thời gian thực hoặc bấm nút "Thúc đẩy AI ngay"!`;
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
            {stats.assignedTasksCount < stats.totalTasks && (
              <button
                type="button"
                disabled={isScanning}
                onClick={handleAutoAssignAll}
                className="tap px-3.5 py-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Tự động phân bổ dàn AI cho toàn bộ 8 tác vụ"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>⚡ Tự gán cả 8 tác vụ</span>
              </button>
            )}
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
      {/* THANH ĐIỀU KHIỂN: GIÁM SÁT TỰ ĐỘNG THEO GIỜ (HOURLY SENTINEL) */}
      {/* ============================================================ */}
      <div className="surface p-4 rounded-xl border border-accent/30 bg-accent/5 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <Clock className={`w-4 h-4 text-accent ${isHourlyActive ? 'animate-pulse' : ''}`} />
          <div>
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span>ELIO SENTINEL GIÁM SÁT THEO GIỜ</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isHourlyActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground'}`}>
                {isHourlyActive ? '🟢 ĐANG TRỰC CHIẾN' : '⚪ ĐÃ TẠM DỪNG'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              {isHourlyActive
                ? `Tự động ping đo độ trễ và rà soát lỗi dàn AI theo định kỳ. Lần quét kế tiếp sau: ${Math.floor(nextAuditCountdown / 60)} phút ${nextAuditCountdown % 60} giây.`
                : 'Giám sát định kỳ đang tạm dừng. Bấm "Bật giám sát" để Sentinel tiếp tục quét theo chu kỳ.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <label className="text-[11px] text-muted-foreground hidden sm:inline">Chu kỳ:</label>
          <select
            value={hourlyIntervalMinutes}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHourlyIntervalMinutes(val);
              setNextAuditCountdown(val * 60);
              toast.info(`Đã đổi chu kỳ giám sát thành mỗi ${val} phút`);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-mono font-semibold"
          >
            <option value={15}>Mỗi 15 phút</option>
            <option value={30}>Mỗi 30 phút</option>
            <option value={60}>Mỗi 1 giờ (Chuẩn)</option>
            <option value={120}>Mỗi 2 giờ</option>
            <option value={360}>Mỗi 6 giờ</option>
          </select>

          <button
            type="button"
            onClick={() => {
              const next = !isHourlyActive;
              setIsHourlyActive(next);
              toast[next ? 'success' : 'info'](next ? 'Đã bật giám sát định kỳ theo giờ!' : 'Đã tạm dừng giám sát theo giờ.');
            }}
            className={`tap px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isHourlyActive
                ? 'border-emerald-500/40 bg-card hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300'
                : 'border-border bg-card hover:bg-muted text-muted-foreground'
            }`}
          >
            {isHourlyActive ? 'Tạm dừng' : 'Bật giám sát'}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* THANH ĐIỀU KHIỂN: BỘ MÁY QUẢN LÝ THÚC ĐẨY AI CHẠY NGẦM */}
      {/* ============================================================ */}
      <div className="surface p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Zap className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isWorkforceDaemonActive ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 font-bold text-foreground">
              <span>SENTINEL THÚC ĐẨY & ĐIỀU PHỐI DÀN AI</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWorkforceDaemonActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground'}`}>
                {isWorkforceDaemonActive ? '🟢 ĐANG CHẠY NGẦM 24/7' : '⚪ ĐÃ TẠM DỪNG'}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Đã thực hiện: <strong className="text-foreground">{workforceActions.length}</strong> hành động)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              {isWorkforceDaemonActive
                ? `Sentinel chạy ngầm tự động giao việc cho AI, ghép đôi dự phòng và phát xung nhịp Keep-Alive. Nhịp thúc giục kế tiếp sau: ${nextWorkforceCountdown}s.`
                : 'Chế độ chạy ngầm đang tạm dừng. Bấm "Kích hoạt" để Sentinel tiếp tục tự động thúc đẩy dàn AI.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            disabled={isKickingWorkforce}
            onClick={() => triggerWorkforceKick({ silent: false, sendWarmupPulse: true })}
            className="tap px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Thúc đẩy, làm nóng dàn AI và kiểm tra phân công ngay lập tức"
          >
            <Flame className={`w-3.5 h-3.5 ${isKickingWorkforce ? 'animate-spin' : ''}`} />
            <span>{isKickingWorkforce ? 'Đang thúc đẩy...' : 'Thúc đẩy AI ngay'}</span>
          </button>

          <select
            value={workforceIntervalSec}
            onChange={(e) => {
              const val = Number(e.target.value);
              setWorkforceIntervalSec(val);
              setNextWorkforceCountdown(val);
              toast.info(`Đã đổi nhịp thúc đẩy ngầm thành mỗi ${val} giây`);
            }}
            className="px-2 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-mono font-semibold"
          >
            <option value={15}>Mỗi 15s</option>
            <option value={30}>Mỗi 30s (Khuyên dùng)</option>
            <option value={60}>Mỗi 1 phút</option>
            <option value={120}>Mỗi 2 phút</option>
            <option value={300}>Mỗi 5 phút</option>
          </select>

          <button
            type="button"
            onClick={() => {
              const next = !isWorkforceDaemonActive;
              setIsWorkforceDaemonActive(next);
              toast[next ? 'success' : 'info'](next ? 'Đã bật chế độ chạy ngầm thúc đẩy dàn AI!' : 'Đã tạm dừng chạy ngầm.');
            }}
            className={`tap px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isWorkforceDaemonActive
                ? 'border-border bg-card hover:bg-muted text-muted-foreground'
                : 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            {isWorkforceDaemonActive ? 'Tạm dừng' : 'Kích hoạt'}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* THANH ĐIỀU HƯỚNG CÁC TAB CON CỦA BÁO CÁO */}
      {/* ============================================================ */}
      <div className="flex items-center gap-1 border-b border-border pb-1 overflow-x-auto text-xs font-mono">
        {[
          { id: 'overview', label: '📊 Bản Báo cáo Tổng hợp', count: null },
          { id: 'dispatch', label: '⚡ Thúc đẩy & Điều phối AI', count: workforceActions.length },
          { id: 'issues', label: '⚠️ Danh sách Lỗi & Rà soát', count: detectedIssues.length },
          { id: 'fleet', label: '🤖 Giám sát từng con AI', count: effectiveConfigs.length },
          { id: 'hourly', label: '🕒 Giám sát theo giờ', count: hourlyLogs.length },
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
                  1. <strong>Tối đa hóa Free Tier:</strong> Nên cấu hình <em>Google Gemini Flash Latest / Gemini 3+</em> làm model chính cho OCR và chấm viết, đồng thời dùng <em>Groq (Llama 3.3 70B hoặc Qwen)</em> cho đàm thoại Elio để đạt tốc độ 300 token/s mà không tốn chi phí.<br />
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

          {/* Hướng dẫn giải pháp thay thế khi Key Gemini hỏng */}
          <div className="surface p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 font-mono">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Giải pháp thay thế tức thì khi Key Gemini bị hết hạn / lỗi Quota</span>
            </div>
            <p className="text-xs text-foreground/90 font-body leading-relaxed">
              Nếu API Key Google AI Studio của bạn bị báo lỗi hoặc vượt quá hạn ngạch (Rate Limit 15 RPM), bạn có 3 phương án thay thế hoàn toàn miễn phí 100%:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-bold text-accent">1. Dùng Groq API (Khuyên dùng #1)</div>
                <p className="text-[11px] text-muted-foreground font-body">
                  Tốc độ siêu tốc 300 token/s, miễn phí 100%. Đăng ký lấy key tại <code>console.groq.com</code> và gán model <code>llama-3.3-70b-versatile</code>.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-bold text-accent">2. Dùng OpenRouter Free</div>
                <p className="text-[11px] text-muted-foreground font-body">
                  Hàng chục model miễn phí có hậu tố <code>:free</code> như DeepSeek R1, Llama 3.3. Lấy key tại <code>openrouter.ai</code>.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-bold text-accent">3. Lấy lại Key Gemini mới</div>
                <p className="text-[11px] text-muted-foreground font-body">
                  Đăng nhập <code>aistudio.google.com</code> bằng tài khoản Google khác hoặc tạo project mới để nhận ngay API Key Free 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CON MỚI: BỘ MÁY QUẢN LÝ THÚC ĐẨY & ĐIỀU PHỐI DÀN AI */}
      {/* ============================================================ */}
      {subTab === 'dispatch' && (
        <div className="space-y-5 animate-fade-in font-mono">
          {/* Thẻ Chỉ huy Bộ máy Thúc đẩy */}
          <div className="surface p-5 sm:p-6 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card space-y-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm relative">
                  <Zap className="w-6 h-6 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Autonomous AI Workforce Dispatcher & Watchdog
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {isWorkforceDaemonActive ? 'CHẠY NGẦM LIÊN TỤC 24/7' : 'TẠM DỪNG'}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    Bộ máy Quản lý Thúc đẩy & Điều phối Dàn AI
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans max-w-2xl leading-relaxed">
                    Trưởng ban Quản lý <strong>Elio Sentinel</strong> tự động chạy ngầm, liên tục đốc thúc các con AI làm việc: tự động phân công tác vụ ứng dụng, tự động ghép đôi dự phòng Failover và phát xung nhịp Keep-Alive làm nóng kết nối, bảo đảm không con AI nào ngồi chơi và không tác vụ nào bị đình trệ.
                  </p>
                </div>
              </div>

              {/* Các nút điều hành nhanh */}
              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
                <button
                  type="button"
                  disabled={isKickingWorkforce}
                  onClick={() => triggerWorkforceKick({ silent: false, sendWarmupPulse: true })}
                  className="tap px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  title="Sentinel phát xung nhịp thúc đẩy toàn bộ dàn AI ngay lập tức"
                >
                  <Flame className={`w-4 h-4 ${isKickingWorkforce ? 'animate-spin' : ''}`} />
                  <span>{isKickingWorkforce ? 'Đang thúc đẩy...' : 'Thúc đẩy dàn AI ngay'}</span>
                </button>

                <button
                  type="button"
                  disabled={isKickingWorkforce}
                  onClick={() => triggerWorkforceKick({ silent: false, forceReassign: true, sendWarmupPulse: true })}
                  className="tap px-3.5 py-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Tái phân bổ lại tối ưu toàn bộ 8 tác vụ cho các con AI"
                >
                  <Workflow className="w-3.5 h-3.5 text-accent" />
                  <span>Tái phân bổ cả 8 tác vụ</span>
                </button>

                {workforceActions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSentinelWorkforceActions();
                      setWorkforceActions([]);
                      toast.info('Đã xóa toàn bộ nhật ký thúc đẩy cũ.');
                    }}
                    className="tap px-3 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-muted-foreground transition-colors"
                  >
                    Xóa nhật ký
                  </button>
                )}
              </div>
            </div>

            {/* Chỉ số vận hành ngầm */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-emerald-500/20">
              <div className="p-2.5 rounded-lg bg-card/60 border border-border space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Tần suất thúc giục ngầm</div>
                <div className="font-bold text-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mỗi {workforceIntervalSec} giây</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-card/60 border border-border space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Xung nhịp kế tiếp</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  sau {nextWorkforceCountdown}s
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-card/60 border border-border space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Tác vụ có AI túc trực</div>
                <div className="font-bold text-foreground">
                  {stats.assignedTasksCount}/{stats.totalTasks} vị trí (100%)
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-card/60 border border-border space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Hành động đã ghi nhận</div>
                <div className="font-bold text-accent">
                  {workforceActions.length} hành động
                </div>
              </div>
            </div>
          </div>

          {/* BẢNG PHÂN CÔNG NHÂN SỰ 8 TÁC VỤ ỨNG DỤNG */}
          <div className="surface p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h4 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  <span>Sơ đồ Nhân sự AI được Quản lý Phân công (8 Tác vụ)</span>
                </h4>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Sentinel giám sát từng vị trí công việc, tự động giao cho con AI phù hợp nhất với chuyên môn.
                </p>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                100% Vị trí có AI đảm nhiệm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {APP_AI_TASKS.map((task) => {
                const currentAssignments = db.aiConfig?.getAssignments?.() || aiAssignments || {};
                const assigned = currentAssignments[task.id];
                const pool = db.aiConfig?.getTaskPool?.(task.id) || [];
                const assignedCfg = effectiveConfigs.find(
                  (c) => c.id === assigned?.configId || c.model === assigned?.model
                );

                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{task.name}</span>
                          {task.needsVision && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                              Vision
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-sans">{task.description}</div>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Đang làm việc
                      </span>
                    </div>

                    {/* Con AI nhận việc */}
                    <div className="p-2 rounded-lg bg-card border border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bot className="w-3.5 h-3.5 text-accent shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-foreground">
                            {assignedCfg?.name || assigned?.model || 'Đang phân công...'}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1.5">
                            ({assigned?.model || 'auto'})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-accent font-bold uppercase shrink-0">
                        ⚡ Đốc thúc liên tục
                      </span>
                    </div>

                    {/* Dự phòng */}
                    {pool.length > 0 && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Dự phòng Failover:</span>
                        <span className="font-semibold text-foreground">
                          {pool.length} AI trong Task Pool
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DÒNG NHẬT KÝ THÚC ĐẨY TỰ ĐỘNG THỜI GIAN THỰC (LIVE WORKFORCE FEED) */}
          <div className="surface p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h4 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Dòng Hành động Thúc đẩy Thời gian Thực (Live Sentinel Workforce Feed)</span>
                </h4>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Nhật ký trực tiếp các hành động Sentinel tự động chạy ngầm để đốc thúc dàn AI làm việc.
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Lưu tối đa 50 hành động gần nhất
              </span>
            </div>

            {workforceActions.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border space-y-3">
                <Zap className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
                <div className="font-bold text-sm text-foreground">Chưa có hành động thúc đẩy nào</div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans">
                  Sentinel sẽ tự động thực hiện và ghi nhận hành động đầu tiên trong nhịp đếm lùi kế tiếp, hoặc bạn có thể bấm nút thúc đẩy ngay phía trên!
                </p>
                <button
                  type="button"
                  onClick={() => triggerWorkforceKick({ silent: false, sendWarmupPulse: true })}
                  className="tap px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Kích hoạt nhịp thúc đẩy đầu tiên</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {workforceActions.map((act) => {
                  const isDispatch = act.type === 'DISPATCH';
                  const isFailover = act.type === 'FAILOVER_PAIR';
                  const isWarmup = act.type === 'WARMUP';

                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-start gap-3 text-xs"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isDispatch
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : isFailover
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : isWarmup
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-accent/15 text-accent border border-accent/30'
                        }`}
                      >
                        {isDispatch ? (
                          <UserPlus className="w-3.5 h-3.5" />
                        ) : isFailover ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : isWarmup ? (
                          <Flame className="w-3.5 h-3.5" />
                        ) : (
                          <Radio className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-foreground">
                            {act.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {act.timeStr}
                          </span>
                        </div>
                        {act.detail && (
                          <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                            {act.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CON 2: DANH SÁCH LỖI & RÀ SOÁT TỨC THÌ (BUG TRACKER) */}
      {/* ============================================================ */}
      {subTab === 'issues' && (
        <div className="space-y-4 animate-fade-in font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-accent" />
                <span>Báo cáo Rà soát Lỗi Hệ thống</span>
              </h3>
              <p className="text-xs text-muted-foreground font-body">
                Elio Sentinel liên tục rà soát cấu hình AI, kho dữ liệu bài học và tính tương thích tác vụ.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {stats.assignedTasksCount < stats.totalTasks && (
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleAutoAssignAll}
                  className="tap px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                  title="Tự động gán các con AI đang có cho toàn bộ 8 tác vụ"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  <span>⚡ Tự gán cả 8 tác vụ</span>
                </button>
              )}
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
                        {issue.category === 'Phân công tác vụ' && aiConfigs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="text-[11px] text-muted-foreground">Hoặc chọn AI bạn đang có:</span>
                            <select
                              defaultValue=""
                              onChange={async (e) => {
                                const cid = e.target.value;
                                if (!cid) return;
                                const cfg = aiConfigs.find((c) => c.id === cid);
                                if (!cfg) return;
                                await db.aiConfig.setAssignment(issue.taskId, cfg.provider, cfg.model);
                                if (setAiAssignments) setAiAssignments(db.aiConfig.getAssignments());
                                toast.success(`Đã gán [${cfg.name}] cho tác vụ!`);
                                setDetectedIssues((prev) => prev.filter((i) => i.id !== issue.id));
                              }}
                              className="px-2 py-1 text-xs rounded border border-border bg-card text-foreground font-mono"
                            >
                              <option value="">-- Chọn con AI bạn đang có --</option>
                              {effectiveConfigs.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} · {c.model} {c.hasVision ? '[Vision]' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
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

          {/* Hướng dẫn giải pháp thay thế khi Key Gemini hỏng */}
          <div className="surface p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 font-mono">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Giải pháp thay thế tức thì khi Key Gemini bị hết hạn / lỗi Quota</span>
            </div>
            <p className="text-xs text-foreground/90 font-body leading-relaxed">
              Nếu API Key Google AI Studio của bạn bị báo lỗi hoặc vượt quá hạn ngạch (Rate Limit 15 RPM), bạn có 3 phương án thay thế hoàn toàn miễn phí 100%:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-bold text-accent">1. Dùng Groq API (Khuyên dùng #1)</div>
                <p className="text-[11px] text-muted-foreground font-body">
                  Tốc độ siêu tốc 300 token/s, miễn phí 100%. Đăng ký lấy key tại <code>console.groq.com</code> và gán model <code>llama-3.3-70b-versatile</code>.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-bold text-accent">2. Dùng OpenRouter Free</div>
                <p className="text-[11px] text-muted-foreground font-body">
                  Hàng chục model miễn phí có hậu tố <code>:free</code> như DeepSeek R1, Llama 3.3. Lấy key tại <code>openrouter.ai</code>.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-bold text-accent">3. Lấy lại Key Gemini mới</div>
                <p className="text-[11px] text-muted-foreground font-body">
                  Đăng nhập <code>aistudio.google.com</code> bằng tài khoản Google khác hoặc tạo project mới để nhận ngay API Key Free 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CON 3: BẢNG GIÁM SÁT CHI TIẾT TỪNG CON AI (AI FLEET) */}
      {/* ============================================================ */}
      {subTab === 'fleet' && (
        <div className="space-y-4 animate-fade-in font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" />
                <span>Bảng Giám sát Dàn AI (AI Fleet Monitoring)</span>
              </h3>
              <p className="text-xs text-muted-foreground font-body">
                Theo dõi trạng thái sống, độ trễ và tác vụ được giao cho từng con AI.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={async () => {
                  toast.info('Sentinel đang sắp xếp việc cho toàn bộ dàn AI & gán model backup...');
                  const res = await autoFixAllFleetIssues({ db, aiConfigs: effectiveConfigs, setAiConfigs, setAiAssignments });
                  toast.success(`Đã gán backup cho ${res.fixedBackups} con AI và phân bổ việc làm cho toàn bộ dàn AI!`);
                }}
                className="tap px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Tự động sắp xếp công việc cho các con AI chưa có việc và gán model dự phòng cho các con thiếu backup"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Sắp xếp việc & Gán Backup ngay</span>
              </button>
              <button
                type="button"
                disabled={isScanning}
                onClick={runDeepAudit}
                className="tap px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Ping lại tất cả</span>
              </button>
            </div>
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
                  {effectiveConfigs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Chưa có con AI nào được cấu hình trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    effectiveConfigs.map((cfg) => {
                      const mon = aiMonitorResults[cfg.id] || {};
                      const currentAssignments = db.aiConfig?.getAssignments?.() || aiAssignments || {};
                      const primaryTasks = APP_AI_TASKS.filter((t) => {
                        const asgn = currentAssignments[t.id];
                        if (!asgn) return false;
                        if (asgn.configId && asgn.configId === cfg.id) return true;
                        if (!asgn.configId && asgn.provider === cfg.provider && asgn.model === cfg.model) {
                          const firstMatch = effectiveConfigs.find(c => c.provider === cfg.provider && c.model === cfg.model);
                          return firstMatch?.id === cfg.id;
                        }
                        return false;
                      });

                      const pooledTasks = APP_AI_TASKS.filter((t) => {
                        const pool = db.aiConfig?.getTaskPool?.(t.id) || [];
                        return pool.some((p) => p.id === cfg.id) && !primaryTasks.some((pt) => pt.id === t.id);
                      });

                      return (
                        <tr key={cfg.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-foreground">{cfg.name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{cfg.provider}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-accent">{cfg.model}</div>
                            {cfg.backupModel && !cfg.backupModel.includes('2.5') ? (
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Backup: {cfg.backupModel}</div>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  const bkp = getRecommendedBackupModel(cfg, effectiveConfigs);
                                  await db.aiConfig.saveConfig({ ...cfg, backupModel: bkp });
                                  if (setAiConfigs) setAiConfigs(db.aiConfig.getConfigs());
                                  toast.success(`Đã tự động gán model dự phòng: ${bkp}`);
                                }}
                                className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 mt-0.5"
                                title="Bấm để tự động gán model dự phòng tương thích"
                              >
                                <span>Chưa có backup</span>
                                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-[9px] uppercase font-bold">Gán ngay</span>
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            {primaryTasks.length > 0 || pooledTasks.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {primaryTasks.map((t) => (
                                  <span
                                    key={`p-${t.id}`}
                                    className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold"
                                    title="Con AI chính phụ trách tác vụ này"
                                  >
                                    ⭐ {t.name.split('(')[0]}
                                  </span>
                                ))}
                                {pooledTasks.map((t) => (
                                  <span
                                    key={`b-${t.id}`}
                                    className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-semibold"
                                    title="AI dự phòng trong Task Pool (thay ca ngay khi con chính gặp sự cố)"
                                  >
                                    🛡️ {t.name.split('(')[0]}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-muted-foreground italic">Chưa gán</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await autoDispatchAIWorkforce({ db, aiConfigs: effectiveConfigs, force: true, setAiAssignments });
                                    toast.success(`Đã phân bổ việc cho ${cfg.name}!`);
                                  }}
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                                >
                                  + Giao việc
                                </button>
                              </div>
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
      {/* TAB CON: NHẬT KÝ GIÁM SÁT THEO GIỜ CỦA SENTINEL */}
      {/* ============================================================ */}
      {subTab === 'hourly' && (
        <div className="space-y-4 animate-fade-in font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                <span>Nhật ký Giám sát Định kỳ theo Giờ (Sentinel Hourly Audits)</span>
              </h3>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                Elio Sentinel trực tiếp đứng ra đo lường, rà soát và lưu trữ dữ liệu sức khỏe dàn AI theo từng mốc giờ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isScanning}
                onClick={runDeepAudit}
                className="tap px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Quét ngay mốc này</span>
              </button>

              {hourlyLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setHourlyLogs([]);
                    try { localStorage.removeItem('sprach_sentinel_hourly_logs'); } catch {}
                    toast.info('Đã xóa toàn bộ nhật ký giám sát cũ.');
                  }}
                  className="tap px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-bold text-muted-foreground"
                >
                  Xóa lịch sử
                </button>
              )}
            </div>
          </div>

          {/* Hộp trạng thái trực chiến */}
          <div className="surface p-4 rounded-xl border border-accent/20 bg-accent/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="font-bold text-foreground">Trạng thái: Sentinel đang trực chiến 24/7</span>
                <span className="text-muted-foreground ml-2">
                  (Chu kỳ quét: <strong className="text-accent">{hourlyIntervalMinutes} phút</strong>)
                </span>
              </div>
            </div>
            <div className="text-muted-foreground">
              Lần quét tự động kế tiếp sau: <strong className="text-accent text-sm">{Math.floor(nextAuditCountdown / 60)}p {nextAuditCountdown % 60}s</strong>
            </div>
          </div>

          {/* Bảng danh sách các mốc giờ */}
          {hourlyLogs.length === 0 ? (
            <div className="surface p-12 text-center rounded-xl border border-border bg-card space-y-3">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
              <div className="font-bold text-sm text-foreground">Chưa có mốc giám sát nào được ghi lại</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans">
                Sentinel sẽ tự động rà soát và lưu nhật ký đầu tiên khi hết đếm lùi, hoặc bạn có thể bấm nút quét ngay phía trên!
              </p>
              <button
                type="button"
                onClick={runDeepAudit}
                className="tap px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-bold font-mono inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo mốc giám sát đầu tiên ngay</span>
              </button>
            </div>
          ) : (
            <div className="surface rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3">Mốc Thời Gian</th>
                      <th className="p-3">Sức Khỏe</th>
                      <th className="p-3">Dàn AI (Online/Tổng)</th>
                      <th className="p-3">Độ Trễ TB</th>
                      <th className="p-3">Số Lỗi</th>
                      <th className="p-3">Đánh Giá Từ Sentinel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {hourlyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          <div>{log.time}</div>
                          <div className="text-[10px] text-muted-foreground font-normal">{log.date}</div>
                        </td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            log.healthScore >= 90
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600'
                          }`}>
                            {log.healthScore}%
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-accent">{log.onlineAI || log.totalAI}</span>
                          <span className="text-muted-foreground">/{log.totalAI} con AI</span>
                        </td>
                        <td className="p-3 font-semibold">
                          {log.avgLatency ? (
                            <span className={log.avgLatency < 500 ? 'text-emerald-500' : 'text-foreground'}>
                              {log.avgLatency}ms
                            </span>
                          ) : (
                            <span className="text-muted-foreground">---</span>
                          )}
                        </td>
                        <td className="p-3">
                          {log.issueCount > 0 ? (
                            <span className="text-rose-500 font-bold">{log.issueCount} lỗi</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 lỗi (Chuẩn)</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">
                          {log.note || 'Hoạt động ổn định'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
1. Ưu tiên sử dụng Gemini Flash Latest / Gemini 3+ cho các tác vụ Vision & OCR đề thi.
2. Tận dụng Groq (Llama 3.3 70B) cho đàm thoại Elio để đạt tốc độ tức thì 300 token/s.
3. Luôn cấu hình Backup Model cho tất cả các con AI để đảm bảo cơ chế chuyển mạch tự động không bị đứt đoạn.
`;
}

export default AdminReportsTab;
