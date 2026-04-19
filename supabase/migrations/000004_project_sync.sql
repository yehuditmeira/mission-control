-- Project sync table: stores GSD phase data synced from local .planning/ directories
-- This allows Vercel serverless to read phase data without filesystem access

CREATE TABLE IF NOT EXISTS project_sync (
  project_id TEXT PRIMARY KEY,
  current_phase INTEGER,
  current_phase_name TEXT,
  milestone TEXT,
  milestone_name TEXT,
  status TEXT,
  total_phases INTEGER DEFAULT 0,
  completed_phases INTEGER DEFAULT 0,
  percent INTEGER DEFAULT 0,
  phase_list JSONB DEFAULT '[]'::jsonb,
  has_planning BOOLEAN DEFAULT false,
  last_updated TEXT,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Allow anon read access (dashboard is public-facing)
ALTER TABLE project_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON project_sync
  FOR SELECT USING (true);

CREATE POLICY "Allow public upsert" ON project_sync
  FOR ALL USING (true) WITH CHECK (true);
