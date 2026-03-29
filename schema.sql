CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  username TEXT,
  lesson_id TEXT NOT NULL,
  step_type TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  answer TEXT,
  correct INTEGER,
  response_time_ms INTEGER,
  is_dryrun INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
