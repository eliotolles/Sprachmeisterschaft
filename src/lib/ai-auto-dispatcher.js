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
