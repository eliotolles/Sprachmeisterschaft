import { createClient } from '@libsql/client/web';

const CONFIG_STORAGE_KEY = 'sprach_turso_config_v1';

export function getTursoConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url) return parsed;
    }
  } catch (e) {}

  // Fallback to Vite build environment variables
  const envUrl = import.meta.env.VITE_TURSO_DATABASE_URL;
  const envToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

  if (envUrl) {
    return {
      url: envUrl,
      authToken: envToken || '',
    };
  }

  return {
    url: '',
    authToken: '',
  };
}

export function saveTursoConfig(config) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('sprach_turso_config_change'));
    return true;
  } catch (e) {
    console.error('Failed to save Turso config:', e);
    return false;
  }
}

export function clearTursoConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('sprach_turso_config_change'));
}

export function getTursoClient() {
  const { url, authToken } = getTursoConfig();
  if (!url) return null;

  try {
    return createClient({
      url,
      authToken: authToken || undefined,
    });
  } catch (e) {
    console.error('Failed to initialize Turso client:', e);
    return null;
  }
}

/**
 * Kiểm tra kết nối tới cơ sở dữ liệu Turso
 */
export async function testTursoConnection() {
  const client = getTursoClient();
  if (!client) {
    return {
      ok: false,
      error: 'Chưa cấu hình URL cơ sở dữ liệu Turso (libsql://...).',
    };
  }

  const startTime = Date.now();
  try {
    const result = await client.execute('SELECT 1 as ping');
    const latencyMs = Date.now() - startTime;

    // Đếm số bảng đã tạo
    const tablesResult = await client.execute(
      "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%'"
    );
    const tablesCount = tablesResult.rows[0]?.count || 0;

    return {
      ok: true,
      latencyMs,
      tablesCount: Number(tablesCount),
    };
  } catch (e) {
    return {
      ok: false,
      error: e.message || 'Lỗi kết nối cơ sở dữ liệu Turso.',
    };
  }
}

/**
 * Tự động tạo 7 bảng dữ liệu trên Turso nếu chưa tồn tại
 */
export async function migrateTursoSchema() {
  const client = getTursoClient();
  if (!client) {
    throw new Error('Chưa kết nối Turso Database.');
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS learner_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      exam_date TEXT,
      daily_goal INTEGER DEFAULT 20,
      target_level TEXT DEFAULT 'B1',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS vocabulary_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      german TEXT NOT NULL,
      article TEXT,
      word_type TEXT,
      vietnamese TEXT NOT NULL,
      example_de TEXT,
      example_vi TEXT,
      topic TEXT,
      level TEXT,
      status TEXT DEFAULT 'new',
      ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      lapses INTEGER DEFAULT 0,
      due_date TEXT,
      last_reviewed TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS study_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      cards_reviewed INTEGER DEFAULT 0,
      new_words INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      minutes INTEGER DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS skill_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill TEXT NOT NULL,
      score REAL NOT NULL,
      title TEXT,
      details TEXT,
      duration_seconds INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_id TEXT,
      provider TEXT,
      title TEXT NOT NULL,
      level TEXT,
      mc_score REAL DEFAULT 0,
      mc_total REAL DEFAULT 0,
      writing_score REAL DEFAULT 0,
      total REAL NOT NULL,
      passed INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      feedback TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'note',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS ai_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      default_base_url TEXT,
      auth_type TEXT DEFAULT 'bearer',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS ai_keys (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      display_name TEXT NOT NULL,
      masked_key TEXT NOT NULL,
      encrypted_key TEXT,
      priority INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      rate_limit_info TEXT,
      quota_info TEXT,
      primary_model_assigned TEXT,
      backup_model_assigned TEXT,
      last_verified_at DATETIME,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS ai_model_catalogs (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model_id TEXT NOT NULL,
      model_name TEXT NOT NULL,
      description TEXT,
      context_window TEXT,
      context_limit INTEGER DEFAULT 32768,
      capabilities_json TEXT,
      pricing_tier TEXT DEFAULT 'UNKNOWN',
      pricing_json TEXT,
      is_free INTEGER DEFAULT 0,
      release_date TEXT,
      last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS ai_task_assignments (
      task_id TEXT PRIMARY KEY,
      task_name TEXT NOT NULL,
      primary_key_id TEXT,
      primary_model TEXT NOT NULL,
      backup_key_id TEXT,
      backup_model TEXT,
      needs_vision INTEGER DEFAULT 0,
      timeout_ms INTEGER DEFAULT 30000,
      max_output_tokens INTEGER DEFAULT 4000,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS ai_audit_logs (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT,
      action TEXT NOT NULL,
      provider TEXT,
      details TEXT
    )`
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  return { success: true, count: statements.length };
}

/**
 * Đồng bộ toàn bộ dữ liệu từ máy lên Turso Cloud
 */
export async function syncLocalToTurso(dbState, userId = 'usr_default') {
  const client = getTursoClient();
  if (!client) throw new Error('Chưa kết nối Turso.');

  await migrateTursoSchema();

  // 1. Hồ sơ
  if (dbState.learnerProfile) {
    const p = dbState.learnerProfile;
    await client.execute({
      sql: `INSERT OR REPLACE INTO learner_profiles (user_id, display_name, exam_date, daily_goal, target_level, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [userId, p.display_name || '', p.exam_date || '', p.daily_goal || 20, p.target_level || 'B1'],
    });
  }

  // 2. Từ vựng
  let syncedCards = 0;
  for (const card of dbState.vocabularyCards || []) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO vocabulary_cards (
        id, user_id, german, article, word_type, vietnamese, example_de, example_vi,
        topic, level, status, ease_factor, interval_days, repetitions, lapses, due_date, last_reviewed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        card.id,
        userId,
        card.german,
        card.article || '',
        card.word_type || 'noun',
        card.vietnamese,
        card.example_de || '',
        card.example_vi || '',
        card.topic || '',
        card.level || 'A1',
        card.status || 'new',
        card.ease_factor || 2.5,
        card.interval_days || 0,
        card.repetitions || 0,
        card.lapses || 0,
        card.due_date || '',
        card.last_reviewed || '',
      ],
    });
    syncedCards++;
  }

  // 3. Nhật ký học tập
  for (const log of dbState.studyLogs || []) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO study_logs (id, user_id, date, cards_reviewed, new_words, xp, minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [log.id || `log_${log.date}`, userId, log.date, log.cards_reviewed || 0, log.new_words || 0, log.xp || 0, log.minutes || 0],
    });
  }

  return {
    success: true,
    cards: syncedCards,
    logs: (dbState.studyLogs || []).length,
  };
}

/**
 * Kéo dữ liệu mới nhất từ Turso về máy
 */
export async function syncTursoToLocal(userId = 'usr_default') {
  const client = getTursoClient();
  if (!client) throw new Error('Chưa kết nối Turso.');

  // Đọc thẻ từ
  const cardsResult = await client.execute({
    sql: 'SELECT * FROM vocabulary_cards WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });

  // Đọc nhật ký
  const logsResult = await client.execute({
    sql: 'SELECT * FROM study_logs WHERE user_id = ? ORDER BY date DESC',
    args: [userId],
  });

  // Đọc hồ sơ
  const profileResult = await client.execute({
    sql: 'SELECT * FROM learner_profiles WHERE user_id = ? LIMIT 1',
    args: [userId],
  });

  return {
    cards: cardsResult.rows || [],
    logs: logsResult.rows || [],
    profile: profileResult.rows[0] || null,
  };
}
