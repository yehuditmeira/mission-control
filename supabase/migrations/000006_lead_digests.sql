-- Lead digests: replaces the Telegram digest output. Merchant Services posts
-- here every digest interval; Mission Control reads here to render the /leads
-- page. Per Kate's 2026-04-19 operating-truth rule.

CREATE TABLE IF NOT EXISTS lead_digests (
  id              SERIAL PRIMARY KEY,
  posted_at       TIMESTAMPTZ DEFAULT now(),
  source_project  TEXT DEFAULT 'merchant-lead-hunter',
  -- Top-line numbers
  hot_count       INTEGER DEFAULT 0,
  qualified_count INTEGER DEFAULT 0,
  total_new       INTEGER DEFAULT 0,
  scrape_window   TEXT,
  -- Full payload — preserves the original digest format Telegram had
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Pre-rendered markdown so the dashboard can show it without re-formatting
  markdown        TEXT,
  -- Error trail if formatting/scrape failed
  error           TEXT
);

CREATE INDEX IF NOT EXISTS idx_lead_digests_posted_at ON lead_digests(posted_at DESC);

ALTER TABLE lead_digests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON lead_digests;
CREATE POLICY "Allow public read" ON lead_digests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write" ON lead_digests;
CREATE POLICY "Allow public write" ON lead_digests FOR ALL USING (true) WITH CHECK (true);
