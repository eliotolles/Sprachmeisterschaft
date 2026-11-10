import {installListeningRuntime} from './elio-listening-runtime.js';
import {installAIAdminRuntime} from './elio-ai-admin-runtime.js';
import {installElioAuthentication,elioAuthentication} from './elio-auth-runtime.js';
import { formatDate, addDays, calculateStreak } from './algorithms';
import { mergePersonalAndSharedVocabulary, mapSharedElioCard } from './shared-vocabulary.js';
import { keepOtherAccountElioReview } from './elio-review-ownership.js';
import { LISTENING_COLLECTIONS, LISTENING_EPISODES } from '@/data/listening-collections';
import { rescheduleMissedTasks } from './study-plan-generator.js';

const STORAGE_KEY = 'sprachmeisterschaft_db_v1';
const AUTH_KEY = 'sprachmeisterschaft_auth_v1';

import { SYSTEM_ADMIN_EMAILS } from './SYSTEM_ADMIN_EMAILS.js';
export { SYSTEM_ADMIN_EMAILS };
const CF_ADMINS_STORAGE_KEY = 'sprach_cloudflare_admin_emails';

export function getCachedCloudflareAdmins() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CF_ADMINS_STORAGE_KEY) : null;
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : '')).filter(Boolean);
      }
    }
  } catch (e) {}
  return [];
}

export function isSystemAdminEmail(email = '') {
  const binding=elioAuthentication();if(binding&&binding.getMode()!=='legacy')return binding.isAdminEmail(email);
  if (!email) return false;
  const clean = email.trim().toLowerCase();

  // 1. Check against Cloudflare environment variables / secrets synced from edge (/api/auth/admins)
  const cfAdmins = getCachedCloudflareAdmins();
  if (cfAdmins.includes(clean)) return true;

  // 2. Check fallback default admin emails
  if (SYSTEM_ADMIN_EMAILS.includes(clean)) return true;

  // 3. Keyword check
  return clean.includes('admin');
}

export async function syncCloudflareAdminEmails() {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/auth/admins');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.admins) && data.admins.length > 0) {
        const cleaned = data.admins
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter(Boolean);
        localStorage.setItem(CF_ADMINS_STORAGE_KEY, JSON.stringify(cleaned));

        // If current user matches any Cloudflare admin email, ensure admin role
        const rawUser = localStorage.getItem(AUTH_KEY);
        if (rawUser) {
          const user = JSON.parse(rawUser);
          if (user && isSystemAdminEmail(user.email) && user.role !== 'admin') {
            user.role = 'admin';
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            localStorage.setItem('sprach_is_admin', 'true');
            window.dispatchEvent(new CustomEvent('sprach_auth_change'));
          }
        }
        window.dispatchEvent(new CustomEvent('sprach_admins_synced', { detail: cleaned }));
        return cleaned;
      }
    }
  } catch (err) {
    // Edge API not reachable in some offline environments
  }
  return getCachedCloudflareAdmins();
}

// Auto-sync on client boot
if (typeof window !== 'undefined') {
  syncCloudflareAdminEmails().catch(() => {});
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure new schemas exist
      if (!parsed.users) parsed.users = [];
      if (!parsed.aiConfigs) parsed.aiConfigs = [];
      if (!parsed.aiTaskAssignments) parsed.aiTaskAssignments = {};
      if (!parsed.uiVoiceConfig) {
        parsed.uiVoiceConfig = { fontFamily: 'sans', speechVoice: '', rate: 0.9, pitch: 1.0 };
      }
      if (!parsed.listeningCollections) parsed.listeningCollections = [];
      if (!parsed.listeningEpisodes) parsed.listeningEpisodes = [];
      if (!parsed.userProfiles) parsed.userProfiles = {};
      if (Array.isArray(parsed.users)) {
        // Ensure dat.nguyenviet.1999@gmail.com is present as Super Admin
        const masterAdminEmail = 'dat.nguyenviet.1999@gmail.com';
        let datAdmin = parsed.users.find((u) => u.email?.toLowerCase() === masterAdminEmail);
        if (!datAdmin) {
          datAdmin = {
            id: 'usr_dat_admin',
            name: 'Nguyễn Việt Đạt (Super Admin)',
            email: masterAdminEmail,
            password: 'admin123',
            role: 'admin',
            is_blocked: false,
            onboarding_completed: true,
            study_plan: null,
            created_at: new Date().toISOString(),
          };
          parsed.users.unshift(datAdmin);
        } else {
          datAdmin.role = 'admin';
        }

        parsed.users.forEach((u) => {
          if (isSystemAdminEmail(u.email)) {
            u.role = 'admin';
          }
          if (!u.password) {
            u.password = (u.role === 'admin' || isSystemAdminEmail(u.email)) ? 'admin123' : 'deutschmaster123';
          }
        });
      }
      if (!parsed.universalImports) parsed.universalImports = [];
      if (!parsed.studyPlans) parsed.studyPlans = {};
      if (!parsed.aiTaskPools) parsed.aiTaskPools = {};
      if (!parsed.aiCooldowns) parsed.aiCooldowns = {};
      if (!parsed.aiModelCatalogs) parsed.aiModelCatalogs = {};
      if (!parsed.aiPolicies) {
        parsed.aiPolicies = {
          FREE_ONLY: true,
          FREE_FIRST_SORT: true,
          ALLOW_PAID_MODELS: false,
          AUTO_PAID_FALLBACK: false,
          REQUIRE_ADMIN_APPROVAL_FOR_PAID: true,
        };
      }
      if (!parsed.aiAuditLogs) parsed.aiAuditLogs = [];
      if (!parsed.deletedGrammarIds) parsed.deletedGrammarIds = [];
      if (!parsed.grammarOverrides) parsed.grammarOverrides = {};
      if (!parsed.deletedExamIds) parsed.deletedExamIds = [];
      if (!parsed.examOverrides) parsed.examOverrides = {};
      if (!parsed.deletedSituationIds) parsed.deletedSituationIds = [];
      if (!parsed.situationOverrides) parsed.situationOverrides = {};
      if (!parsed.deletedVocabularyIds) parsed.deletedVocabularyIds = [];
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load database:', e);
  }

  // Initial clean database with Super Admin, Admin & Student
  return {
    users: [
      {
        id: 'usr_dat_admin',
        name: 'Nguyễn Việt Đạt (Super Admin)',
        email: 'dat.nguyenviet.1999@gmail.com',
        password: 'admin123',
        role: 'admin',
        is_blocked: false,
        onboarding_completed: true,
        study_plan: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr_admin',
        name: 'Quản trị viên Hệ thống (Master Admin)',
        email: 'admin@sprachmeisterschaft.de',
        password: 'admin123',
        role: 'admin',
        is_blocked: false,
        onboarding_completed: true,
        study_plan: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr_student',
        name: 'Nguyễn Văn Đạt (Học viên)',
        email: 'hocvien@sprachmeisterschaft.de',
        password: 'deutschmaster123',
        role: 'user',
        is_blocked: false,
        onboarding_completed: false,
        study_plan: null,
        created_at: new Date().toISOString(),
      },
    ],
    userProfiles: {
      usr_admin: {
        id: 'profile_usr_admin',
        user_id: 'usr_admin',
        display_name: 'Quản trị viên Hệ thống',
        exam_date: addDays(formatDate(), 60),
        daily_goal: 30,
        target_level: 'C1',
      },
      usr_student: {
        id: 'profile_usr_student',
        user_id: 'usr_student',
        display_name: 'Nguyễn Văn Đạt (Học viên)',
        exam_date: addDays(formatDate(), 45),
        daily_goal: 20,
        target_level: 'B1',
      },
    },
    deletedGrammarIds: [],
    grammarOverrides: {},
    deletedExamIds: [],
    examOverrides: {},
    deletedSituationIds: [],
    situationOverrides: {},
    aiConfigs: [
      {
        id: 'ai-cfg-gemini',
        name: 'Gemini 2.0 Flash (Chính)',
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        apiKey: '',
        hasVision: true,
        priority: 1,
        enabled: true,
      },
      {
        id: 'ai-cfg-groq',
        name: 'Groq Llama 3.3 70B (Siêu tốc)',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        apiKey: '',
        hasVision: false,
        priority: 2,
        enabled: true,
      },
      {
        id: 'ai-cfg-openrouter',
        name: 'OpenRouter Qwen 2.5 (Ngữ pháp)',
        provider: 'openrouter',
        model: 'qwen/qwen-2.5-72b-instruct:free',
        apiKey: '',
        hasVision: false,
        priority: 3,
        enabled: true,
      },
    ],
    aiTaskAssignments: {
      ocr_image: { provider: 'gemini', model: 'gemini-2.0-flash' },
      writing_grading: { provider: 'gemini', model: 'gemini-2.0-flash' },
      elio_chat: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      interview: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      grammar_deep: { provider: 'openrouter', model: 'qwen/qwen-2.5-72b-instruct:free' },
      audio_subtitles: { provider: 'groq', model: 'whisper-large-v3' },
      speaking_eval: { provider: 'gemini', model: 'gemini-2.0-flash' },
    },
    uiVoiceConfig: {
      fontFamily: 'sans',
      speechVoice: '',
      rate: 0.9,
      pitch: 1.0,
    },
    listeningCollections: [],
    listeningEpisodes: [],
    universalImports: [],
    vocabularyCards: [],
    studyLogs: [
      {
        id: 'log_seed_1',
        date: formatDate(),
        cards_reviewed: 0,
        new_words: 0,
        xp: 0,
        minutes: 0,
      },
    ],
    skillSessions: [],
    examResults: [],
    learnerProfile: {
      id: 'profile_default',
      display_name: 'Người học tiếng Đức',
      exam_date: addDays(formatDate(), 45), // Default exam in 45 days
      daily_goal: 20,
      target_level: 'B1',
    },
    notes: [
      {
        id: 'note_welcome',
        title: 'Chào mừng đến với Sprachmeisterschaft',
        content: 'Đây là sổ tay ghi chú của bạn. Bạn có thể lưu lại các cấu trúc ngữ pháp hay, bài mẫu viết thư hoặc từ vựng đáng chú ý trong quá trình học.',
        type: 'note',
        created_at: new Date().toISOString(),
      },
    ],
  };
}

function saveDatabase(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('sprach_db_change'));
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

// Global in-memory cache
let state = loadDatabase();

// Shared catalog is kept in memory only: never persisted with account data.
let sharedVocabularyRows = [];
let sharedVocabularyLoading = null;
let sharedVocabularyLoaded = false;
async function loadSharedVocabularyOnce() {
  if (sharedVocabularyLoaded || sharedVocabularyLoading || typeof window === 'undefined') return sharedVocabularyLoading;
  sharedVocabularyLoading = (async () => {
    const collected = [];
    const ids = new Set();
    for (let offset = 0; offset < 10000; offset += 200) {
      const response = await fetch(`/api/content/elio-vocabulary?limit=200&offset=${offset}`);
      if (!response.ok) throw new Error('Shared catalog unavailable');
      const payload = await response.json();
      if (!payload.success || !Array.isArray(payload.cards)) throw new Error('Invalid shared catalog response');
      for (const row of payload.cards) {
        const card = mapSharedElioCard(row);
        if (ids.has(card.id)) throw new Error('Duplicate shared vocabulary ID');
        ids.add(card.id);
        collected.push(row);
      }
      if (payload.cards.length < 200) {
        sharedVocabularyRows = collected;
        sharedVocabularyLoaded = true;
        window.dispatchEvent(new CustomEvent('sprach_db_change'));
        return;
      }
    }
    throw new Error('Shared catalog exceeded safe pagination limit');
  })().catch(() => {
    // Fail closed: do not repeatedly hammer a disabled endpoint on every render.
    // Reloading the page is sufficient after enabling a preview deployment.
    sharedVocabularyRows = [];
    sharedVocabularyLoaded = true;
  }).finally(() => { sharedVocabularyLoading = null; });
  return sharedVocabularyLoading;
}


export const db = {
  // Vocabulary Cards
  vocabulary: {
    findMany: (filter = {}) => {
      const curUser = db.auth.getUser();
      const currentUserId = curUser?.id || 'usr_student';
      // Load the public catalog lazily. A disabled preview endpoint leaves personal cards intact.
      void loadSharedVocabularyOnce();
      let cards = [...(state.vocabularyCards || [])];

      // Isolate cards by user (fallback for legacy cards without user_id to usr_student)
      cards = cards.filter((c) => {
        if (!c.user_id) return currentUserId === 'usr_student' || !curUser;
        return c.user_id === currentUserId;
      });

      // Shared cards are immutable templates; personal copies (same ID) override them.
      cards = mergePersonalAndSharedVocabulary(cards, sharedVocabularyRows).map(card =>
        card.is_shared ? { ...card, status: 'new' } : card
      );

      const deletedIds = state.deletedVocabularyIds || [];
      if (deletedIds.length > 0) {
        cards = cards.filter((c) => !deletedIds.includes(c.id) && (!c.source_id || !deletedIds.includes(c.source_id)));
      }

      if (filter.status && filter.status !== 'all') {
        cards = cards.filter((c) => c.status === filter.status);
      }
      if (filter.topic && filter.topic !== 'all') {
        cards = cards.filter((c) => c.topic === filter.topic);
      }
      if (filter.level && filter.level !== 'all') {
        cards = cards.filter((c) => c.level === filter.level);
      }
      if (filter.dueToday) {
        const today = formatDate();
        cards = cards.filter((c) => !c.due_date || c.due_date <= today);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        cards = cards.filter(
          (c) =>
            (c.german || '').toLowerCase().includes(q) ||
            (c.vietnamese || '').toLowerCase().includes(q)
        );
      }
      return cards;
    },

    findById: (id) => state.vocabularyCards.find((c) => c.id === id &&
      (c.user_id === (db.auth.getUser()?.id || 'usr_student') || (!c.user_id && (db.auth.getUser()?.id || 'usr_student') === 'usr_student'))) ||
      (sharedVocabularyRows.find((r) => `elio_shared_${r.source_id}` === id)
        ? { ...mapSharedElioCard(sharedVocabularyRows.find((r) => `elio_shared_${r.source_id}` === id)), status: 'new' }
        : null),

    create: (cardData) => {
      const curUser = db.auth.getUser();
      const currentUserId = curUser?.id || 'usr_student';
      const today = formatDate();
      const newCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: currentUserId,
        german: cardData.german,
        article: cardData.article || '',
        word_type: cardData.word_type || 'noun',
        vietnamese: cardData.vietnamese,
        example_de: cardData.example_de || '',
        example_vi: cardData.example_vi || '',
        topic: cardData.topic || 'alltag',
        level: cardData.level || 'B1',
        status: cardData.status || 'new',
        ease_factor: cardData.ease_factor ?? 2.5,
        interval_days: cardData.interval_days ?? 0,
        repetitions: cardData.repetitions ?? 0,
        lapses: cardData.lapses ?? 0,
        due_date: cardData.due_date || today,
        last_reviewed: cardData.last_reviewed || null,
        created_at: new Date().toISOString(),
      };
      state.vocabularyCards.unshift(newCard);
      saveDatabase(state);
      return newCard;
    },

    createMany: (cardsArray) => {
      const curUser = db.auth.getUser();
      const currentUserId = curUser?.id || 'usr_student';
      const today = formatDate();
      const userCards = (state.vocabularyCards || []).filter(
        (c) => c.user_id === currentUserId || (!c.user_id && currentUserId === 'usr_student')
      );
      const existingKeys = new Set(
        userCards.map(
          (c) => `${(c.article || '').trim()} ${(c.german || '').trim()}`.toLowerCase()
        )
      );

      const added = [];
      for (const item of cardsArray) {
        const key = `${(item.article || '').trim()} ${(item.german || '').trim()}`.toLowerCase();
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          const card = {
            id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            user_id: currentUserId,
            german: item.german,
            article: item.article || '',
            word_type: item.word_type || 'noun',
            vietnamese: item.vietnamese,
            example_de: item.example_de || '',
            example_vi: item.example_vi || '',
            topic: item.topic || 'alltag',
            level: item.level || 'B1',
            status: 'new',
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            lapses: 0,
            due_date: today,
            last_reviewed: null,
            created_at: new Date().toISOString(),
          };
          state.vocabularyCards.push(card);
          added.push(card);
        }
      }
      if (added.length > 0) {
        saveDatabase(state);
      }
      return added;
    },

    update: (id, updates) => {
      // First review of a shared template creates a personal copy, never mutating the source.
      if (String(id).startsWith('elio_shared_') && !(state.vocabularyCards || []).some(c => c.id === id && c.user_id === db.auth.getUser()?.id)) {
        const row = sharedVocabularyRows.find(r => `elio_shared_${r.source_id}` === id);
        if (!row) return null;
        const currentUserId = db.auth.getUser()?.id;
        if (!currentUserId) return null;
        state.vocabularyCards.push({
          ...mapSharedElioCard(row),
          is_shared: false,
          user_id: currentUserId,
          status: 'new',
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          lapses: 0,
          due_date: formatDate(),
        });
      }
      const idx = state.vocabularyCards.findIndex((c) => c.id === id &&
        (c.user_id === (db.auth.getUser()?.id || 'usr_student') || (!c.user_id && (db.auth.getUser()?.id || 'usr_student') === 'usr_student')));
      if (idx !== -1) {
        const safeUpdates = String(id).startsWith('elio_shared_')
          ? Object.fromEntries(Object.entries(updates || {}).filter(([key]) =>
              !['id', 'user_id', 'source_id', 'source', 'is_shared'].includes(key)))
          : updates;
        state.vocabularyCards[idx] = { ...state.vocabularyCards[idx], ...safeUpdates };
        saveDatabase(state);
        return state.vocabularyCards[idx];
      }
      return null;
    },

    delete: (id) => {
      if (!state.deletedVocabularyIds) state.deletedVocabularyIds = [];
      if (!state.deletedVocabularyIds.includes(id)) {
        state.deletedVocabularyIds.push(id);
      }
      const curUser = db.auth.getUser();
      const currentUserId = curUser?.id;
      state.vocabularyCards = state.vocabularyCards.filter((c) => {
        if (c.id === id) {
          // Shared Elio reviews are per-user even for admins; identical IDs
          // must never delete another account's personal review history.
          if (keepOtherAccountElioReview(c, currentUserId)) return true;
          if (currentUserId && c.user_id && c.user_id !== currentUserId && !db.auth.isAdmin()) {
            return true; // Keep card belonging to another user
          }
          return false;
        }
        return true;
      });
      saveDatabase(state);
      return true;
    },

    deleteByTopic: (topic) => {
      const curUser = db.auth.getUser();
      const currentUserId = curUser?.id;
      state.vocabularyCards = state.vocabularyCards.filter((c) => {
        if (c.topic === topic) {
          if (keepOtherAccountElioReview(c, currentUserId)) return true;
          if (currentUserId && c.user_id && c.user_id !== currentUserId && !db.auth.isAdmin()) {
            return true;
          }
          return false;
        }
        return true;
      });
      saveDatabase(state);
      return true;
    },

    deleteByLevel: (level) => {
      const curUser = db.auth.getUser();
      const currentUserId = curUser?.id;
      state.vocabularyCards = state.vocabularyCards.filter((c) => {
        if (c.level === level) {
          if (keepOtherAccountElioReview(c, currentUserId)) return true;
          if (currentUserId && c.user_id && c.user_id !== currentUserId && !db.auth.isAdmin()) {
            return true;
          }
          return false;
        }
        return true;
      });
      saveDatabase(state);
      return true;
    },

    clearAll: () => {
      const curUser = db.auth.getUser();
      const currentUserId = curUser?.id;
      if (!currentUserId) {
        // Preserve Elio review forks belonging to signed-in accounts.
        state.vocabularyCards = state.vocabularyCards.filter(
          (c) => keepOtherAccountElioReview(c, null)
        );
      } else {
        // Only clear current user's cards; never clear another Elio review fork.
        state.vocabularyCards = state.vocabularyCards.filter(
          (c) => String(c.id).startsWith('elio_shared_')
            ? keepOtherAccountElioReview(c, currentUserId)
            : c.user_id && c.user_id !== currentUserId
        );
      }
      saveDatabase(state);
      return true;
    },
  },

  // Study Logs (One per day, accumulated per user)
  studyLogs: {
    findMany: () => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      return (state.studyLogs || []).filter((l) => !l.user_id || l.user_id === userId);
    },

    getToday: () => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      const today = formatDate();
      let log = (state.studyLogs || []).find(
        (l) => l.date === today && (!l.user_id || l.user_id === userId)
      );
      if (!log) {
        log = {
          id: `log_${today}_${userId}`,
          user_id: userId,
          date: today,
          cards_reviewed: 0,
          new_words: 0,
          xp: 0,
          minutes: 0,
        };
        state.studyLogs.unshift(log);
        saveDatabase(state);
      }
      return log;
    },

    recordActivity: ({ cardsReviewed = 0, newWords = 0, xp = 0, minutes = 0 }) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      const today = formatDate();
      let log = (state.studyLogs || []).find(
        (l) => l.date === today && (!l.user_id || l.user_id === userId)
      );
      if (!log) {
        log = {
          id: `log_${today}_${userId}`,
          user_id: userId,
          date: today,
          cards_reviewed: 0,
          new_words: 0,
          xp: 0,
          minutes: 0,
        };
        state.studyLogs.unshift(log);
      }

      log.cards_reviewed = (log.cards_reviewed || 0) + cardsReviewed;
      log.new_words = (log.new_words || 0) + newWords;
      log.xp = (log.xp || 0) + xp;
      log.minutes = (log.minutes || 0) + minutes;

      saveDatabase(state);
      return log;
    },
  },

  // Skill Sessions
  skillSessions: {
    findMany: (filter = {}) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      let sessions = (state.skillSessions || []).filter(
        (s) => !s.user_id || s.user_id === userId
      );
      if (filter.skill) {
        sessions = sessions.filter((s) => s.skill === filter.skill);
      }
      // Newest first
      return sessions.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    },

    create: (data) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      const session = {
        id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: userId,
        skill: data.skill,
        score: Number(data.score) || 0,
        title: data.title || '',
        details: typeof data.details === 'string' ? data.details : JSON.stringify(data.details || {}),
        duration_seconds: Number(data.duration_seconds) || 0,
        date: data.date || formatDate(),
        created_at: new Date().toISOString(),
      };
      state.skillSessions.unshift(session);
      saveDatabase(state);
      return session;
    },
  },

  // Exam Results
  examResults: {
    findMany: (filter = {}) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      let results = (state.examResults || []).filter(
        (r) => !r.user_id || r.user_id === userId
      );
      if (filter.exam_id) {
        results = results.filter((r) => r.exam_id === filter.exam_id);
      }
      if (filter.level) {
        results = results.filter((r) => r.level === filter.level);
      }
      return results.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    },

    create: (data) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      const examResult = {
        id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: userId,
        exam_id: data.exam_id || '',
        provider: data.provider || 'Goethe',
        title: data.title || '',
        level: data.level || 'B1',
        mc_score: Number(data.mc_score) || 0,
        mc_total: Number(data.mc_total) || 0,
        writing_score: Number(data.writing_score) || 0,
        total: Number(data.total) || 0,
        passed: Boolean(data.passed),
        duration_seconds: Number(data.duration_seconds) || 0,
        feedback: typeof data.feedback === 'string' ? data.feedback : JSON.stringify(data.feedback || {}),
        date: data.date || formatDate(),
        created_at: new Date().toISOString(),
      };
      state.examResults.unshift(examResult);
      saveDatabase(state);
      return examResult;
    },
  },

  // Learner Profile (Isolated per-user profile)
  learnerProfile: {
    get: () => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      if (!state.userProfiles) state.userProfiles = {};

      if (!state.userProfiles[userId]) {
        state.userProfiles[userId] = {
          id: `profile_${userId}`,
          user_id: userId,
          display_name: curUser?.name || curUser?.email?.split('@')[0] || 'Học viên',
          exam_date: addDays(formatDate(), 45),
          daily_goal: 20,
          target_level: 'B1',
        };
        saveDatabase(state);
      }
      return { ...state.userProfiles[userId] };
    },

    update: (updates) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      if (!state.userProfiles) state.userProfiles = {};

      const existing = state.userProfiles[userId] || {
        id: `profile_${userId}`,
        user_id: userId,
        display_name: curUser?.name || 'Học viên',
        exam_date: addDays(formatDate(), 45),
        daily_goal: 20,
        target_level: 'B1',
      };

      state.userProfiles[userId] = { ...existing, ...updates };

      // Sync display name with curUser & state.users if present
      if (updates.display_name && curUser) {
        curUser.name = updates.display_name;
        localStorage.setItem(AUTH_KEY, JSON.stringify(curUser));
        const uIdx = (state.users || []).findIndex(
          (u) => u.id === curUser.id || u.email?.toLowerCase() === curUser?.email?.toLowerCase()
        );
        if (uIdx !== -1) {
          state.users[uIdx].name = updates.display_name;
        }
      }

      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return { ...state.userProfiles[userId] };
    },
  },

  // Notes (Isolated per-user notes)
  notes: {
    findMany: (filter = {}) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      let notes = (state.notes || []).filter(
        (n) => !n.user_id || n.user_id === userId
      );
      if (filter.type && filter.type !== 'all') {
        notes = notes.filter((n) => n.type === filter.type);
      }
      return notes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    },

    create: (noteData) => {
      const curUser = db.auth.getUser();
      const userId = curUser?.id || 'usr_student';
      const note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: userId,
        title: noteData.title,
        content: noteData.content || '',
        type: noteData.type || 'note',
        created_at: new Date().toISOString(),
      };
      state.notes.unshift(note);
      saveDatabase(state);
      return note;
    },

    update: (id, updates) => {
      const idx = state.notes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        state.notes[idx] = { ...state.notes[idx], ...updates, updated_at: new Date().toISOString() };
        saveDatabase(state);
        return state.notes[idx];
      }
      return null;
    },

    delete: (id) => {
      state.notes = state.notes.filter((n) => n.id !== id);
      saveDatabase(state);
      return true;
    },
  },

  // Auth Management
  auth: {
    getUser: () => {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (raw) {
          const u = JSON.parse(raw);
          if (u && isSystemAdminEmail(u.email) && u.role !== 'admin') {
            u.role = 'admin';
            localStorage.setItem(AUTH_KEY, JSON.stringify(u));
          }
          return u;
        }
      } catch (e) {}
      return null;
    },

    login: (email, password = '') => {
      if (!email || !email.trim()) {
        throw new Error('Vui lòng nhập địa chỉ email.');
      }

      const cleanEmail = email.trim().toLowerCase();
      const isSysAdmin = isSystemAdminEmail(cleanEmail);

      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);

      // Auto-initialize system admin if not existing in state
      if (!user && isSysAdmin) {
        user = {
          id: cleanEmail === 'dat.nguyenviet.1999@gmail.com' ? 'usr_dat_admin' : 'usr_admin_' + Date.now(),
          name: cleanEmail === 'dat.nguyenviet.1999@gmail.com' ? 'Nguyễn Việt Đạt (Super Admin)' : 'Quản trị viên Hệ thống',
          email: cleanEmail,
          password: password || 'admin123',
          role: 'admin',
          is_blocked: false,
          is_verified: true,
          onboarding_completed: true,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.unshift(user);
        saveDatabase(state);
      }

      // If user does not exist yet: seamlessly auto-register them as a new learner
      if (!user) {
        user = {
          id: 'usr_' + Date.now(),
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          password: password || '123456',
          role: isSysAdmin ? 'admin' : 'user',
          is_blocked: false,
          is_verified: true,
          onboarding_completed: false,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.push(user);
        saveDatabase(state);
      }

      // Password verification:
      // For System Admin: allow login with any password (and update password if typed)
      if (isSysAdmin) {
        if (password) {
          user.password = password;
          saveDatabase(state);
        }
      } else {
        // For normal users: check password unless created via Google
        if (user.password && password && user.password !== password && user.provider !== 'google') {
          throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
        }
        if (user.provider === 'google' && password) {
          user.password = password;
          saveDatabase(state);
        }
      }

      // Ensure system admin role
      if (isSysAdmin) {
        user.role = 'admin';
      }

      // Ensure per-user profile exists
      if (!state.userProfiles) state.userProfiles = {};
      if (!state.userProfiles[user.id]) {
        state.userProfiles[user.id] = {
          id: `profile_${user.id}`,
          user_id: user.id,
          display_name: user.name || cleanEmail.split('@')[0],
          exam_date: addDays(formatDate(), 45),
          daily_goal: 20,
          target_level: 'B1',
        };
        saveDatabase(state);
      }

      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      sessionStorage.removeItem('sprach_onboarding_dismissed');

      if (user.role === 'admin') {
        localStorage.setItem('sprach_is_admin', 'true');
        localStorage.setItem('sprach_master_admin_override', 'true');
      } else {
        localStorage.removeItem('sprach_is_admin');
        localStorage.removeItem('sprach_master_admin_override');
      }

      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return user;
    },

    loginWithGoogle: (profile = {}) => {
      const cleanEmail = (profile.email || 'dat.nguyenviet.1999@gmail.com').trim().toLowerCase();
      const isSysAdmin = isSystemAdminEmail(cleanEmail);
      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: isSysAdmin ? 'usr_dat_admin' : 'usr_gg_' + Date.now(),
          email: cleanEmail,
          name: profile.name || cleanEmail.split('@')[0],
          picture: profile.picture || null,
          provider: 'google',
          password: 'google_oauth_pass',
          role: isSysAdmin ? 'admin' : 'user',
          is_verified: true,
          onboarding_completed: false,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.push(user);
      } else {
        if (profile.picture) user.picture = profile.picture;
      }

      // Ensure user profile exists
      if (!state.userProfiles) state.userProfiles = {};
      if (!state.userProfiles[user.id]) {
        state.userProfiles[user.id] = {
          id: `profile_${user.id}`,
          user_id: user.id,
          display_name: profile.name || user.name,
          exam_date: addDays(formatDate(), 45),
          daily_goal: 20,
          target_level: 'B1',
        };
      }
      saveDatabase(state);

      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      sessionStorage.removeItem('sprach_onboarding_dismissed');
      if (user.role === 'admin') {
        localStorage.setItem('sprach_is_admin', 'true');
        localStorage.setItem('sprach_master_admin_override', 'true');
      } else {
        localStorage.removeItem('sprach_is_admin');
        localStorage.removeItem('sprach_master_admin_override');
      }

      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return user;
    },

    loginAsDemo: () => {
      const cleanEmail = 'hocvien@sprachmeisterschaft.de';
      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: 'usr_student',
          email: cleanEmail,
          password: 'deutschmaster123',
          name: 'Nguyễn Văn Đạt (Học viên)',
          provider: 'demo',
          role: 'user',
          is_verified: true,
          onboarding_completed: false,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.push(user);
      }

      if (!state.userProfiles) state.userProfiles = {};
      if (!state.userProfiles[user.id]) {
        state.userProfiles[user.id] = {
          id: `profile_${user.id}`,
          user_id: user.id,
          display_name: user.name,
          exam_date: addDays(formatDate(), 45),
          daily_goal: 20,
          target_level: 'B1',
        };
      }
      saveDatabase(state);

      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      sessionStorage.removeItem('sprach_onboarding_dismissed');
      localStorage.removeItem('sprach_is_admin');
      localStorage.removeItem('sprach_master_admin_override');
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return user;
    },

    loginAsAdmin: () => {
      const cleanEmail = 'dat.nguyenviet.1999@gmail.com';
      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: 'usr_dat_admin',
          email: cleanEmail,
          password: 'admin123',
          name: 'Nguyễn Việt Đạt (Super Admin)',
          provider: 'system',
          role: 'admin',
          is_verified: true,
          onboarding_completed: true,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.unshift(user);
      } else {
        user.role = 'admin';
      }

      if (!state.userProfiles) state.userProfiles = {};
      if (!state.userProfiles[user.id]) {
        state.userProfiles[user.id] = {
          id: `profile_${user.id}`,
          user_id: user.id,
          display_name: user.name,
          exam_date: addDays(formatDate(), 60),
          daily_goal: 30,
          target_level: 'C1',
        };
      }
      saveDatabase(state);

      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem('sprach_master_admin_override', 'true');
      localStorage.setItem('sprach_is_admin', 'true');
      sessionStorage.removeItem('sprach_onboarding_dismissed');

      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return user;
    },

    register: (data) => {
      if (!data.email || !data.email.trim()) {
        throw new Error('Vui lòng cung cấp địa chỉ email hợp lệ.');
      }
      if (!data.password || data.password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
      }

      const cleanEmail = data.email.trim().toLowerCase();
      let existingUser = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (existingUser) {
        throw new Error('Email này đã được đăng ký tài khoản trong hệ thống. Vui lòng bấm Đăng nhập!');
      }

      const newUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        email: cleanEmail,
        password: data.password,
        name: data.name?.trim() || cleanEmail.split('@')[0],
        provider: 'email',
        role: isSystemAdminEmail(cleanEmail) ? 'admin' : 'user',
        is_verified: true,
        onboarding_completed: false,
        study_plan: null,
        created_at: new Date().toISOString(),
      };

      if (!state.users) state.users = [];
      state.users.push(newUser);

      // Create isolated personal profile
      if (!state.userProfiles) state.userProfiles = {};
      state.userProfiles[newUser.id] = {
        id: `profile_${newUser.id}`,
        user_id: newUser.id,
        display_name: newUser.name,
        exam_date: addDays(formatDate(), 45),
        daily_goal: 20,
        target_level: data.targetLevel || 'B1',
      };

      saveDatabase(state);

      localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      sessionStorage.removeItem('sprach_onboarding_dismissed');

      if (newUser.role === 'admin') {
        localStorage.setItem('sprach_is_admin', 'true');
        localStorage.setItem('sprach_master_admin_override', 'true');
      } else {
        localStorage.removeItem('sprach_is_admin');
        localStorage.removeItem('sprach_master_admin_override');
      }

      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return newUser;
    },

    verifyOtp: (code) => {
      const user = db.auth.getUser();
      if (user) {
        user.is_verified = true;
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        const idx = (state.users || []).findIndex(
          (u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase()
        );
        if (idx !== -1) {
          state.users[idx].is_verified = true;
          saveDatabase(state);
        }
        window.dispatchEvent(new CustomEvent('sprach_auth_change'));
        return true;
      }
      return false;
    },

    logout: () => {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('sprach_is_admin');
      localStorage.removeItem('sprach_master_admin_override');
      sessionStorage.removeItem('sprach_onboarding_dismissed');
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
    },

    isAdmin: () => {
      const u = db.auth.getUser();
      if (!u) return false;
      return u.role === 'admin';
    },

    toggleAdminMode: () => {
      const u = db.auth.getUser();
      if (!u) return false;
      // Only allow toggle if user is actually an admin or in local dev admin testing
      if (u.role !== 'admin' && !u.email?.includes('admin')) {
        return false;
      }
      return true;
    },

    setRole: (role) => {
      const u = db.auth.getUser();
      if (u) {
        u.role = role;
        if (role === 'admin') {
          localStorage.setItem('sprach_is_admin', 'true');
        } else {
          localStorage.removeItem('sprach_master_admin_override');
          localStorage.removeItem('sprach_is_admin');
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(u));
        if (state.users) {
          const idx = state.users.findIndex((x) => x.id === u.id);
          if (idx >= 0) {
            state.users[idx].role = role;
            saveDatabase(state);
          }
        }
        window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      }
    },
  },

  // User Management for Admin
  users: {
    findAll: () => [...(state.users || [])],
    findById: (id) => (state.users || []).find((u) => u.id === id),
    create: (userData) => {
      const newUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: userData.name || 'Người dùng mới',
        email: userData.email,
        role: userData.role || 'user',
        is_blocked: false,
        created_at: new Date().toISOString(),
      };
      state.users.unshift(newUser);
      saveDatabase(state);
      return newUser;
    },
    update: (id, updates) => {
      state.users = (state.users || []).map((u) =>
        u.id === id ? { ...u, ...updates } : u
      );
      saveDatabase(state);
      return state.users.find((u) => u.id === id);
    },
    toggleBlock: (id) => {
      state.users = (state.users || []).map((u) =>
        u.id === id ? { ...u, is_blocked: !u.is_blocked } : u
      );
      saveDatabase(state);
    },
    toggleRole: (id) => {
      state.users = (state.users || []).map((u) =>
        u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u
      );
      saveDatabase(state);
    },
    delete: (id) => {
      state.users = (state.users || []).filter((u) => u.id !== id);
      saveDatabase(state);
      return true;
    },
  },

  // Personalized Study Plan & Onboarding Management
  studyPlan: {
    get: (userId) => {
      const u = elioAuthentication()?.isActive() ? db.auth.getUser() : userId ? (state.users || []).find((usr) => usr.id === userId) : db.auth.getUser();
      if (!u || (userId && u.id !== userId)) return null;
      if (elioAuthentication()?.isActive()) return state.studyPlans?.[u.id] ?? null;
      const fullUser = (state.users || []).find(
        (usr) => usr.id === u.id || usr.email?.toLowerCase() === u.email?.toLowerCase()
      );
      return fullUser?.study_plan || u.study_plan || (state.studyPlans ? state.studyPlans[u.id] : null) || null;
    },

    save: (userId, answers, roadmap) => {
      const curUser = db.auth.getUser();
      const targetId = userId || curUser?.id;
      const coreAuth = elioAuthentication()?.isActive();
      if (!targetId || (coreAuth && targetId !== curUser?.id)) return null;

      // 1. Update in state.users
      const idx = coreAuth ? -1 : (state.users || []).findIndex(
        (u) => u.id === targetId || u.email?.toLowerCase() === curUser?.email?.toLowerCase()
      );
      if (idx !== -1) {
        state.users[idx].onboarding_completed = true;
        state.users[idx].onboarding_answers = answers;
        state.users[idx].study_plan = roadmap;
      }

      // 2. Also keep in state.studyPlans dictionary
      if (!state.studyPlans) state.studyPlans = {};
      state.studyPlans[targetId] = roadmap;

      // 3. Update learnerProfile for this specific user
      if (!state.userProfiles) state.userProfiles = {};
      const userProf = state.userProfiles[targetId] || {
        id: `profile_${targetId}`,
        user_id: targetId,
        display_name: curUser?.name || 'Học viên',
        exam_date: addDays(formatDate(), 45),
        daily_goal: 20,
        target_level: 'B1',
      };
      if (answers.targetLevel) {
        userProf.target_level = answers.targetLevel;
      }
      if (roadmap.meta?.targetDate) {
        userProf.exam_date = roadmap.meta.targetDate;
      }
      if (answers.dailyMinutes) {
        userProf.daily_goal = Math.round(answers.dailyMinutes / 2);
      }
      state.userProfiles[targetId] = userProf;

      saveDatabase(state);

      // 4. Update session user in AUTH_KEY
      if (curUser && !coreAuth) {
        curUser.onboarding_completed = true;
        curUser.onboarding_answers = answers;
        curUser.study_plan = roadmap;
        localStorage.setItem(AUTH_KEY, JSON.stringify(curUser));
      }

      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return roadmap;
    },

    toggleTask: (taskId) => {
      const curUser = db.auth.getUser();
      if (!curUser) return false;

      const idx = (state.users || []).findIndex(
        (u) => u.id === curUser.id || u.email?.toLowerCase() === curUser?.email?.toLowerCase()
      );
      if (idx === -1 || !state.users[idx].study_plan) return false;

      const plan = state.users[idx].study_plan;
      const task = (plan.dailyTasks || []).find((t) => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        saveDatabase(state);

        curUser.study_plan = plan;
        localStorage.setItem(AUTH_KEY, JSON.stringify(curUser));
        window.dispatchEvent(new CustomEvent('sprach_db_change'));
        return true;
      }
      return false;
    },

    reschedule: () => {
      const curUser = db.auth.getUser();
      if (!curUser) return null;
      const idx = (state.users || []).findIndex(
        (u) => u.id === curUser.id || u.email?.toLowerCase() === curUser?.email?.toLowerCase()
      );
      if (idx === -1 || !state.users[idx].study_plan) return null;

      const oldPlan = state.users[idx].study_plan;
      const newPlan = rescheduleMissedTasks(oldPlan);
      state.users[idx].study_plan = newPlan;
      saveDatabase(state);

      curUser.study_plan = newPlan;
      localStorage.setItem(AUTH_KEY, JSON.stringify(curUser));
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return newPlan;
    },

    shouldShowOnboarding: () => {
      if (typeof window === 'undefined') return false;
      const user = db.auth.getUser();
      if (!user) return false;

      // If user dismissed in this browser session, don't show repeatedly
      if (sessionStorage.getItem('sprach_onboarding_dismissed') === 'true') {
        return false;
      }

      if (elioAuthentication()?.isActive()) return !state.studyPlans?.[user.id];

      const fullUser = (state.users || []).find(
        (u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase()
      );
      const isCompleted = fullUser?.onboarding_completed ?? user.onboarding_completed;
      return !isCompleted;
    },

    dismissSession: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sprach_onboarding_dismissed', 'true');
      }
    },
  },

  // AI Providers & Tasks Assignment
  aiConfig: {
    getConfigs: () => [...(state.aiConfigs || [])],
    saveConfig: (config) => {
      const idx = (state.aiConfigs || []).findIndex((c) => c.id === config.id);
      if (idx >= 0) {
        state.aiConfigs[idx] = { ...state.aiConfigs[idx], ...config };
      } else {
        state.aiConfigs.push({
          id: config.id || `ai-cfg-${Date.now()}`,
          ...config,
        });
      }
      saveDatabase(state);
    },
    deleteConfig: (id) => {
      state.aiConfigs = (state.aiConfigs || []).filter((c) => c.id !== id);
      saveDatabase(state);
    },
    getAssignments: () => ({ ...(state.aiTaskAssignments || {}) }),
    setAssignment: (taskId, providerId, model) => {
      if (!state.aiTaskAssignments) state.aiTaskAssignments = {};
      state.aiTaskAssignments[taskId] = {
        provider: providerId,
        configId: providerId,
        model,
      };
      saveDatabase(state);
    },
    getTaskPool: (taskId) => {
      const configIds = state.aiTaskPools?.[taskId] || [];
      const configs = state.aiConfigs || [];
      const pooled = configIds
        .map((cid) => configs.find((c) => c.id === cid))
        .filter(Boolean);

      if (pooled.length === 0) {
        const assigned = state.aiTaskAssignments?.[taskId];
        if (assigned) {
          const match = configs.find(
            (c) => c.provider === assigned.provider && c.model === assigned.model
          );
          if (match) return [match];
        }
        return configs.slice(0, 2);
      }
      return pooled;
    },
    addToTaskPool: (taskId, configId) => {
      if (!state.aiTaskPools) state.aiTaskPools = {};
      if (!state.aiTaskPools[taskId]) state.aiTaskPools[taskId] = [];
      if (!state.aiTaskPools[taskId].includes(configId)) {
        state.aiTaskPools[taskId].push(configId);
        saveDatabase(state);
        window.dispatchEvent(new CustomEvent('sprach_db_change'));
      }
      return state.aiTaskPools[taskId];
    },
    removeFromTaskPool: (taskId, configId) => {
      if (!state.aiTaskPools || !state.aiTaskPools[taskId]) return;
      state.aiTaskPools[taskId] = state.aiTaskPools[taskId].filter((id) => id !== configId);
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return state.aiTaskPools[taskId];
    },
    setKeyCooldown: (configId, durationMs = 30000, reason = 'Rate limit / Quá tải') => {
      if (!state.aiCooldowns) state.aiCooldowns = {};
      state.aiCooldowns[configId] = {
        until: Date.now() + durationMs,
        reason,
      };
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
    },
    getKeyCooldown: (configId) => {
      const cd = state.aiCooldowns?.[configId];
      if (!cd) return null;
      if (Date.now() > cd.until) {
        delete state.aiCooldowns[configId];
        return null;
      }
      return {
        until:cd.until,
        remainingSec: Math.ceil((cd.until - Date.now()) / 1000),
        reason: cd.reason,
      };
    },
    getPolicies: () => ({
      FREE_ONLY: true,
      FREE_FIRST_SORT: true,
      ALLOW_PAID_MODELS: false,
      AUTO_PAID_FALLBACK: false,
      REQUIRE_ADMIN_APPROVAL_FOR_PAID: true,
      ...(state.aiPolicies || {}),
    }),
    updatePolicies: (updates) => {
      state.aiPolicies = { ...(state.aiPolicies || {}), ...updates };
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_ai_policy_change', { detail: state.aiPolicies }));
      return state.aiPolicies;
    },
    addAuditLog: (action, provider, details = {}) => {
      if (!state.aiAuditLogs) state.aiAuditLogs = [];
      const curUser = db.auth.getUser();
      const logEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        userId: curUser?.id || 'admin',
        userName: curUser?.name || 'Super Admin',
        action,
        provider,
        details: typeof details === 'string' ? details : JSON.stringify(details),
      };
      state.aiAuditLogs.unshift(logEntry);
      if (state.aiAuditLogs.length > 200) state.aiAuditLogs = state.aiAuditLogs.slice(0, 200);
      saveDatabase(state);
      return logEntry;
    },
    getAuditLogs: () => [...(state.aiAuditLogs || [])],
  },

  // Dynamic AI Model Catalogs Cache (Discovered Live from Provider APIs)
  aiModelCatalogs: {
    getCatalog: (providerId) => {
      return state.aiModelCatalogs?.[providerId] || null;
    },
    saveCatalog: (providerId, models = [], baseUrl = '') => {
      if (!state.aiModelCatalogs) state.aiModelCatalogs = {};
      state.aiModelCatalogs[providerId] = {
        provider: providerId,
        baseUrl,
        models,
        count: models.length,
        freeCount: models.filter((m) => m.pricing?.isFree).length,
        lastSyncedAt: new Date().toISOString(),
      };
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_model_catalog_change', { detail: { providerId } }));
      return state.aiModelCatalogs[providerId];
    },
    getAllCatalogs: () => ({ ...(state.aiModelCatalogs || {}) }),
  },

  // UI & Voice Customization
  uiVoiceConfig: {
    get: () => ({
      fontFamily: state.uiVoiceConfig?.fontFamily || 'sans',
      speechVoice: state.uiVoiceConfig?.speechVoice || '',
      rate: state.uiVoiceConfig?.rate || 0.9,
      pitch: state.uiVoiceConfig?.pitch || 1.0,
    }),
    update: (updates) => {
      state.uiVoiceConfig = { ...state.uiVoiceConfig, ...updates };
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_ui_config_change', { detail: state.uiVoiceConfig }));
      return state.uiVoiceConfig;
    },
  },

  // Listening Collections & Episodes Studio
  listening: {
    getCollections: (filter = {}) => {
      let cols = [...(state.listeningCollections || [])];
      const curUser = db.auth.getUser();
      const isAdmin = db.auth.isAdmin();

      if (filter.level && filter.level !== 'ALL') {
        cols = cols.filter((c) => c.level === filter.level);
      }
      if (filter.scope === 'private') {
        cols = cols.filter((c) => c.scope === 'private' || c.created_by === curUser?.id);
      } else if (filter.scope === 'public') {
        cols = cols.filter((c) => c.scope === 'public');
      } else {
        cols = cols.filter((c) => {
          if (c.scope === 'public') return true;
          if (c.scope === 'private' && (c.created_by === curUser?.id || isAdmin)) return true;
          if (c.scope === 'admin_only' && isAdmin) return true;
          return false;
        });
      }
      return cols;
    },
    getCollectionById: (id) => (state.listeningCollections || [])?.find((c) => c.id === id),
    createCollection: (col) => {
      const newCol = {
        id: col.id || `col_${Date.now()}`,
        title: col.title,
        deTitle: col.deTitle || col.title,
        provider: col.provider || 'Cộng đồng học tập',
        level: col.level || 'B1',
        thumbnail: col.thumbnail || 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
        description: col.description || '',
        episodesCount: col.episodesCount || 1,
        scope: col.scope || 'public',
        created_by: db.auth.getUser()?.id || 'usr_anon',
      };
      state.listeningCollections.unshift(newCol);
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return newCol;
    },
    getEpisodes: (collectionId, filter = {}) => {
      let eps = (state.listeningEpisodes || []).filter((e) => e.collectionId === collectionId);
      if (filter.level && filter.level !== 'ALL') {
        eps = eps.filter((e) => e.level === filter.level);
      }
      if (!db.auth.isAdmin()) {
        eps = eps.filter((e) => e.scope !== 'admin_only');
      }
      return eps;
    },
    getEpisodeById: (id) => (state.listeningEpisodes || []).find((e) => e.id === id),
    createEpisode: (ep) => {
      const newEp = {
        id: ep.id || `ep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        collectionId: ep.collectionId,
        title: ep.title,
        deTitle: ep.deTitle || ep.title,
        level: ep.level || 'B1',
        youtubeId: ep.youtubeId || '',
        duration: ep.duration || '03:00',
        subtitles: ep.subtitles || [],
        quiz: ep.quiz || [],
        scope: ep.scope || 'public',
        created_by: db.auth.getUser()?.id || 'usr_anon',
        created_at: new Date().toISOString(),
      };
      state.listeningEpisodes.push(newEp);
      saveDatabase(state);
      return newEp;
    },
    updateEpisode: (id, updates) => {
      state.listeningEpisodes = (state.listeningEpisodes || []).map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      saveDatabase(state);
      return state.listeningEpisodes.find((e) => e.id === id);
    },
    deleteEpisode: (id) => {
      state.listeningEpisodes = (state.listeningEpisodes || []).filter((e) => e.id !== id);
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    updateCollection: (id, updates) => {
      const idx = (state.listeningCollections || []).findIndex((c) => c.id === id);
      if (idx !== -1) {
        state.listeningCollections[idx] = { ...state.listeningCollections[idx], ...updates };
        saveDatabase(state);
        window.dispatchEvent(new CustomEvent('sprach_db_change'));
        return state.listeningCollections[idx];
      }
      return null;
    },
    deleteCollection: (id) => {
      state.listeningCollections = (state.listeningCollections || []).filter((c) => c.id !== id);
      state.listeningEpisodes = (state.listeningEpisodes || []).filter((e) => e.collectionId !== id);
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    deleteAllCollections: () => {
      state.listeningCollections = [];
      state.listeningEpisodes = [];
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    deleteAllEpisodes: (collectionId) => {
      if (collectionId) {
        state.listeningEpisodes = (state.listeningEpisodes || []).filter((e) => e.collectionId !== collectionId);
      } else {
        state.listeningEpisodes = [];
      }
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    resetDefaults: () => {
      state.listeningCollections = JSON.parse(JSON.stringify(LISTENING_COLLECTIONS));
      state.listeningEpisodes = JSON.parse(JSON.stringify(LISTENING_EPISODES));
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
  },

  // Universal Content Store with Role-Based Scope
  universal: {
    create: (item) => {
      const currentUser = db.auth.getUser();
      const isAdmin = db.auth.isAdmin();

      // Force private if not admin
      let scope = item.scope || 'public';
      if (!isAdmin && scope !== 'private') {
        scope = 'private';
      }

      const record = {
        id: item.id || `univ_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: item.type, // 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'interview' | 'exam'
        title: item.title,
        level: item.level || 'B1',
        data: item.data,
        scope, // 'public' | 'admin_only' | 'private'
        created_by: currentUser?.id || 'usr_anon',
        created_by_name: currentUser?.name || 'Học viên',
        created_at: new Date().toISOString(),
      };

      state.universalImports.unshift(record);
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return record;
    },
    update: (id, updates) => {
      const idx = (state.universalImports || []).findIndex((i) => i.id === id);
      if (idx !== -1) {
        state.universalImports[idx] = { ...state.universalImports[idx], ...updates };
        saveDatabase(state);
        window.dispatchEvent(new CustomEvent('sprach_db_change'));
        return state.universalImports[idx];
      }
      return null;
    },
    findMany: (filter = {}) => {
      const currentUser = db.auth.getUser();
      const isAdmin = db.auth.isAdmin();

      let items = [...(state.universalImports || [])];
      if (filter.type) items = items.filter((i) => i.type === filter.type);
      if (filter.level && filter.level !== 'ALL') items = items.filter((i) => i.level === filter.level);

      // Visibility permission filter:
      if (!isAdmin) {
        items = items.filter((i) => i.scope === 'public' || i.created_by === currentUser?.id);
      }

      return items;
    },
    delete: (id) => {
      const currentUser = db.auth.getUser();
      const isAdmin = db.auth.isAdmin();
      const item = (state.universalImports || []).find((i) => i.id === id);
      if (!item) return false;

      // Admin has full power to delete ANY universal item
      if (!isAdmin && item.created_by !== currentUser?.id) {
        return false;
      }

      state.universalImports = (state.universalImports || []).filter((i) => i.id !== id);
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    deleteByType: (type) => {
      state.universalImports = (state.universalImports || []).filter((i) => i.type !== type);
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    clearAll: () => {
      state.universalImports = [];
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
  },

  // Grammar Administration (Override & Delete Management)
  grammar: {
    getOverrides: () => ({ ...(state.grammarOverrides || {}) }),
    getDeletedIds: () => [...(state.deletedGrammarIds || [])],
    update: (id, updates) => {
      const univ = (state.universalImports || []).find((i) => i.id === id && i.type === 'grammar');
      if (univ) {
        db.universal.update(id, {
          title: updates.title_vi || updates.title || univ.title,
          level: updates.level || univ.level,
          data: { ...(univ.data || {}), ...updates },
        });
        return true;
      }
      if (!state.grammarOverrides) state.grammarOverrides = {};
      state.grammarOverrides[id] = { ...(state.grammarOverrides[id] || {}), ...updates };
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    delete: (id) => {
      const isUniv = (state.universalImports || []).some((i) => i.id === id && i.type === 'grammar');
      if (isUniv) {
        db.universal.delete(id);
      }
      if (!state.deletedGrammarIds) state.deletedGrammarIds = [];
      if (!state.deletedGrammarIds.includes(id)) {
        state.deletedGrammarIds.push(id);
      }
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    deleteAll: (allCurrentIds = []) => {
      db.universal.deleteByType('grammar');
      state.deletedGrammarIds = Array.from(new Set([...(state.deletedGrammarIds || []), ...allCurrentIds]));
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    resetDefaults: () => {
      state.deletedGrammarIds = [];
      state.grammarOverrides = {};
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
  },

  // Exam Administration (Override & Delete Management)
  exams: {
    getOverrides: () => ({ ...(state.examOverrides || {}) }),
    getDeletedIds: () => [...(state.deletedExamIds || [])],
    update: (id, updates) => {
      const univ = (state.universalImports || []).find((i) => i.id === id && i.type === 'exam');
      if (univ) {
        db.universal.update(id, {
          title: updates.title || univ.title,
          level: updates.level || univ.level,
          data: { ...(univ.data || {}), ...updates },
        });
        return true;
      }
      if (!state.examOverrides) state.examOverrides = {};
      state.examOverrides[id] = { ...(state.examOverrides[id] || {}), ...updates };
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    delete: (id) => {
      const isUniv = (state.universalImports || []).some((i) => i.id === id && i.type === 'exam');
      if (isUniv) {
        db.universal.delete(id);
      }
      if (!state.deletedExamIds) state.deletedExamIds = [];
      if (!state.deletedExamIds.includes(id)) {
        state.deletedExamIds.push(id);
      }
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    deleteAll: (allCurrentIds = []) => {
      db.universal.deleteByType('exam');
      state.deletedExamIds = Array.from(new Set([...(state.deletedExamIds || []), ...allCurrentIds]));
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    resetDefaults: () => {
      state.deletedExamIds = [];
      state.examOverrides = {};
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
  },

  // Situations Administration (Override & Delete Management)
  situations: {
    getOverrides: () => ({ ...(state.situationOverrides || {}) }),
    getDeletedIds: () => [...(state.deletedSituationIds || [])],
    update: (id, updates) => {
      const univ = (state.universalImports || []).find((i) => i.id === id && i.type === 'situation');
      if (univ) {
        db.universal.update(id, {
          title: updates.title_vi || updates.title || univ.title,
          data: { ...(univ.data || {}), ...updates },
        });
        return true;
      }
      if (!state.situationOverrides) state.situationOverrides = {};
      state.situationOverrides[id] = { ...(state.situationOverrides[id] || {}), ...updates };
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    delete: (id) => {
      const isUniv = (state.universalImports || []).some((i) => i.id === id && i.type === 'situation');
      if (isUniv) {
        db.universal.delete(id);
      }
      if (!state.deletedSituationIds) state.deletedSituationIds = [];
      if (!state.deletedSituationIds.includes(id)) {
        state.deletedSituationIds.push(id);
      }
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    deleteAll: (allCurrentIds = []) => {
      db.universal.deleteByType('situation');
      state.deletedSituationIds = Array.from(new Set([...(state.deletedSituationIds || []), ...allCurrentIds]));
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
    resetDefaults: () => {
      state.deletedSituationIds = [];
      state.situationOverrides = {};
      saveDatabase(state);
      window.dispatchEvent(new CustomEvent('sprach_db_change'));
      return true;
    },
  },
};


export const initializeElioAuthentication=()=>installElioAuthentication(db).initialize();

installAIAdminRuntime(db);
installListeningRuntime(db);
