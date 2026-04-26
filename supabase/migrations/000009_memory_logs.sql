-- 000009_memory_logs.sql
-- Move memory logs from local filesystem (~/Desktop/AI_Folder/memory/) into
-- Supabase so the /memory page works on Vercel. Schema mirrors the existing
-- API contract: filename / name / description / type / date / preview.

BEGIN;

CREATE TABLE IF NOT EXISTS memory_logs (
  id          SERIAL PRIMARY KEY,
  filename    TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL CHECK (type IN ('daily', 'durable')),
  date        DATE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_logs_type_date ON memory_logs (type, date DESC NULLS LAST);

COMMIT;
