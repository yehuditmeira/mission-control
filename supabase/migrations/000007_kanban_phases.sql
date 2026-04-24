-- 000007_kanban_phases.sql
-- Kanban v2: per-project editable phases + labels + markdown import provenance
-- Additive only. No breaking changes to existing data.

BEGIN;

-- 1. project_phases: per-project phase list, editable, history-preserved
-- archived_at is used instead of DELETE so old phases (e.g. Affiliate_Flow phases
-- 1-25 before the pivot) remain visible when viewing historical tasks.
CREATE TABLE IF NOT EXISTS project_phases (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_project_phases_project_active
  ON project_phases (project_id, sort_order)
  WHERE archived_at IS NULL;

-- 2. tasks.phase_id — nullable FK so existing tasks don't need a phase assigned
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS phase_id INTEGER REFERENCES project_phases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks (phase_id);

-- 3. tasks.labels — simple text array for quick filtering
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS labels TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_tasks_labels_gin ON tasks USING GIN (labels);

-- 4. tasks.source_file + source_line — where auto-imported cards came from.
-- Used for idempotent upserts when the markdown importer runs hourly.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source_file TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source_line INTEGER;

-- Unique constraint so re-imports update rather than duplicate.
-- Partial index — only applies to rows that actually came from a markdown file.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_source_unique
  ON tasks (source_file, source_line)
  WHERE source_file IS NOT NULL;

COMMIT;
