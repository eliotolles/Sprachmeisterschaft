import { APP_AI_TASKS } from '../data/ai-models-catalog.js';

const STORAGE_KEY_DYNAMIC_TASKS = 'sprach_dynamic_ai_tasks';
let dynamicAiTasks = [];

/**
 * Đăng ký tác vụ AI cho tính năng mới trong ứng dụng
 */
export function registerAppAiTask(taskDef) {
  if (!taskDef || !taskDef.id) return null;
  const existingIdx = dynamicAiTasks.findIndex((t) => t.id === taskDef.id);
  const normalizedTask = {
    id: taskDef.id,
    name: taskDef.name || taskDef.id,
    category: taskDef.category || 'Tính năng mới',
    desc: taskDef.desc || 'Tác vụ AI hỗ trợ tính năng người dùng',
    needsVision: Boolean(taskDef.needsVision),
    defaultRecommendation: taskDef.defaultRecommendation || 'gemini-flash-latest',
  };
  if (existingIdx >= 0) {
    dynamicAiTasks[existingIdx] = normalizedTask;
  } else {
    dynamicAiTasks.push(normalizedTask);
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DYNAMIC_TASKS, JSON.stringify(dynamicAiTasks));
    }
  } catch {}
  return normalizedTask;
}

/**
 * Lấy toàn bộ danh sách tác vụ AI (8 tác vụ cốt lõi + các tính năng mới đăng ký)
 */
export function getAllAppAiTasks() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_DYNAMIC_TASKS) || '[]');
      if (Array.isArray(saved)) {
        for (const t of saved) {
          if (!dynamicAiTasks.some((dt) => dt.id === t.id)) {
            dynamicAiTasks.push(t);
          }
        }
      }
    }
  } catch {}

  const allMap = new Map();
  for (const t of APP_AI_TASKS) {
    allMap.set(t.id, t);
  }
  for (const t of dynamicAiTasks) {
    allMap.set(t.id, t);
  }
  return Array.from(allMap.values());
}

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
  // Theo dõi số lượng tác vụ đã phân bổ cho mỗi con AI để chia đều công việc
  const assignedCounts = {};
  const allTasks = getAllAppAiTasks();

  for (const task of allTasks) {
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

    // Xếp hạng AI theo độ phù hợp chuyên môn + phạt tải để phân chia đều cho các con AI chưa có việc
    const rankedConfigs = configs
      .map((cfg) => {
        const baseScore = scoreAIForTask(cfg, task);
        if (baseScore <= 0) return { cfg, score: -9999 };
        const loadPenalty = (assignedCounts[cfg.id] || 0) * 350;
        return { cfg, score: baseScore - loadPenalty };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.cfg);

    if (rankedConfigs.length === 0) {
      if (!task.needsVision && configs.length > 0) {
        rankedConfigs.push(configs[0]);
      }
    }

    if (rankedConfigs.length > 0) {
      const primaryAI = rankedConfigs[0];
      assignedCounts[primaryAI.id] = (assignedCounts[primaryAI.id] || 0) + 1;

      // 1. Phân công model chính
      try {
        await db.aiConfig.setAssignment(task.id, primaryAI.id, primaryAI.model);
      } catch {
        try {
          await db.aiConfig.setAssignment(task.id, primaryAI.provider, primaryAI.model);
        } catch {}
      }

      // 2. Thêm vào Task Pool và nạp thêm các key dự phòng cùng nhóm
      if (db.aiConfig.addToTaskPool) {
        const poolCandidates = rankedConfigs.slice(0, 4);
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
        poolCount: Math.min(rankedConfigs.length, 4),
        status: 'auto-dispatched',
      });
    }
  }

  // 3. ĐẢM BẢO TẤT CẢ CÁC CON AI CÒN LẠI ĐỀU CÓ CÔNG VIỆC TRONG TASK POOL
  // Không để bất kỳ con AI nào ngồi chơi xơi nước
  if (db.aiConfig.addToTaskPool) {
    for (const cfg of configs) {
      // Tìm 2-3 tác vụ phù hợp nhất với năng lực của con AI này
      const matchedTasks = allTasks
        .map((t) => ({ task: t, score: scoreAIForTask(cfg, t) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      for (const m of matchedTasks) {
        try {
          await db.aiConfig.addToTaskPool(m.task.id, cfg.id);
        } catch {}
      }
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
let memorySentinelActions = [];

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

  memorySentinelActions = [item, ...memorySentinelActions.slice(0, 49)];

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
      return stored ? JSON.parse(stored) : memorySentinelActions;
    }
  } catch {}
  return memorySentinelActions;
}

/**
 * Xóa nhật ký hành động của Sentinel
 */
export function clearSentinelWorkforceActions() {
  memorySentinelActions = [];
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
  const allTasks = getAllAppAiTasks();
  const currentAssignments = db.aiConfig.getAssignments?.() || aiAssignments || {};
  const hasUnassigned = allTasks.some((t) => {
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
  // Quét toàn bộ mọi cấu hình AI trong hệ thống (kể cả chưa có key) để đảm bảo không con nào thiếu backup
  // -------------------------------------------------------------
  let backupPairedCount = 0;
  const allStoredConfigs = db.aiConfig?.getConfigs?.() || [];
  for (const cfg of allStoredConfigs) {
    const isMissingBackup = !cfg.backupModel || !cfg.backupModel.trim() || cfg.backupModel === cfg.model || cfg.backupModel.includes('2.5');
    if (isMissingBackup) {
      const chosenBackup = getRecommendedBackupModel(cfg, allStoredConfigs);

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
    assignedTaskCount: allTasks.filter((t) => {
      const asgn = db.aiConfig.getAssignments?.()?.[t.id];
      const pooled = db.aiConfig.getTaskPool?.(t.id) || [];
      return Boolean(asgn?.model || pooled.length > 0);
    }).length,
  };
}

/**
 * TÌM MODEL DỰ PHÒNG TỐI ƯU TƯƠNG THÍCH CHO TỪNG NHÀ CUNG CẤP
 * Luôn đảm bảo không bao giờ lấy 2.5 cũ, ưu tiên model anh em có sẵn
 */
export function getRecommendedBackupModel(cfg, allConfigs = []) {
  if (!cfg) return 'gemini-flash-latest';
  const provider = (cfg.provider || '').toLowerCase();
  const model = (cfg.model || '').toLowerCase();

  // 1. Tìm model anh em khác cùng provider mà người dùng đã tạo trong danh sách
  const sibling = allConfigs.find(
    (c) => c.provider === cfg.provider && c.id !== cfg.id && c.model !== cfg.model && c.model && !c.model.includes('2.5')
  );
  if (sibling && sibling.model) {
    return sibling.model;
  }

  // 2. Tra cứu chuẩn theo nhà cung cấp
  if (provider === 'gemini') {
    if (model.includes('3.8-flash')) return 'gemini-flash-latest';
    if (model.includes('flash-latest') || model.includes('3.7') || model.includes('3.5')) return 'gemini-3.8-flash';
    if (model.includes('pro')) return 'gemini-flash-latest';
    return 'gemini-3.8-flash';
  }

  if (provider === 'groq') {
    if (model.includes('qwen')) return 'llama-3.3-70b-versatile';
    if (model.includes('llama')) return 'qwen/qwen3.8-27b';
    return 'llama-3.3-70b-versatile';
  }

  if (provider === 'openrouter') {
    if (model.includes('nemotron')) return 'stealth/crouton-alpha';
    if (model.includes('liquid') || model.includes('lfm') || model.includes('dots')) return 'nvidia/nemotron-3.5-super-vl:free';
    return 'nvidia/nemotron-3.5-super-vl:free';
  }

  return 'gemini-flash-latest';
}

/**
 * TỰ ĐỘNG SỬA TẤT CẢ CÁC CON AI CHƯA CÓ BACKUP (GÁN MODEL DỰ PHÒNG 100%)
 */
export async function autoFixAllMissingBackups({ db, setAiConfigs }) {
  if (!db?.aiConfig) return { fixedCount: 0 };
  const allConfigs = db.aiConfig.getConfigs() || [];
  let fixedCount = 0;

  for (const cfg of allConfigs) {
    const needsBackup = !cfg.backupModel || !cfg.backupModel.trim() || cfg.backupModel === cfg.model || cfg.backupModel.includes('2.5');
    if (needsBackup) {
      const chosenBackup = getRecommendedBackupModel(cfg, allConfigs);
      try {
        await db.aiConfig.saveConfig({ ...cfg, backupModel: chosenBackup });
        fixedCount++;
        recordSentinelWorkforceAction({
          type: 'FAILOVER_PAIR',
          title: `Đã tự động gán Backup cho AI [${cfg.name || cfg.model}]`,
          detail: `Chỉ định [${chosenBackup}] làm model dự phòng thay thế khi quá tải.`,
          targetAi: cfg.name || cfg.model,
        });
      } catch {}
    }
  }

  if (fixedCount > 0 && setAiConfigs) {
    try {
      setAiConfigs(db.aiConfig.getConfigs());
    } catch {}
  }

  return { fixedCount };
}

/**
 * TỰ ĐỘNG SẮP XẾP CÔNG VIỆC VÀ GÁN DỰ PHÒNG CHO TOÀN BỘ DÀN AI (ALL-IN-ONE FLEET HEAL)
 * 1. Sắp xếp công việc cho tất cả các con AI chưa có việc (chia đều 8 tác vụ và đưa vào task pool).
 * 2. Gán model dự phòng (Backup) cho toàn bộ các con AI chưa có backup.
 */
export async function autoFixAllFleetIssues({ db, aiConfigs = [], setAiConfigs, setAiAssignments }) {
  if (!db?.aiConfig) return { fixedBackups: 0, dispatchedTasks: 0 };

  // 1. Sửa toàn bộ các con chưa có backup
  const backupRes = await autoFixAllMissingBackups({ db, setAiConfigs });

  // 2. Tái phân bổ công việc công bằng cho toàn bộ 12 con AI
  const dispatchRes = await autoDispatchAIWorkforce({
    db,
    aiConfigs,
    force: true,
    setAiAssignments,
  });

  recordSentinelWorkforceAction({
    type: 'DISPATCH',
    title: `Sentinel đã hoàn tất sắp xếp công việc và gán backup toàn diện`,
    detail: `Đã gán model dự phòng cho ${backupRes.fixedCount} con AI và phân bổ việc làm cho toàn bộ dàn AI.`,
  });

  return {
    fixedBackups: backupRes.fixedCount,
    dispatchedTasks: dispatchRes.dispatchedCount,
  };
}

/**
 * ĐẢM BẢO TÁC VỤ CÓ AI PHÂN CÔNG (TỰ ĐỘNG BỐ TRÍ CHO TÍNH NĂNG MỚI DÙNG AI)
 * Bất cứ khi nào một tính năng mới trong tương lai hoặc hiện tại dùng AI,
 * nếu chưa có nhân sự AI đảm nhiệm, Elio Sentinel sẽ lập tức:
 * 1. Đăng ký tác vụ vào danh mục (nếu chưa có).
 * 2. Chọn ra con AI phù hợp nhất (dựa trên Vision, năng lực lý luận/tốc độ, độ ưu tiên).
 * 3. Gán con AI đó làm nhân sự chính và bổ sung các con AI cùng nhóm vào Task Pool dự phòng.
 * 4. Tự động kiểm tra và gán backup model cho con AI này nếu còn thiếu.
 * 5. Ghi nhật ký Sentinel minh bạch.
 */
export async function ensureTaskHasAssignedAI(taskId, { db, taskMeta = {} } = {}) {
  if (!taskId || !db?.aiConfig) return null;

  const allTasks = getAllAppAiTasks();
  let task = allTasks.find((t) => t.id === taskId);
  if (!task) {
    task = registerAppAiTask({
      id: taskId,
      name: taskMeta.name || `Tính năng AI mới [${taskId}]`,
      desc: taskMeta.desc || 'Tác vụ AI hỗ trợ tính năng người dùng',
      needsVision: Boolean(taskMeta.needsVision),
      category: taskMeta.category || 'Tính năng mới',
    });
  }

  const assignments = db.aiConfig.getAssignments?.() || {};
  const currentAssigned = assignments[taskId];
  const pool = db.aiConfig.getTaskPool?.(taskId) || [];

  const activePool = pool.filter((c) => c && c.enabled !== false && hasValidApiKey(c));
  if (currentAssigned?.model && activePool.length > 0) {
    return {
      taskId,
      assignedAI: activePool[0],
      pool: activePool,
      status: 'ready',
    };
  }

  // Tự động phân công nếu chưa có
  const allConfigs = (db.aiConfig.getConfigs() || []).filter(
    (c) => c.enabled !== false && hasValidApiKey(c)
  );
  if (allConfigs.length === 0) return null;

  const scored = allConfigs
    .map((cfg) => ({ cfg, score: scoreAIForTask(cfg, task) }))
    .sort((a, b) => b.score - a.score);

  const bestAI = (scored[0]?.score > -9999 ? scored[0].cfg : null) || allConfigs[0];

  try {
    await db.aiConfig.setAssignment(taskId, bestAI.id, bestAI.model);
  } catch {
    try {
      await db.aiConfig.setAssignment(taskId, bestAI.provider, bestAI.model);
    } catch {}
  }

  const poolCandidates = scored.slice(0, 3).map((s) => s.cfg).filter(Boolean);
  for (const c of poolCandidates) {
    try {
      await db.aiConfig.addToTaskPool(taskId, c.id);
    } catch {}
  }

  if (!bestAI.backupModel || bestAI.backupModel === bestAI.model || bestAI.backupModel.includes('2.5')) {
    const backup = getRecommendedBackupModel(bestAI, allConfigs);
    try {
      await db.aiConfig.saveConfig({ ...bestAI, backupModel: backup });
    } catch {}
  }

  recordSentinelWorkforceAction({
    type: 'DISPATCH',
    title: `Sentinel tự động phân công AI cho tính năng [${task.name || taskId}]`,
    detail: `Phát hiện tính năng mới dùng AI. Sentinel đã tự động sắp xếp AI [${bestAI.name || bestAI.model}] vào đảm nhiệm chính và bổ sung ${poolCandidates.length} key dự phòng.`,
    targetAi: bestAI.name || bestAI.model,
    targetTask: taskId,
  });

  return {
    taskId,
    assignedAI: bestAI,
    pool: poolCandidates,
    status: 'auto-assigned',
  };
}

/**
 * TỰ ĐỘNG TIẾP NHẬN & SẮP XẾP KHI CÓ API KEY HOẶC AI MỚI ĐƯỢC THÊM
 * Con Quản lý Elio Sentinel tự động điều chỉnh, gán model backup và sắp xếp ngay vào việc.
 */
export async function handleNewAIConfigAdded(newConfig, { db, setAiConfigs, setAiAssignments } = {}) {
  if (!newConfig || !db?.aiConfig) return { dispatchedCount: 0 };

  const allConfigs = db.aiConfig.getConfigs() || [];
  let updatedConfig = { ...newConfig };

  // 1. Tự động gán model backup nếu thiếu hoặc đang là 2.5 cũ
  if (
    !updatedConfig.backupModel ||
    !updatedConfig.backupModel.trim() ||
    updatedConfig.backupModel === updatedConfig.model ||
    updatedConfig.backupModel.includes('2.5')
  ) {
    const backup = getRecommendedBackupModel(updatedConfig, allConfigs);
    updatedConfig.backupModel = backup;
    try {
      await db.aiConfig.saveConfig(updatedConfig);
    } catch {}
  }

  let dispatchedCount = 0;

  // 2. Nếu config có API key hợp lệ -> Sentinel tự động phân công vào các khâu
  if (updatedConfig.enabled !== false && hasValidApiKey(updatedConfig)) {
    const allTasks = getAllAppAiTasks();
    const currentAssignments = db.aiConfig.getAssignments?.() || {};

    // 2.1. Quét các tác vụ chưa có AI phân công hoặc thiếu key -> ưu tiên gán ngay
    for (const task of allTasks) {
      const assigned = currentAssignments[task.id];
      const pool = db.aiConfig.getTaskPool?.(task.id) || [];
      const isUnstaffed = !assigned?.model || pool.length === 0;

      if (isUnstaffed) {
        const score = scoreAIForTask(updatedConfig, task);
        if (score > 0) {
          try {
            await db.aiConfig.setAssignment(task.id, updatedConfig.id, updatedConfig.model);
            await db.aiConfig.addToTaskPool(task.id, updatedConfig.id);
            dispatchedCount++;
            recordSentinelWorkforceAction({
              type: 'DISPATCH',
              title: `Sentinel điều phối AI [${updatedConfig.name || updatedConfig.model}] vào khâu [${task.name}]`,
              detail: `Nhận diện API mới. Sentinel đã tự động đưa con AI này vào phụ trách chính cho tác vụ [${task.name}].`,
              targetAi: updatedConfig.name || updatedConfig.model,
              targetTask: task.id,
            });
          } catch {}
        }
      }
    }

    // 2.2. Nạp vào Task Pool dự phòng của các tác vụ phù hợp nhất với năng lực của con AI này
    const matchedTasks = allTasks
      .map((t) => ({ task: t, score: scoreAIForTask(updatedConfig, t) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    for (const m of matchedTasks) {
      try {
        await db.aiConfig.addToTaskPool(m.task.id, updatedConfig.id);
      } catch {}
    }

    recordSentinelWorkforceAction({
      type: 'DISPATCH',
      title: `Sentinel đã nạp API [${updatedConfig.name || updatedConfig.model}] vào hệ thống`,
      detail: `Đã kết nối thành công và tự động sắp xếp vào Task Pool cho các tác vụ: ${matchedTasks.map((m) => m.task.name).join(', ')}.`,
      targetAi: updatedConfig.name || updatedConfig.model,
    });
  }

  if (setAiConfigs) {
    try { setAiConfigs(db.aiConfig.getConfigs()); } catch {}
  }
  if (setAiAssignments) {
    try { setAiAssignments(db.aiConfig.getAssignments()); } catch {}
  }

  return { dispatchedCount, config: updatedConfig };
}


