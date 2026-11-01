import { formatDate, addDays, calculateStreak } from './algorithms';

const STORAGE_KEY = 'sprachmeisterschaft_db_v1';
const AUTH_KEY = 'sprachmeisterschaft_auth_v1';

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load database:', e);
  }

  // Initial clean database
  return {
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
      // Default signed-in user for smooth UX
      return {
        id: 'usr_default',
        email: 'hocvien@sprachmeisterschaft.de',
        name: state.learnerProfile.display_name || 'Nguyễn Văn Đạt',
        role: 'user',
        is_verified: true,
      };
    },

    login: (email, password) => {
      const user = {
        id: 'usr_' + Date.now(),
        email: email || 'hocvien@sprachmeisterschaft.de',
        name: email.split('@')[0] || 'Học viên',
        role: 'user',
        is_verified: true,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      return user;
    },

    register: (data) => {
      const user = {
        id: 'usr_' + Date.now(),
        email: data.email,
        name: data.name || data.email.split('@')[0],
        role: 'user',
        is_verified: false, // Needs OTP
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
      return user;
    },

    verifyOtp: (code) => {
      const user = db.auth.getUser();
      if (user) {
        user.is_verified = true;
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('sprach_auth_change'));
        return true;
      }
      return false;
    },

    logout: () => {
      localStorage.removeItem(AUTH_KEY);
      window.dispatchEvent(new CustomEvent('sprach_auth_change'));
    },
  },
};
