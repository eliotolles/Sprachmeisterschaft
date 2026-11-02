// ====================================================================
// SPRACHMEISTERSCHAFT — CLOUDFLARE WORKER EDGE RUNTIME
// Edge API Gateway for Secure Dynamic AI Model Discovery & Assets Serving
// ====================================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 0. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 1. Dynamic Admin List from Cloudflare Environment Variables / Secrets
    if (url.pathname === '/api/auth/admins' && (request.method === 'GET' || request.method === 'POST')) {
      return handleGetAdmins(request, env);
    }

    // 2. Dynamic Model Discovery Endpoint (CORS-free Edge Gateway)
    if (url.pathname === '/api/ai/discover' && request.method === 'POST') {
      return handleAiDiscover(request, env);
    }

    // 3. Dynamic Key Verification Endpoint
    if (url.pathname === '/api/ai/verify' && request.method === 'POST') {
      return handleAiVerify(request, env);
    }

    // 3. Fallback: Phục vụ toàn bộ tài nguyên Single Page Application từ thư mục dist
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.startsWith('/api/')) {
      response = await env.ASSETS.fetch(new URL('/index.html', request.url));
    }
    return response;
  },
};

/**
 * Dynamic Admin Emails Resolver from Cloudflare Environment Variables & Secrets
 * Scans ALL environment variables matching ADMIN / OWNER / SUPERADMIN or Cloudflare KV
 */
async function handleGetAdmins(request, env) {
  try {
    const emails = new Set();

    if (env) {
      // 1. Direct env variable checks
      const knownKeys = [
        'ADMIN_EMAILS',
        'ADMIN_EMAIL',
        'ADMIN_LIST',
        'ADMINS',
        'SUPERADMIN_EMAIL',
        'SUPERADMIN_EMAILS',
        'PRIMARY_ADMIN_EMAIL',
      ];
      for (const k of knownKeys) {
        if (env[k] && typeof env[k] === 'string') {
          env[k].split(/[,;\s]+/).forEach((e) => {
            const clean = e.trim().toLowerCase();
            if (clean.includes('@')) emails.add(clean);
          });
        }
      }

      // 2. Scan ALL other env keys containing ADMIN or OWNER
      for (const [k, v] of Object.entries(env)) {
        if (typeof v === 'string' && (k.toUpperCase().includes('ADMIN') || k.toUpperCase().includes('OWNER'))) {
          v.split(/[,;\s]+/).forEach((e) => {
            const clean = e.trim().toLowerCase();
            if (clean.includes('@')) emails.add(clean);
          });
        }
      }

      // 3. Check Cloudflare KV if bound
      if (env.KV && typeof env.KV.get === 'function') {
        const raw = (await env.KV.get('ADMIN_EMAILS')) || (await env.KV.get('ADMIN_LIST'));
        if (raw) {
          raw.split(/[,;\s]+/).forEach((e) => {
            const clean = e.trim().toLowerCase();
            if (clean.includes('@')) emails.add(clean);
          });
        }
      }
    }

    // Always ensure primary admin emails are included
    [
      'dat.nguyenviet.1999@gmail.com',
      'elio.nv260399@gmail.com',
      'dat.nv260399@gmail.com',
      'dat.nguyenviet.99@gmail.com',
      'dat.uneti.1999@gmail.com',
      'dat.uneti.99@gmail.com',
      'dat.sunlife99@gmail.com',
      'admin@sprachmeisterschaft.de',
      'admin@sprach.de',
    ].forEach((e) => emails.add(e));

    return jsonResponse({
      success: true,
      source: emails.size > 2 ? 'cloudflare_env' : 'default_fallback',
      admins: Array.from(emails),
    });
  } catch (err) {
    return jsonResponse(
      {
        success: false,
        error: err.message,
        admins: ['dat.nguyenviet.1999@gmail.com', 'admin@sprachmeisterschaft.de'],
      },
      200
    );
  }
}

/**
 * Handle Model Discovery from Cloudflare Edge
 */
async function handleAiDiscover(request, env) {
  try {
    const body = await request.json();
    const { provider, apiKey, baseUrl } = body || {};

    if (!provider) {
      return jsonResponse({ success: false, error: 'Thiếu thông tin provider' }, 400);
    }

    let models = [];

    // --- 1. GOOGLE GEMINI ---
    if (provider === 'gemini') {
      if (!apiKey) return jsonResponse({ success: false, error: 'Thiếu API Key Gemini' }, 400);
      const rootUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      const targetUrl = `${rootUrl}/models?key=${apiKey}&pageSize=100`;

      const res = await fetch(targetUrl, { method: 'GET' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `Google Gemini HTTP ${res.status}: ${txt.slice(0, 150)}` }, 400);
      }
      const data = await res.json();
      const rawList = data.models || [];

      models = rawList
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => {
          const rawName = m.name || '';
          const cleanId = rawName.startsWith('models/') ? rawName.replace('models/', '') : rawName;
          const lower = cleanId.toLowerCase();
          const isVision = lower.includes('flash') || lower.includes('pro') || lower.includes('ultra') || lower.includes('2.0') || lower.includes('2.5') || lower.includes('1.5');
          const isFree = lower.includes('flash') || lower.includes('exp');

          return {
            id: cleanId,
            rawId: m.name,
            name: m.displayName || cleanId,
            provider: 'gemini',
            desc: m.description || `Mô hình Gemini chính thức (${cleanId}).`,
            contextWindow: m.inputTokenLimit ? `${Math.round(m.inputTokenLimit / 1000)}k tokens` : '1M tokens',
            contextLimit: m.inputTokenLimit || 1048576,
            capabilities: {
              text: true,
              vision: isVision,
              audio: lower.includes('flash') || lower.includes('pro'),
              reasoning: lower.includes('thinking') || lower.includes('pro') || lower.includes('2.5'),
              json: true,
            },
            pricing: {
              prompt: 0,
              completion: 0,
              isFree: true,
              tier: isFree ? 'VERIFIED_FREE' : 'FREE_ELIGIBLE',
              note: 'Google AI Studio Free Tier (15 RPM)',
            },
            discoveredAt: new Date().toISOString(),
          };
        });
    }

    // --- 2. OPENROUTER ---
    else if (provider === 'openrouter') {
      const rootUrl = baseUrl || 'https://openrouter.ai/api/v1';
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${rootUrl}/models`, { method: 'GET', headers });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `OpenRouter HTTP ${res.status}: ${txt.slice(0, 150)}` }, 400);
      }
      const data = await res.json();
      const rawList = data.data || [];

      models = rawList.map((m) => {
        const pPrompt = parseFloat(m.pricing?.prompt || '0');
        const pComp = parseFloat(m.pricing?.completion || '0');
        const isFree = (m.id || '').endsWith(':free') || (pPrompt === 0 && pComp === 0);
        const lowerId = (m.id || '').toLowerCase();
        const modality = (m.architecture?.modality || '').toLowerCase();

        return {
          id: m.id,
          rawId: m.id,
          name: m.name || m.id,
          provider: 'openrouter',
          desc: m.description || `Mô hình ${m.id} trên OpenRouter.`,
          contextWindow: m.context_length ? `${Math.round(m.context_length / 1000)}k tokens` : '32k tokens',
          contextLimit: m.context_length || 32768,
          capabilities: {
            text: true,
            vision: modality.includes('image') || lowerId.includes('vision') || lowerId.includes('vl'),
            audio: modality.includes('audio') || lowerId.includes('audio'),
            reasoning: lowerId.includes('r1') || lowerId.includes('reason') || lowerId.includes('o1') || lowerId.includes('o3'),
            json: true,
          },
          pricing: {
            prompt: pPrompt,
            completion: pComp,
            isFree,
            tier: isFree ? 'VERIFIED_FREE' : 'PAID',
            note: isFree ? 'OpenRouter Free Tier (Miễn phí 100%)' : `$${pPrompt * 1000000}/1M tokens`,
          },
          releaseDate: m.created ? new Date(m.created * 1000).toISOString().split('T')[0] : null,
          discoveredAt: new Date().toISOString(),
        };
      });
    }

    // --- 3. GROQ ---
    else if (provider === 'groq') {
      if (!apiKey) return jsonResponse({ success: false, error: 'Thiếu API Key Groq' }, 400);
      const rootUrl = baseUrl || 'https://api.groq.com/openai/v1';
      const res = await fetch(`${rootUrl}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `Groq HTTP ${res.status}: ${txt.slice(0, 150)}` }, 400);
      }
      const data = await res.json();
      const rawList = data.data || [];

      models = rawList.map((m) => {
        const lower = (m.id || '').toLowerCase();
        const isVision = lower.includes('vision') || lower.includes('vl');
        const isAudio = lower.includes('whisper') || lower.includes('audio');
        return {
          id: m.id,
          rawId: m.id,
          name: m.id,
          provider: 'groq',
          desc: `Groq LPU siêu tốc (${m.owned_by || 'Groq'}). Phản xạ đàm thoại tiếng Đức cực nhanh.`,
          contextWindow: m.context_window ? `${Math.round(m.context_window / 1000)}k tokens` : '128k tokens',
          contextLimit: m.context_window || 131072,
          capabilities: {
            text: !isAudio,
            vision: isVision,
            audio: isAudio,
            reasoning: lower.includes('r1') || lower.includes('reason'),
            json: true,
          },
          pricing: {
            prompt: 0,
            completion: 0,
            isFree: true,
            tier: 'FREE_ELIGIBLE',
            note: 'Groq Cloud Free Tier',
          },
          discoveredAt: new Date().toISOString(),
        };
      });
    }

    // --- 4. DEEPSEEK ---
    else if (provider === 'deepseek') {
      if (!apiKey) return jsonResponse({ success: false, error: 'Thiếu API Key DeepSeek' }, 400);
      const rootUrl = baseUrl || 'https://api.deepseek.com';
      const res = await fetch(`${rootUrl}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `DeepSeek HTTP ${res.status}: ${txt.slice(0, 150)}` }, 400);
      }
      const data = await res.json();
      const rawList = data.data || [];

      models = rawList.map((m) => {
        const isR1 = (m.id || '').includes('reasoner') || (m.id || '').includes('r1');
        return {
          id: m.id,
          rawId: m.id,
          name: isR1 ? 'DeepSeek R1 (Reasoner)' : 'DeepSeek V3 (Chat)',
          provider: 'deepseek',
          desc: isR1 ? 'DeepSeek R1 mô hình tư duy suy luận chuỗi ý nghĩ.' : 'DeepSeek V3 hội thoại ngôn ngữ thông minh.',
          contextWindow: '64k tokens',
          contextLimit: 65536,
          capabilities: { text: true, vision: false, audio: false, reasoning: isR1, json: true },
          pricing: { prompt: isR1 ? 0.00055 : 0.00014, completion: isR1 ? 0.00219 : 0.00028, isFree: false, tier: 'PAID', note: 'DeepSeek API' },
          discoveredAt: new Date().toISOString(),
        };
      });
    }

    // --- 5. OPENAI / MISTRAL / CEREBRAS / TOGETHER / CUSTOM ---
    else {
      let endpoint = '';
      if (provider === 'openai') endpoint = 'https://api.openai.com/v1/models';
      else if (provider === 'mistral') endpoint = 'https://api.mistral.ai/v1/models';
      else if (provider === 'cerebras') endpoint = 'https://api.cerebras.ai/v1/models';
      else if (provider === 'together') endpoint = 'https://api.together.xyz/v1/models';
      else endpoint = `${(baseUrl || 'http://localhost:11434/v1').replace(/\/$/, '')}/models`;

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(endpoint, { method: 'GET', headers });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `${provider.toUpperCase()} HTTP ${res.status}: ${txt.slice(0, 150)}` }, 400);
      }
      const data = await res.json();
      const rawList = data.data || (Array.isArray(data) ? data : data.models || []);

      models = rawList.map((m) => {
        const mId = m.id || m.name || 'model';
        const lower = mId.toLowerCase();
        const isFree = provider === 'cerebras' || provider === 'custom' || lower.includes('small') || lower.includes('open-');
        return {
          id: mId,
          rawId: mId,
          name: m.name || mId,
          provider,
          desc: `${provider.toUpperCase()} model: ${mId}`,
          contextWindow: '128k tokens',
          contextLimit: 131072,
          capabilities: {
            text: true,
            vision: lower.includes('vision') || lower.includes('4o') || lower.includes('vl') || lower.includes('pixtral'),
            audio: lower.includes('whisper') || lower.includes('audio'),
            reasoning: lower.includes('o1') || lower.includes('o3') || lower.includes('r1') || lower.includes('reason'),
            json: true,
          },
          pricing: {
            prompt: isFree ? 0 : 0.001,
            completion: isFree ? 0 : 0.002,
            isFree,
            tier: isFree ? 'FREE_ELIGIBLE' : 'PAID',
            note: isFree ? `${provider.toUpperCase()} Free Tier` : 'Commercial API',
          },
          discoveredAt: new Date().toISOString(),
        };
      });
    }

    return jsonResponse({
      success: true,
      provider,
      models,
      totalCount: models.length,
      freeCount: models.filter((m) => m.pricing?.isFree).length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || 'Lỗi xử lý phát hiện model tại Edge' }, 500);
  }
}

/**
 * Handle API Key Live Verification
 */
async function handleAiVerify(request, env) {
  try {
    const body = await request.json();
    const { provider, apiKey, baseUrl } = body || {};

    if (!provider || !apiKey) {
      return jsonResponse({ success: false, error: 'Thiếu provider hoặc apiKey' }, 400);
    }

    // Direct test call per provider
    if (provider === 'gemini') {
      const url = `${baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models?key=${apiKey}&pageSize=1`;
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `Gemini Key không hợp lệ (${res.status}): ${txt.slice(0, 150)}` }, 400);
      }
      return jsonResponse({ success: true, message: 'Google Gemini Key hợp lệ!' });
    }

    if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `OpenRouter Key không hợp lệ (${res.status}): ${txt.slice(0, 150)}` }, 400);
      }
      const data = await res.json();
      return jsonResponse({ success: true, message: 'OpenRouter Key hợp lệ!', info: data.data });
    }

    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return jsonResponse({ success: false, error: `Groq Key không hợp lệ (${res.status}): ${txt.slice(0, 150)}` }, 400);
      }
      return jsonResponse({ success: true, message: 'Groq Key hợp lệ!' });
    }

    // Default OpenAI-compatible verify
    let endpoint = 'https://api.openai.com/v1/models';
    if (provider === 'deepseek') endpoint = 'https://api.deepseek.com/models';
    else if (provider === 'mistral') endpoint = 'https://api.mistral.ai/v1/models';
    else if (provider === 'cerebras') endpoint = 'https://api.cerebras.ai/v1/models';
    else if (provider === 'custom') endpoint = `${(baseUrl || 'http://localhost:11434/v1').replace(/\/$/, '')}/models`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return jsonResponse({ success: false, error: `${provider.toUpperCase()} Key không hợp lệ (${res.status}): ${txt.slice(0, 150)}` }, 400);
    }
    return jsonResponse({ success: true, message: `${provider.toUpperCase()} Key hợp lệ!` });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
