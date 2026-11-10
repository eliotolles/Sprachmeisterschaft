import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreAIForTask,
  autoDispatchAIWorkforce,
  hasValidApiKey,
  kickstartSentinelWorkforce,
  recordSentinelWorkforceAction,
  getSentinelWorkforceActions,
  autoFixAllMissingBackups,
  autoFixAllFleetIssues,
  registerAppAiTask,
  getAllAppAiTasks,
  ensureTaskHasAssignedAI,
  handleNewAIConfigAdded,
} from '../src/lib/ai-auto-dispatcher.js';
import { APP_AI_TASKS } from '../src/data/ai-models-catalog.js';

test('hasValidApiKey correctly detects server and local keys', () => {
  assert.equal(hasValidApiKey(null), false);
  assert.equal(hasValidApiKey({ apiKey: '' }), false);
  assert.equal(hasValidApiKey({ apiKey: 'my-key' }), true);
  assert.equal(hasValidApiKey({ apiKey: '', maskedKey: '•••••• (server)' }), true);
  assert.equal(hasValidApiKey({ apiKey: '', maskedKey: '••••1234' }), true);
  assert.equal(hasValidApiKey({ apiKey: '', maskedKey: 'sk-123...4567' }), true);
  assert.equal(hasValidApiKey({ apiKey: '', maskedKey: '********' }), true);
  assert.equal(hasValidApiKey({ id: 'ai-cfg-gemini', apiKey: '' }), false);
  assert.equal(hasValidApiKey({ id: 'ai-cfg-custom-1', name: 'User AI', model: 'gpt-4o', apiKey: '' }), true);
  assert.equal(hasValidApiKey({ provider: 'custom' }), true);
});

test('scoreAIForTask gives high score for matching skills and rejects non-vision for vision task', () => {
  const ocrTask = APP_AI_TASKS.find((t) => t.id === 'ocr_image');
  const nonVisionAI = { id: 'text-1', name: 'Text Only', model: 'llama-3', hasVision: false, apiKey: 'k' };
  const visionAI = { id: 'vis-1', name: 'Vision Model', model: 'nvidia/nemotron-3.5-super-vl:free', hasVision: true, apiKey: 'k' };

  assert.equal(scoreAIForTask(nonVisionAI, ocrTask), -9999);
  assert.ok(scoreAIForTask(visionAI, ocrTask) > 1000);
});

test('autoDispatchAIWorkforce automatically assigns all 8 tasks and populates task pools', async () => {
  const configs = [
    { id: 'cfg-vis', name: 'Vision AI', provider: 'openrouter', model: 'nvidia/nemotron-3.5-super-vl:free', hasVision: true, apiKey: 'k1', enabled: true },
    { id: 'cfg-text', name: 'Fast Text AI', provider: 'groq', model: 'llama-3.3-70b-versatile', hasVision: false, apiKey: 'k2', enabled: true },
    { id: 'cfg-pro', name: 'Pro AI', provider: 'gemini', model: 'gemini-3-pro', hasVision: false, apiKey: 'k3', enabled: true },
  ];

  const assignments = {};
  const pools = {};

  const fakeDb = {
    aiConfig: {
      getConfigs: () => configs,
      getAssignments: () => assignments,
      getTaskPool: (taskId) => pools[taskId] || [],
      setAssignment: async (taskId, configId, model) => {
        assignments[taskId] = { configId, model };
      },
      addToTaskPool: async (taskId, configId) => {
        if (!pools[taskId]) pools[taskId] = [];
        if (!pools[taskId].includes(configId)) pools[taskId].push(configId);
      },
    },
  };

  const res = await autoDispatchAIWorkforce({
    db: fakeDb,
    aiConfigs: configs,
    currentAssignments: {},
  });

  assert.equal(res.dispatchedCount, 8);
  assert.equal(Object.keys(assignments).length, 8);

  // Vision task must have received the Vision AI
  assert.equal(assignments.ocr_image.configId, 'cfg-vis');
  assert.ok(pools.ocr_image.includes('cfg-vis'));

  // Conversational tasks get Fast Text AI or Pro
  assert.ok(assignments.elio_chat.configId);
  assert.ok(pools.elio_chat.length > 0);
});

test('kickstartSentinelWorkforce pairs backup models and dispatches workforce with action records', async () => {
  const configs = [
    { id: 'cfg-gem-1', name: 'Gemini Primary', provider: 'gemini', model: 'gemini-flash-latest', backupModel: '', hasVision: true, apiKey: 'k1', enabled: true },
    { id: 'cfg-gem-2', name: 'Gemini Backup', provider: 'gemini', model: 'gemini-3.8-flash', backupModel: '', hasVision: true, apiKey: 'k2', enabled: true },
  ];
  const assignments = {};
  const savedConfigs = [...configs];

  const fakeDb = {
    aiConfig: {
      getConfigs: () => savedConfigs,
      getAssignments: () => assignments,
      getTaskPool: () => [],
      setAssignment: async (taskId, configId, model) => {
        assignments[taskId] = { configId, model };
      },
      addToTaskPool: async () => {},
      saveConfig: async (cfg) => {
        const idx = savedConfigs.findIndex((c) => c.id === cfg.id);
        if (idx >= 0) savedConfigs[idx] = cfg;
      },
    },
  };

  const res = await kickstartSentinelWorkforce({
    db: fakeDb,
    aiConfigs: savedConfigs,
    sendWarmupPulse: true,
  });

  assert.equal(res.success, true);
  assert.ok(res.actionsPerformed > 0);
  assert.equal(res.activeAICount, 2);
  // Backup model must be paired
  assert.ok(savedConfigs[0].backupModel.length > 0);
  assert.equal(savedConfigs[0].backupModel, 'gemini-3.8-flash');
  // Task dispatch must be populated
  assert.equal(Object.keys(assignments).length, 8);
});

test('autoFixAllFleetIssues assigns work to all configs and repairs missing backups', async () => {
  const configs = [
    { id: 'cfg-1', name: 'Gemini Latest', provider: 'gemini', model: 'gemini-flash-latest', backupModel: '', hasVision: true, apiKey: 'k1', enabled: true },
    { id: 'cfg-2', name: 'Gemini 3.8', provider: 'gemini', model: 'gemini-3.8-flash', backupModel: '', hasVision: true, apiKey: 'k2', enabled: true },
    { id: 'cfg-3', name: 'Groq Qwen', provider: 'groq', model: 'qwen/qwen3.8-27b', backupModel: '', hasVision: false, apiKey: 'k3', enabled: true },
    { id: 'cfg-4', name: 'OpenRouter Nemotron', provider: 'openrouter', model: 'nvidia/nemotron-3.5-super-vl:free', backupModel: '', hasVision: true, apiKey: 'k4', enabled: true },
  ];
  const assignments = {};
  const pools = {};
  const savedConfigs = [...configs];

  const fakeDb = {
    aiConfig: {
      getConfigs: () => savedConfigs,
      getAssignments: () => assignments,
      getTaskPool: (taskId) => pools[taskId] || [],
      setAssignment: async (taskId, configId, model) => {
        assignments[taskId] = { configId, model };
      },
      addToTaskPool: async (taskId, configId) => {
        if (!pools[taskId]) pools[taskId] = [];
        if (!pools[taskId].includes(configId)) pools[taskId].push(configId);
      },
      saveConfig: async (cfg) => {
        const idx = savedConfigs.findIndex((c) => c.id === cfg.id);
        if (idx >= 0) savedConfigs[idx] = cfg;
      },
    },
  };

  const res = await autoFixAllFleetIssues({
    db: fakeDb,
    aiConfigs: savedConfigs,
  });

  assert.equal(res.fixedBackups, 4);
  assert.equal(res.dispatchedTasks, 8);
  // All configs now have backup models
  for (const c of savedConfigs) {
    assert.ok(c.backupModel && c.backupModel.length > 0);
    assert.notEqual(c.backupModel, c.model);
    assert.ok(!c.backupModel.includes('2.5'));
  }
  // All configs now participate in tasks
  for (const c of savedConfigs) {
    const isPrimary = Object.values(assignments).some((a) => a.configId === c.id);
    const isPooled = Object.values(pools).some((p) => p.includes(c.id));
    assert.ok(isPrimary || isPooled, `Config ${c.id} should have work assigned`);
  }
});

test('registerAppAiTask dynamically registers new tasks and getAllAppAiTasks merges them', () => {
  const initialTasks = getAllAppAiTasks();
  assert.ok(initialTasks.length >= 8);

  const newTask = registerAppAiTask({
    id: 'realtime_accent_tutor',
    name: 'Gia sư luyện phát âm Accent thời gian thực',
    needsVision: false,
    category: 'Giọng nói & Phát âm',
  });

  assert.equal(newTask.id, 'realtime_accent_tutor');
  const allTasks = getAllAppAiTasks();
  assert.ok(allTasks.some((t) => t.id === 'realtime_accent_tutor'));
});

test('ensureTaskHasAssignedAI automatically provisions AI for new feature', async () => {
  const configs = [
    { id: 'cfg-groq-turbo', name: 'Groq Turbo', provider: 'groq', model: 'llama-3.3-70b-versatile', hasVision: false, apiKey: 'k-groq', enabled: true },
    { id: 'cfg-gem-vis', name: 'Gemini Vision', provider: 'gemini', model: 'gemini-flash-latest', hasVision: true, apiKey: 'k-gem', enabled: true },
  ];
  const assignments = {};
  const pools = {};
  const savedConfigs = [...configs];

  const fakeDb = {
    aiConfig: {
      getConfigs: () => savedConfigs,
      getAssignments: () => assignments,
      getTaskPool: (taskId) => pools[taskId] || [],
      setAssignment: async (taskId, configId, model) => {
        assignments[taskId] = { configId, model };
      },
      addToTaskPool: async (taskId, configId) => {
        if (!pools[taskId]) pools[taskId] = [];
        if (!pools[taskId].includes(configId)) pools[taskId].push(configId);
      },
      saveConfig: async (cfg) => {
        const idx = savedConfigs.findIndex((c) => c.id === cfg.id);
        if (idx >= 0) savedConfigs[idx] = cfg;
      },
    },
  };

  // Test 1: New text feature
  const res1 = await ensureTaskHasAssignedAI('podcast_generator', {
    db: fakeDb,
    taskMeta: { name: 'Tạo Podcast Hội thoại tự động', needsVision: false },
  });

  assert.equal(res1.status, 'auto-assigned');
  assert.ok(assignments.podcast_generator);
  assert.ok(pools.podcast_generator.length > 0);

  // Test 2: New vision feature (must pick Gemini Vision)
  const res2 = await ensureTaskHasAssignedAI('handwriting_ocr', {
    db: fakeDb,
    taskMeta: { name: 'Đọc chữ viết tay tiếng Đức', needsVision: true },
  });

  assert.equal(res2.status, 'auto-assigned');
  assert.equal(assignments.handwriting_ocr.configId, 'cfg-gem-vis');
});

test('handleNewAIConfigAdded pairs backup model and dispatches workforce on new API key', async () => {
  const existingConfigs = [
    { id: 'cfg-groq-1', name: 'Groq Fast', provider: 'groq', model: 'qwen/qwen3.8-27b', backupModel: '', hasVision: false, apiKey: 'k1', enabled: true },
  ];
  const assignments = {};
  const pools = {};
  const fakeDb = {
    aiConfig: {
      getConfigs: () => existingConfigs,
      getAssignments: () => assignments,
      getTaskPool: (taskId) => pools[taskId] || [],
      setAssignment: async (taskId, configId, model) => {
        assignments[taskId] = { configId, model };
      },
      addToTaskPool: async (taskId, configId) => {
        if (!pools[taskId]) pools[taskId] = [];
        if (!pools[taskId].includes(configId)) pools[taskId].push(configId);
      },
      saveConfig: async (cfg) => {
        const idx = existingConfigs.findIndex((c) => c.id === cfg.id);
        if (idx >= 0) existingConfigs[idx] = cfg;
        else existingConfigs.push(cfg);
      },
    },
  };

  const newAI = {
    id: 'cfg-new-gemini',
    name: 'Gemini Pro Latest',
    provider: 'gemini',
    model: 'gemini-3-pro',
    backupModel: '',
    hasVision: true,
    apiKey: 'new-key-123',
    enabled: true,
  };

  const res = await handleNewAIConfigAdded(newAI, { db: fakeDb });
  assert.ok(res.config.backupModel.length > 0);
  assert.ok(!res.config.backupModel.includes('2.5'));
  assert.ok(res.dispatchedCount > 0);

  // Actions should be recorded by Sentinel
  const actions = getSentinelWorkforceActions();
  assert.ok(actions.length > 0);
});


