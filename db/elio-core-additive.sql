-- Explicit preview preparation only. No runtime auto-migration, account seed,
-- password rewrite, user-table conversion, or changes to existing ee_* data.
CREATE TABLE IF NOT EXISTS sprach_core_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sprach_core_sessions_user ON sprach_core_sessions(user_id);
CREATE TABLE IF NOT EXISTS sprach_core_limits (
  name TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  until_at INTEGER NOT NULL
);
