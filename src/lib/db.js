import { formatDate, addDays, calculateStreak } from './algorithms';
import { LISTENING_COLLECTIONS, LISTENING_EPISODES } from '@/data/listening-collections';
import { rescheduleMissedTasks } from './study-plan-generator.js';

const STORAGE_KEY = 'sprachmeisterschaft_db_v1';
const AUTH_KEY = 'sprachmeisterschaft_auth_v1';

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure new schemas exist
      if (!parsed.users) parsed.users = [];
      if (!parsed.aiConfigs) parsed.aiConfigs = [];
      if (!parsed.aiTaskAssignments) parsed.aiTaskAssignments = {};
      if (!parsed.uiVoiceConfig) parsed.uiVoiceConfig = { fontFamily: 'serif', speechVoice: '', rate: 0.9, pitch: 1.0 };
      if (!parsed.listeningCollections || parsed.listeningCollections.length === 0) parsed.listeningCollections = LISTENING_COLLECTIONS;
      if (!parsed.listeningEpisodes || parsed.listeningEpisodes.length === 0) parsed.listeningEpisodes = LISTENING_EPISODES;
      if (!parsed.universalImports) parsed.universalImports = [];
      if (!parsed.studyPlans) parsed.studyPlans = {};
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load database:', e);
  }

  // Initial clean database with Admin & Student
  return {
    users: [
      {
        id: 'usr_admin',
        name: 'Quản trị viên Hệ thống (Master Admin)',
        email: 'admin@sprachmeisterschaft.de',
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
        role: 'user',
        is_blocked: false,
        onboarding_completed: false,
        study_plan: null,
        created_at: new Date().toISOString(),
      },
    ],
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
      fontFamily: 'serif',
      speechVoice: '',
      rate: 0.9,
      pitch: 1.0,
    },
    listeningCollections: LISTENING_COLLECTIONS,
    listeningEpisodes: LISTENING_EPISODES,
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

export const db = {
  // Vocabulary Cards
  vocabulary: {
    findMany: (filter = {}) => {
      let cards = [...state.vocabularyCards];
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

    findById: (id) => state.vocabularyCards.find((c) => c.id === id),

    create: (cardData) => {
      const today = formatDate();
      const newCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
      const today = formatDate();
      const existingKeys = new Set(
        state.vocabularyCards.map(
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
      const idx = state.vocabularyCards.findIndex((c) => c.id === id);
      if (idx !== -1) {
        state.vocabularyCards[idx] = { ...state.vocabularyCards[idx], ...updates };
        saveDatabase(state);
        return state.vocabularyCards[idx];
      }
      return null;
    },

    delete: (id) => {
      state.vocabularyCards = state.vocabularyCards.filter((c) => c.id !== id);
      saveDatabase(state);
      return true;
    },
  },

  // Study Logs (One per day, accumulated)
  studyLogs: {
    findMany: () => [...state.studyLogs],

    getToday: () => {
      const today = formatDate();
      let log = state.studyLogs.find((l) => l.date === today);
      if (!log) {
        log = {
          id: `log_${today}`,
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
      const today = formatDate();
      let log = state.studyLogs.find((l) => l.date === today);
      if (!log) {
        log = {
          id: `log_${today}`,
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
      let sessions = [...state.skillSessions];
      if (filter.skill) {
        sessions = sessions.filter((s) => s.skill === filter.skill);
      }
      // Newest first
      return sessions.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    },

    create: (data) => {
      const session = {
        id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
      let results = [...state.examResults];
      if (filter.exam_id) {
        results = results.filter((r) => r.exam_id === filter.exam_id);
      }
      if (filter.level) {
        results = results.filter((r) => r.level === filter.level);
      }
      return results.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    },

    create: (data) => {
      const examResult = {
        id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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

  // Learner Profile (Target level applies to entire app)
  learnerProfile: {
    get: () => ({ ...state.learnerProfile }),

    update: (updates) => {
      state.learnerProfile = { ...state.learnerProfile, ...updates };
      saveDatabase(state);
      return state.learnerProfile;
    },
  },

  // Notes
  notes: {
    findMany: (filter = {}) => {
      let notes = [...state.notes];
      if (filter.type && filter.type !== 'all') {
        notes = notes.filter((n) => n.type === filter.type);
      }
      return notes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    },

    create: (noteData) => {
      const note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    },

    login: (email, password) => {
      const cleanEmail = (email || 'hocvien@sprachmeisterschaft.de').trim().toLowerCase();
      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: 'usr_' + Date.now(),
          email: cleanEmail,
          name: cleanEmail.split('@')[0] || 'Học viên',
          provider: 'email',
          role: cleanEmail.includes('admin') ? 'admin' : 'user',
          is_verified: true,
          onboarding_completed: false,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.push(user);
        saveDatabase(state);
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      return user;
    },

    loginWithGoogle: (profile = {}) => {
      const cleanEmail = (profile.email || 'dat.nguyenviet.1999@gmail.com').trim().toLowerCase();
      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: 'usr_gg_' + Date.now(),
          email: cleanEmail,
          name: profile.name || 'Nguyễn Văn Đạt',
          picture: profile.picture || null,
          provider: 'google',
          role: cleanEmail.includes('admin') ? 'admin' : 'user',
          is_verified: true,
          onboarding_completed: false,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.push(user);
        saveDatabase(state);
      } else {
        if (profile.picture) user.picture = profile.picture;
        saveDatabase(state);
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      if (profile.name) {
        state.learnerProfile.display_name = profile.name;
        saveDatabase(state);
      }
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      return user;
    },

    loginAsDemo: () => {
      const cleanEmail = 'hocvien@sprachmeisterschaft.de';
      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: 'usr_demo',
          email: cleanEmail,
          name: 'Nguyễn Văn Đạt (Demo)',
          provider: 'demo',
          role: 'user',
          is_verified: true,
          onboarding_completed: false,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.push(user);
        saveDatabase(state);
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      return user;
    },

    register: (data) => {
      const cleanEmail = data.email.trim().toLowerCase();
      let user = (state.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: 'usr_' + Date.now(),
          email: cleanEmail,
          name: data.name || cleanEmail.split('@')[0],
          provider: 'email',
          role: 'user',
          is_verified: false, // Needs OTP verification
          onboarding_completed: false,
          study_plan: null,
          created_at: new Date().toISOString(),
        };
        if (!state.users) state.users = [];
        state.users.push(user);
        saveDatabase(state);
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      return user;
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
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
    },

    isAdmin: () => {
      if (typeof window !== 'undefined' && localStorage.getItem('sprach_master_admin_override') === 'true') {
        return true;
      }
      const u = db.auth.getUser();
      if (!u) return true; // Default to admin mode for site owner/developer
      const email = (u.email || '').toLowerCase();
      return (
        u.role === 'admin' ||
        email.includes('admin') ||
        email.includes('dat') ||
        email.includes('elio') ||
        (typeof window !== 'undefined' && localStorage.getItem('sprach_is_admin') === 'true')
      );
    },

    setRole: (role) => {
      const u = db.auth.getUser();
      if (u) {
        u.role = role;
        localStorage.setItem(AUTH_KEY, JSON.stringify(u));
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
      const u = userId ? (state.users || []).find((usr) => usr.id === userId) : db.auth.getUser();
      if (!u) return null;
      const fullUser = (state.users || []).find(
        (usr) => usr.id === u.id || usr.email?.toLowerCase() === u.email?.toLowerCase()
      );
      return fullUser?.study_plan || u.study_plan || (state.studyPlans ? state.studyPlans[u.id] : null) || null;
    },

    save: (userId, answers, roadmap) => {
      const curUser = db.auth.getUser();
      const targetId = userId || curUser?.id;
      if (!targetId) return null;

      // 1. Update in state.users
      const idx = (state.users || []).findIndex(
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

      // 3. Update learnerProfile
      if (answers.targetLevel) {
        state.learnerProfile.target_level = answers.targetLevel;
      }
      if (roadmap.meta?.targetDate) {
        state.learnerProfile.exam_date = roadmap.meta.targetDate;
      }
      if (answers.dailyMinutes) {
        state.learnerProfile.daily_goal = Math.round(answers.dailyMinutes / 2);
      }

      saveDatabase(state);

      // 4. Update session user in AUTH_KEY
      if (curUser) {
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
      state.aiTaskAssignments[taskId] = { provider: providerId, model };
      saveDatabase(state);
    },
  },

  // UI & Voice Customization
  uiVoiceConfig: {
    get: () => ({
      fontFamily: state.uiVoiceConfig?.fontFamily || 'serif',
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
      return record;
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

      // Only admin or owner can delete
      if (!isAdmin && item.created_by !== currentUser?.id) {
        return false;
      }

      state.universalImports = (state.universalImports || []).filter((i) => i.id !== id);
      saveDatabase(state);
      return true;
    },
  },
};
