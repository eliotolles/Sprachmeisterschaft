import {elioAIAdmin} from './elio-ai-admin-runtime.js';
// ====================================================================
// SPRACHMEISTERSCHAFT — DYNAMIC MODEL DISCOVERY ENGINE
// Live API Catalog Retrieval, Metadata Normalization, Free-Tier-First Sorting
// Zero Hardcoded Models — Directly connects to provider APIs
// ====================================================================

import { PROVIDER_ADAPTERS, MODEL_TIERS, getProviderAdapter } from './ai-providers/adapters';
import { db } from './db';

/**
 * Global AI Policy defaults (As strictly required by Master Prompt Section 6)
 */
export const DEFAULT_AI_POLICY = {
  FREE_ONLY: true,                        // Only use free models by default
  FREE_FIRST_SORT: true,                  // Free models sorted to the top
  ALLOW_PAID_MODELS: false,               // Do not allow paid models without explicit admin approval
  AUTO_PAID_FALLBACK: false,              // NEVER auto-fallback to paid models
  REQUIRE_ADMIN_APPROVAL_FOR_PAID: true,  // Require admin confirmation when choosing a paid model
};

/**
 * Mask an API Key for safe display in UI
 * e.g. "AIzaSyDa-example-12345678" -> "AIzaSy...5678"
 */
export function maskApiKey(key) {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '********';
  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Dynamically discover models from official provider API
 * Tries Edge Worker /api/ai/discover first (CORS-free), then direct client fallback
 */
export async function discoverProviderModels({ provider, apiKey, baseUrl,configId }) {
  if(elioAIAdmin()?.isActive())return elioAIAdmin().discover({provider,apiKey,configId});
  if (!apiKey?.trim() && provider !== 'custom') {
    throw new Error(`Vui lòng nhập API Key cho nhà cung cấp ${provider.toUpperCase()} trước khi khám phá danh mục model.`);
  }

  const cleanKey = (apiKey || '').trim();
  const cleanBaseUrl = (baseUrl || '').trim();

  // 1. Try server-side Cloudflare Worker endpoint if available (avoids browser CORS issues)
  try {
    const edgeRes = await fetch('/api/ai/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey: cleanKey,
        baseUrl: cleanBaseUrl,
      }),
    });

    if (edgeRes.ok) {
      const edgeData = await edgeRes.json();
      if (edgeData.success && Array.isArray(edgeData.models) && edgeData.models.length > 0) {
        // Cache catalog
        saveDiscoveredCatalog(provider, edgeData.models, cleanBaseUrl);
        return {
          success: true,
          models: edgeData.models,
          recommendations: getSmartRecommendations(edgeData.models),
          totalCount: edgeData.models.length,
          freeCount: edgeData.models.filter((m) => m.pricing?.isFree).length,
          syncedAt: new Date().toISOString(),
          source: 'edge_worker',
        };
      }
    }
  } catch (edgeErr) {
    // Proceed to direct adapter if edge endpoint not serving
  }

  // 2. Direct client-side discovery using official provider adapter
  const adapter = getProviderAdapter(provider);
  if (!adapter) {
    throw new Error(`Nhà cung cấp "${provider}" chưa được cấu hình adapter.`);
  }

  const rawModels = await adapter.discoverModels(cleanKey, cleanBaseUrl);

  if (!rawModels || rawModels.length === 0) {
    throw new Error(`API của ${adapter.name} không trả về model nào khả dụng cho key này.`);
  }

  // Cache catalog locally
  saveDiscoveredCatalog(provider, rawModels, cleanBaseUrl);

  const recommendations = getSmartRecommendations(rawModels);
  const freeCount = rawModels.filter((m) => m.pricing?.isFree).length;

  return {
    success: true,
    models: rawModels,
    recommendations,
    totalCount: rawModels.length,
    freeCount,
    syncedAt: new Date().toISOString(),
    source: 'official_provider_api',
  };
}

/**
 * Verify key validity live against provider
 */
export async function verifyProviderKey({ provider, apiKey, baseUrl }) {
  const cleanKey = (apiKey || '').trim();
  const cleanBaseUrl = (baseUrl || '').trim();

  // Try edge verify first
  try {
    const edgeRes = await fetch('/api/ai/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey: cleanKey, baseUrl: cleanBaseUrl }),
    });
    if (edgeRes.ok) {
      const edgeData = await edgeRes.json();
      if (edgeData.success) return edgeData;
    }
  } catch (e) {}

  // Direct adapter verification
  const adapter = getProviderAdapter(provider);
  return adapter.verifyKey(cleanKey, cleanBaseUrl);
}

/**
 * Generate 5-8 smart recommended models from catalog
 * Priority:
 * 1. Verified Free / Free Eligible with Multimodal / Vision
 * 2. High-speed conversational models
 * 3. Deep reasoning / grammar models
 * 4. Largest context window models
 */
export function getSmartRecommendations(models = []) {
  if(elioAIAdmin()?.isActive())return elioAIAdmin().recommend(models);
  if (!models || models.length === 0) return [];

  // Sort candidates by score
  const scored = models.map((m) => {
    let score = 0;

    // Highest boost for Verified Free and Free Eligible
    if (m.pricing?.tier === MODEL_TIERS.VERIFIED_FREE) score += 1000;
    else if (m.pricing?.tier === MODEL_TIERS.FREE_ELIGIBLE) score += 800;
    else if (m.pricing?.tier === MODEL_TIERS.ZERO_PRICE) score += 600;
    else score -= 200; // Demote paid models from primary recommendation

    // Boost for vision capability (essential for OCR & exam reading)
    if (m.capabilities?.vision) score += 250;

    // Boost for reasoning capability (essential for CEFR grading & grammar)
    if (m.capabilities?.reasoning) score += 150;

    // Boost for modern frontier models (2.5, 3.7, r1, o3, 4.5, 3.3)
    const lower = (m.id || '').toLowerCase();
    if (lower.includes('2.5') || lower.includes('3.7') || lower.includes('r1') || lower.includes('o3') || lower.includes('4.5')) score += 320;
    else if (lower.includes('2.0') || lower.includes('3.3') || lower.includes('3.5')) score += 180;

    // Demote legacy / deprecated models
    if (lower.includes('001') || lower.includes('vision-preview')) score -= 100;

    return { model: m, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top 6 - 8 distinct models
  const top = scored.slice(0, 8).map((s) => s.model);
  return top;
}

/**
 * Filter and sort full model catalog with options
 */
export function filterAndSortCatalog(models = [], {
  searchQuery = '',
  filter = 'free', // 'all', 'free', 'vision', 'audio', 'reasoning', 'long_context'
  sortBy = 'free_first', // 'free_first', 'name', 'context', 'newest'
  policy = DEFAULT_AI_POLICY,
} = {}) {
  let list = [...models];

  // 1. Text Search Filter (Model ID or Name)
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(
      (m) =>
        (m.id || '').toLowerCase().includes(q) ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.desc || '').toLowerCase().includes(q)
    );
  }

  // 2. Category Filter
  if (filter === 'free') {
    list = list.filter((m) => m.pricing?.isFree || m.pricing?.tier === MODEL_TIERS.VERIFIED_FREE || m.pricing?.tier === MODEL_TIERS.FREE_ELIGIBLE || m.pricing?.tier === MODEL_TIERS.ZERO_PRICE);
  } else if (filter === 'vision') {
    list = list.filter((m) => m.capabilities?.vision);
  } else if (filter === 'audio') {
    list = list.filter((m) => m.capabilities?.audio);
  } else if (filter === 'reasoning') {
    list = list.filter((m) => m.capabilities?.reasoning);
  } else if (filter === 'long_context') {
    list = list.filter((m) => (m.contextLimit || 0) >= 64000);
  }

  // 3. Strict FREE_ONLY policy enforcement if enabled
  if (policy.FREE_ONLY && filter !== 'all') {
    list = list.filter((m) => m.pricing?.isFree || m.pricing?.tier === MODEL_TIERS.VERIFIED_FREE || m.pricing?.tier === MODEL_TIERS.FREE_ELIGIBLE);
  }

  // 4. Sorting
  list.sort((a, b) => {
    // Free First Sort
    if (sortBy === 'free_first' || policy.FREE_FIRST_SORT) {
      const aFree = a.pricing?.isFree ? 1 : 0;
      const bFree = b.pricing?.isFree ? 1 : 0;
      if (aFree !== bFree) return bFree - aFree;
    }

    if (sortBy === 'context') {
      return (b.contextLimit || 0) - (a.contextLimit || 0);
    }

    if (sortBy === 'newest') {
      const aDate = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const bDate = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      if (aDate !== bDate) return bDate - aDate;
    }

    // Default alphabetical
    return (a.name || a.id).localeCompare(b.name || b.id);
  });

  return list;
}

/**
 * Cache catalog in localStorage / dbState
 */
export function saveDiscoveredCatalog(providerId, models, baseUrl = '') {
  if(elioAIAdmin()?.isActive())return;
  try {
    db.aiModelCatalogs?.saveCatalog?.(providerId, models, baseUrl);
  } catch (e) {
    console.error('Lỗi khi lưu catalog vào cache:', e);
  }
}

/**
 * Get cached catalog for provider
 */
export function getCachedCatalog(providerId) {
  if(elioAIAdmin()?.isActive())return elioAIAdmin().getCatalog(providerId);
  try {
    return db.aiModelCatalogs?.getCatalog?.(providerId) || null;
  } catch (e) {
    return null;
  }
}

