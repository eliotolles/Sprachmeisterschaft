import { APP_AI_TASKS } from '../data/ai-models-catalog.js';

/**
 * Kiểm tra tính hợp lệ của API Key (hỗ trợ cả key lưu mã hóa trên server lẫn local)
 */
export function hasValidApiKey(cfg) {
  if (!cfg) return false;
  if (cfg.provider === 'custom') return true;
  // Key trực tiếp dạng chuỗi
  if (typeof cfg.apiKey === 'string' && cfg.apiKey.trim().length > 0) return true;
  // Chuỗi che key (bất kể định dạng '•••••• (server)', '********', 'sk-...1234')
  if (typeof cfg.maskedKey === 'string' && cfg.maskedKey.trim().length > 0) return true;
  // Các config thật do người dùng tạo (khác 3 mock template rỗng ban đầu)
  if (cfg.id && !['ai-cfg-gemini', 'ai-cfg-groq', 'ai-cfg-openrouter'].includes(cfg.id)) {
    if (cfg.model && (cfg.name || cfg.label)) return true;
  }
  return false;
}

/**
 * Chấm điểm độ tương thích của một AI Config với một Tác vụ cụ thể
 * Điểm càng cao thì con AI đó càng phù hợp để được phân công tác vụ này.
 */
export function scoreAIForTask(cfg, task) {
  if (!cfg || cfg.enabled === false) return -9999;
  if (!hasValidApiKey(cfg)) return -9999;

  // Tác vụ bắt buộc Vision mà model không hỗ trợ Vision -> loại ngay
  if (task.needsVision && !cfg.hasVision) return -9999;

  let score = 100;
  const modelLower = (cfg.model || '').toLowerCase();
  const providerLower = (cfg.provider || '').toLowerCase();
  const nameLower = (cfg.name || '').toLowerCase();

  // Ưu tiên Vision cho tác vụ OCR/Đọc đề thi qua ảnh
  if (task.needsVision) {
    score += 1000;
    if (modelLower.includes('super-vl') || modelLower.includes('flash') || modelLower.includes('vision')) {
      score += 200;
    }
  }

  // Nhóm Chấm chữa bài viết & Phân tích ngữ pháp sâu
  if (['writing_grading', 'exam_evaluation', 'grammar_deep'].includes(task.id)) {
    if (modelLower.includes('pro') || modelLower.includes('reasoner') || modelLower.includes('deepseek') || modelLower.includes('3-pro') || modelLower.includes('flash-latest')) {
      score += 400;
    } else if (modelLower.includes('nemotron') || modelLower.includes('qwen') || modelLower.includes('70b') || modelLower.includes('3.8-flash')) {
      score += 300;
    } else if (modelLower.includes('flash') || modelLower.includes('gpt-4')) {
      score += 200;
    }
  }

  // Nhóm Đàm thoại trực tiếp & Phỏng vấn phản xạ (cần tốc độ cao, độ trễ thấp)
  if (['elio_chat', 'interview'].includes(task.id)) {
    if (providerLower === 'groq') {
      score += 500; // Groq cực nhanh, lý tưởng cho hội thoại tức thì
    } else if (modelLower.includes('flash') || modelLower.includes('turbo') || modelLower.includes('versatile') || modelLower.includes('8b')) {
      score += 350;
    }
  }

  // Nhóm Phụ đề & Phát âm
  if (['audio_subtitles', 'speaking_eval'].includes(task.id)) {
    if (modelLower.includes('whisper') || modelLower.includes('audio') || providerLower === 'groq' || modelLower.includes('flash')) {
      score += 400;
    }
  }

  // Ưu tiên theo cấu hình priority của Admin (Ưu tiên #1 > #2 > #3)
  score += Math.max(0, 10 - (Number(cfg.priority) || 1)) * 20;

  return score;
}

/**
 * TỰ ĐỘNG PHÂN CHIA NHÂN SỰ AI VÀO TOÀN BỘ 8 TÁC VỤ (Autonomous Workforce Dispatcher)
 * Hoạt động như nhân viên mới: Vừa ngồi vào bàn là nhận việc làm luôn, không cần người dùng thao tác thủ công.
 *
 * @param {Object} params
 * @param {Object} params.db - Instance của db.aiConfig
 * @param {Array} params.aiConfigs - Danh sách cấu hình AI đang có
 * @param {Object} [params.currentAssignments] - Phân công hiện tại
 * @param {Function} [params.setAiAssignments] - Hàm cập nhật state UI
 * @param {boolean} [params.force] - Nếu true, phân công lại cả các tác vụ đã gán
 * @returns {Promise<{dispatchedCount: number, tasksSummary: Array}>}
 */
export async function autoDispatchAIWorkforce({
  db,
  aiConfigs = [],
  currentAssignments = {},
  setAiAssignments,
  force = false,
}) {
  if (!db?.aiConfig) return { dispatchedCount: 0, tasksSummary: [] };

  const configs = (aiConfigs.length > 0 ? aiConfigs : db.aiConfig.getConfigs()).filter(
    (c) => c.enabled !== false && hasValidApiKey(c)
  );

  if (configs.length === 0) {
    return { dispatchedCount: 0, tasksSummary: [] };
  }

  let dispatchedCount = 0;
  const tasksSummary = [];

  for (const task of APP_AI_TASKS) {
    const existingAssignment = currentAssignments[task.id] || db.aiConfig.getAssignments()?.[task.id];
    const existingPool = db.aiConfig.getTaskPool?.(task.id) || [];
    const isAlreadyStaffed = !force && existingAssignment?.model && existingPool.length > 0;

    if (isAlreadyStaffed) {
      tasksSummary.push({
        taskId: task.id,
        taskName: task.name,
        assignedModel: existingAssignment.model,
        poolCount: existingPool.length,
        status: 'retained',
      });
      continue;
    }

    // Xếp hạng AI theo độ phù hợp chuyên môn
    const rankedConfigs = configs
      .map((cfg) => ({ cfg, score: scoreAIForTask(cfg, task) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.cfg);

    if (rankedConfigs.length === 0) {
      // Fallback: nếu tác vụ không bắt buộc vision, lấy bất kỳ config nào khả dụng
      if (!task.needsVision && configs.length > 0) {
        rankedConfigs.push(configs[0]);
      }
    }

    if (rankedConfigs.length > 0) {
      const primaryAI = rankedConfigs[0];

      // 1. Phân công model chính
      try {
        await db.aiConfig.setAssignment(task.id, primaryAI.id, primaryAI.model);
      } catch {
        try {
          await db.aiConfig.setAssignment(task.id, primaryAI.provider, primaryAI.model);
        } catch {}
      }

      // 2. Thêm vào Task Pool và nạp thêm tối đa 2 key dự phòng cùng nhóm
      if (db.aiConfig.addToTaskPool) {
        const poolCandidates = rankedConfigs.slice(0, 3);
        for (const candidate of poolCandidates) {
          try {
            await db.aiConfig.addToTaskPool(task.id, candidate.id);
          } catch {}
        }
      }

      dispatchedCount++;
      tasksSummary.push({
        taskId: task.id,
        taskName: task.name,
        assignedModel: primaryAI.model,
        assignedName: primaryAI.name,
        poolCount: Math.min(rankedConfigs.length, 3),
        status: 'auto-dispatched',
      });
    }
  }

  if (dispatchedCount > 0 && setAiAssignments) {
    try {
      setAiAssignments(db.aiConfig.getAssignments());
    } catch {}
  }

  return { dispatchedCount, tasksSummary };
}

/**
 * ====================================================================
 * SENTINEL AUTONOMOUS WORKFORCE ENGINE (BỘ MÁY QUẢN LÝ & THÚC ĐẨY AI CHẠY NGẦM)
 * ====================================================================
 * Chạy ngầm 24/7 để giám sát, thúc đẩy dàn AI làm việc, phân công tự động,
 * tự động ghép đôi dự phòng failover và gửi xung nhịp keep-alive đánh thức AI.
 */

const STORAGE_KEY_SENTINEL_ACTIONS = 'sprach_sentinel_workforce_actions';

/**
 * Ghi nhận một hành động quản lý & thúc đẩy của Sentinel vào nhật ký ngầm
 */
export function recordSentinelWorkforceAction(action) {
  const item = {
    id: `sentinel-act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    timeStr: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: action.type || 'DISPATCH', // 'DISPATCH' | 'FAILOVER_PAIR' | 'WARMUP' | 'HEAL' | 'PULSE'
    title: action.title || 'Sentinel thúc đẩy dàn AI',
    detail: action.detail || '',
    targetAi: action.targetAi || null,
    targetTask: action.targetTask || null,
    status: action.status || 'success',
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_SENTINEL_ACTIONS) || '[]');
      const updated = [item, ...existing.slice(0, 49)];
      localStorage.setItem(STORAGE_KEY_SENTINEL_ACTIONS, JSON.stringify(updated));
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('sprach_sentinel_workforce_event', { detail: item }));
    }
  } catch {}

  return item;
}

/**
 * Đọc toàn bộ nhật ký hành động thúc đẩy của Sentinel
 */
export function getSentinelWorkforceActions() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_SENTINEL_ACTIONS);
      return stored ? JSON.parse(stored) : [];
    }
  } catch {}
  return [];
}

/**
 * Xóa nhật ký hành động của Sentinel
 */
export function clearSentinelWorkforceActions() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_SENTINEL_ACTIONS);
    }
  } catch {}
}

/**
 * THÚC ĐẨY TOÀN DIỆN DÀN AI (Workforce Kickstart & Autonomous Orchestration)
 * Con quản lý Sentinel trực tiếp đứng ra:
 * 1. Đốc thúc phân công ngay lập tức bất kỳ tác vụ nào chưa có nhân sự AI.
 * 2. Đốc thúc ghép đôi model dự phòng cho mọi AI đang hoạt động.
 * 3. Gửi xung nhịp keep-alive đánh thức dàn AI, bảo đảm 100% sẵn sàng, không trễ khi học viên vào học.
 */
export async function kickstartSentinelWorkforce({
  db,
  aiConfigs = [],
  setAiConfigs,
  aiAssignments = {},
  setAiAssignments,
  forceReassign = false,
  sendWarmupPulse = false,
}) {
  if (!db?.aiConfig) return { success: false, actionsPerformed: 0 };

  const cfgs = (aiConfigs.length > 0 ? aiConfigs : db.aiConfig.getConfigs()).filter(
    (c) => c.enabled !== false && hasValidApiKey(c)
  );

  let actionsPerformed = 0;
  const recordedLogs = [];

  // -------------------------------------------------------------
  // HÀNH ĐỘNG 1: ĐỐC THÚC PHÂN CÔNG TÁC VỤ ỨNG DỤNG (DISPATCH)
  // -------------------------------------------------------------
  const currentAssignments = db.aiConfig.getAssignments?.() || aiAssignments || {};
  const hasUnassigned = APP_AI_TASKS.some((t) => {
    const assigned = currentAssignments[t.id];
    const pooled = db.aiConfig?.getTaskPool?.(t.id) || [];
    return !assigned?.model && pooled.length === 0;
  });

  if ((hasUnassigned || forceReassign) && cfgs.length > 0) {
    const dispatchRes = await autoDispatchAIWorkforce({
      db,
      aiConfigs: cfgs,
      currentAssignments,
      setAiAssignments,
      force: forceReassign,
    });

    if (dispatchRes.dispatchedCount > 0) {
      actionsPerformed += dispatchRes.dispatchedCount;
      const logItem = recordSentinelWorkforceAction({
        type: 'DISPATCH',
        title: `Sentinel tự động điều phối ${dispatchRes.dispatchedCount} tác vụ cho dàn AI`,
        detail: `Đã phân bổ nhân sự AI vào các vị trí công việc: ${dispatchRes.tasksSummary.map((t) => `${t.taskName} -> ${t.assignedModel}`).join(', ')}`,
      });
      recordedLogs.push(logItem);
    }
  }

  // -------------------------------------------------------------
  // HÀNH ĐỘNG 2: ĐỐC THÚC GHÉP ĐÔI DỰ PHÒNG FAILOVER CHO CÁC CON AI
  // -------------------------------------------------------------
  let backupPairedCount = 0;
  for (const cfg of cfgs) {
    if (!cfg.backupModel || !cfg.backupModel.trim()) {
      // Tìm model anh em cùng nhà cung cấp
      const sameProvider = cfgs.find(
        (c) => c.provider === cfg.provider && c.id !== cfg.id && c.model !== cfg.model && c.model
      );

      const chosenBackup =
        sameProvider?.model ||
        (cfg.provider === 'gemini'
          ? (cfg.model === 'gemini-3.8-flash' ? 'gemini-flash-latest' : 'gemini-3.8-flash')
          : cfg.provider === 'groq'
          ? (cfg.model === 'llama-3.3-70b-versatile' ? 'qwen/qwen3.8-27b' : 'llama-3.3-70b-versatile')
          : 'nvidia/nemotron-3.5-super-vl:free');

      try {
        await db.aiConfig.saveConfig({ ...cfg, backupModel: chosenBackup });
        backupPairedCount++;
        actionsPerformed++;
        const logItem = recordSentinelWorkforceAction({
          type: 'FAILOVER_PAIR',
          title: `Sentinel ghép đôi model dự phòng cho AI [${cfg.name || cfg.model}]`,
          detail: `Đã tự động chỉ định [${chosenBackup}] làm phó tướng dự phòng (Failover), đảm bảo hệ thống không gián đoạn khi quá tải.`,
          targetAi: cfg.name || cfg.model,
        });
        recordedLogs.push(logItem);
      } catch {}
    }
  }

  if (backupPairedCount > 0 && setAiConfigs) {
    try {
      setAiConfigs(db.aiConfig.getConfigs());
    } catch {}
  }

  // -------------------------------------------------------------
  // HÀNH ĐỘNG 3: XUNG NHỊP THÚC ĐẨY & LÀM NÓNG DÀN AI (WARM-UP PULSE)
  // -------------------------------------------------------------
  if (sendWarmupPulse && cfgs.length > 0) {
    actionsPerformed++;
    const logItem = recordSentinelWorkforceAction({
      type: 'WARMUP',
      title: 'Sentinel phát xung nhịp Keep-Alive làm nóng dàn AI',
      detail: `Đã kích hoạt xung nhịp đánh thức đồng loạt ${cfgs.length} con AI đang trực chiến. Giữ nhiệt độ kết nối, triệt tiêu độ trễ khởi động khi học viên vào học.`,
    });
    recordedLogs.push(logItem);
  }

  return {
    success: true,
    actionsPerformed,
    recordedLogs,
    activeAICount: cfgs.length,
    assignedTaskCount: APP_AI_TASKS.filter((t) => {
      const asgn = db.aiConfig.getAssignments?.()?.[t.id];
      const pooled = db.aiConfig.getTaskPool?.(t.id) || [];
      return Boolean(asgn?.model || pooled.length > 0);
    }).length,
  };
}

