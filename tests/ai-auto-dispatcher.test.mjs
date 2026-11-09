import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreAIForTask, autoDispatchAIWorkforce, hasValidApiKey } from '../src/lib/ai-auto-dispatcher.js';
import { APP_AI_TASKS } from '../src/data/ai-models-catalog.js';

test('hasValidApiKey correctly detects server and local keys', () => {
  assert.equal(hasValidApiKey(null), false);
  assert.equal(hasValidApiKey({ apiKey: '' }), false);
  assert.equal(hasValidApiKey({ apiKey: 'my-key' }), true);
  assert.equal(hasValidApiKey({ apiKey: '', maskedKey: '•••••• (server)' }), true);
  assert.equal(hasValidApiKey({ apiKey: '', maskedKey: '••••1234' }), true);
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
    { id: 'cfg-pro', name: 'Pro AI', provider: 'gemini', model: 'gemini-2.5-pro', hasVision: false, apiKey: 'k3', enabled: true },
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
