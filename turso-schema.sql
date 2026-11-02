-- ====================================================================
-- SPRACHMEISTERSCHAFT (DEUTSCHMASTER) — TURSO LIBSQL SCHEMA
-- Cơ sở dữ liệu phân tán trên Edge cho nền tảng tự học tiếng Đức A1-C2
-- ====================================================================

-- 1. Bảng Người dùng (User)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    is_verified INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Hồ sơ học viên (LearnerProfile - 1 bản ghi/người)
CREATE TABLE IF NOT EXISTS learner_profiles (
    user_id TEXT PRIMARY KEY,
    display_name TEXT,
    exam_date TEXT,
    daily_goal INTEGER DEFAULT 20,
    target_level TEXT DEFAULT 'B1',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Bảng Thẻ từ vựng & Trạng thái thuật toán SRS SM-2 (VocabularyCard)
CREATE TABLE IF NOT EXISTS vocabulary_cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    german TEXT NOT NULL,
    article TEXT, -- 'der', 'die', 'das', ''
    word_type TEXT,
    vietnamese TEXT NOT NULL,
    example_de TEXT,
    example_vi TEXT,
    topic TEXT,
    level TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'learning', 'review', 'mastered'
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,
    due_date TEXT,
    last_reviewed TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vocab_user_due ON vocabulary_cards (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_vocab_level ON vocabulary_cards (level);

-- 4. Bảng Nhật ký học tập hàng ngày (StudyLog)
CREATE TABLE IF NOT EXISTS study_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL, -- 'YYYY-MM-DD'
    cards_reviewed INTEGER DEFAULT 0,
    new_words INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_user_date ON study_logs (user_id, date);

-- 5. Bảng Phiên luyện tập 7 Kỹ năng & Minigame (SkillSession)
CREATE TABLE IF NOT EXISTS skill_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill TEXT NOT NULL, -- 'listening', 'speaking', 'reading', 'writing', 'pronunciation', 'grammar', 'interview', 'game'
    score REAL NOT NULL,
    title TEXT,
    details TEXT,
    duration_seconds INTEGER DEFAULT 0,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Bảng Kết quả làm 9 đề thi CEFR (ExamResult)
CREATE TABLE IF NOT EXISTS exam_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_id TEXT,
    provider TEXT, -- 'Goethe-Institut', 'telc GmbH', 'ÖSD', 'BAMF / g.a.s.t.'
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Bảng Sổ tay Ghi chú học thuật (Note)
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'note', -- 'note', 'draft', 'document'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ====================================================================
-- 8. BẢNG QUẢN TRỊ AI DYNAMIC MODEL DISCOVERY & API KEYS
-- ====================================================================

-- 8.1. Bảng Nhà cung cấp AI (AI Providers)
CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY, -- 'gemini', 'openrouter', 'groq', 'deepseek', 'openai', etc.
    name TEXT NOT NULL,
    default_base_url TEXT,
    auth_type TEXT DEFAULT 'bearer',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8.2. Bảng Quản lý API Key (Metadata & Masked Key)
CREATE TABLE IF NOT EXISTS ai_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    display_name TEXT NOT NULL,
    masked_key TEXT NOT NULL,
    encrypted_key TEXT, -- Encrypted for security
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active', -- 'active', 'rate_limited', 'invalid', 'cooldown'
    rate_limit_info TEXT,
    quota_info TEXT,
    primary_model_assigned TEXT,
    backup_model_assigned TEXT,
    last_verified_at DATETIME,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_keys_provider ON ai_keys (provider);

-- 8.3. Bảng Dynamic Model Catalog Cache
CREATE TABLE IF NOT EXISTS ai_model_catalogs (
    id TEXT PRIMARY KEY, -- provider_id + ':' + model_id
    provider TEXT NOT NULL,
    model_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    description TEXT,
    context_window TEXT,
    context_limit INTEGER DEFAULT 32768,
    capabilities_json TEXT, -- JSON: { text, vision, audio, reasoning }
    pricing_tier TEXT DEFAULT 'UNKNOWN', -- 'VERIFIED_FREE', 'FREE_ELIGIBLE', 'ZERO_PRICE', 'PAID'
    pricing_json TEXT,
    is_free INTEGER DEFAULT 0,
    release_date TEXT,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_model_catalogs (provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_free ON ai_model_catalogs (is_free);

-- 8.4. Bảng Phân công Task AI (Task Assignments & Fallback)
CREATE TABLE IF NOT EXISTS ai_task_assignments (
    task_id TEXT PRIMARY KEY, -- 'elio_chat', 'writing_grading', 'ocr_image', etc.
    task_name TEXT NOT NULL,
    primary_key_id TEXT,
    primary_model TEXT NOT NULL,
    backup_key_id TEXT,
    backup_model TEXT,
    needs_vision INTEGER DEFAULT 0,
    timeout_ms INTEGER DEFAULT 30000,
    max_output_tokens INTEGER DEFAULT 4000,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8.5. Bảng Nhật ký Kiểm toán AI (AI Audit Logs)
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    action TEXT NOT NULL, -- 'discover_models', 'add_key', 'switch_model', 'verify_key'
    provider TEXT,
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_time ON ai_audit_logs (timestamp);

