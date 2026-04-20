-- Mission Control unified operations table.
-- One table is intentional: every page (cron jobs, calendar, blockers, todos, docs,
-- milestones) is a filtered view. This is the operating-truth source per Kate's
-- 2026-04-19 directive — "Mission Control must become the factual source of truth".

CREATE TABLE IF NOT EXISTS operations (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  project_id      INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  category        TEXT NOT NULL CHECK (category IN
                    ('MACHINE_JOB','RECURRING_WORKFLOW','DOC','TODO','BLOCKER','MILESTONE')),
  subtype         TEXT,
  cadence         TEXT,
  timezone        TEXT DEFAULT 'America/New_York',
  owner           TEXT,
  enabled         BOOLEAN DEFAULT true,
  status          TEXT,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,
  output_target   TEXT,
  code_path       TEXT,
  health_state    TEXT CHECK (health_state IN ('green','yellow','red','unknown') OR health_state IS NULL),
  blocker_state   TEXT CHECK (blocker_state IN ('open','resolved') OR blocker_state IS NULL),
  notes           TEXT,
  created_from    TEXT,
  source_path     TEXT,
  external_key    TEXT UNIQUE,
  replaced_by     INTEGER REFERENCES operations(id) ON DELETE SET NULL,
  supersedes      INTEGER REFERENCES operations(id) ON DELETE SET NULL,
  last_error      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operations_category ON operations(category);
CREATE INDEX IF NOT EXISTS idx_operations_project_id ON operations(project_id);
CREATE INDEX IF NOT EXISTS idx_operations_health ON operations(health_state) WHERE health_state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operations_due_at ON operations(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operations_blocker_open ON operations(blocker_state) WHERE blocker_state = 'open';

ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON operations;
CREATE POLICY "Allow public read" ON operations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write" ON operations;
CREATE POLICY "Allow public write" ON operations FOR ALL USING (true) WITH CHECK (true);

-- Touch updated_at on every UPDATE
CREATE OR REPLACE FUNCTION touch_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_operations_touch ON operations;
CREATE TRIGGER trg_operations_touch
  BEFORE UPDATE ON operations
  FOR EACH ROW EXECUTE FUNCTION touch_operations_updated_at();
