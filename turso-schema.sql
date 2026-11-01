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
