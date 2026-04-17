-- =====================================================
-- MISSION CONTROL POSTGRESQL SCHEMA FOR SUPABASE
-- Converted from SQLite schema
-- =====================================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','todo','in_progress','done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
  author TEXT NOT NULL DEFAULT 'user' CHECK(author IN ('user','ai')),
  due_date DATE,
  start_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  recurring TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cron jobs table
CREATE TABLE IF NOT EXISTS cron_jobs (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule TEXT NOT NULL,
  schedule_raw TEXT,
  command TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual' CHECK(source IN ('launchd','apscheduler','manual')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PLATFORM MARKETING AUTOMATION SCHEMA
-- =====================================================

-- Platforms table
CREATE TABLE IF NOT EXISTS platforms (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','setup','active','paused','autonomous','failed')),
  phase INTEGER NOT NULL DEFAULT 1 CHECK(phase IN (1,2,3,4)),
  start_date DATE,
  autonomous_target_date DATE,
  autonomous_achieved_date DATE,
  config JSONB,
  weekly_metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  next_scheduled_run TIMESTAMPTZ
);

-- Platform tasks table
CREATE TABLE IF NOT EXISTS platform_tasks (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK(phase IN (1,2,3,4)),
  task_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','todo','in_progress','done','blocked')),
  can_automate INTEGER NOT NULL DEFAULT 0,
  automation_script TEXT,
  depends_on TEXT,
  deliverable_type TEXT,
  deliverable_path TEXT,
  deliverable_verified_at TIMESTAMPTZ,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform_id, task_number)
);

-- Recurring jobs table
CREATE TABLE IF NOT EXISTS recurring_jobs (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL CHECK(job_type IN ('content_creation','scheduling','analytics','engagement','cleanup','reporting')),
  schedule TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'cron' CHECK(schedule_type IN ('cron','interval','once')),
  timezone TEXT DEFAULT 'America/New_York',
  script_path TEXT NOT NULL,
  script_args JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK(last_run_status IN ('success','failed','running')),
  last_run_output TEXT,
  next_run_at TIMESTAMPTZ,
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  depends_on_job_id INTEGER REFERENCES recurring_jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform_id, name)
);

-- Job logs table
CREATE TABLE IF NOT EXISTS job_logs (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES recurring_jobs(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK(status IN ('running','success','failed','cancelled')),
  exit_code INTEGER,
  stdout TEXT,
  stderr TEXT,
  output_file TEXT,
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  model_used TEXT,
  tokens_used INTEGER,
  cost_estimate REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content items table
CREATE TABLE IF NOT EXISTS content_items (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES job_logs(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  body TEXT,
  media_urls TEXT,
  thumbnail_url TEXT,
  affiliate_links JSONB,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','published','failed','archived')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  prompt_used TEXT,
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition TEXT CHECK(competition IN ('low','medium','high')),
  relevance_score INTEGER CHECK(relevance_score BETWEEN 1 AND 10),
  times_used INTEGER DEFAULT 0,
  avg_performance REAL,
  category TEXT,
  intent TEXT CHECK(intent IN ('informational','transactional','navigational')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform events table
CREATE TABLE IF NOT EXISTS platform_events (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('phase_start','phase_end','milestone','deadline','review')),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  all_day BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notify_before_hours INTEGER DEFAULT 24,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_platforms_status ON platforms(status);
CREATE INDEX IF NOT EXISTS idx_platforms_phase ON platforms(phase);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_status ON platform_tasks(status);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_phase ON platform_tasks(phase);
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_next_run ON recurring_jobs(next_run_at) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_logs(status);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled ON content_items(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_keywords_platform ON keywords(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_date ON platform_events(event_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);

-- =====================================================
-- FUNCTIONS FOR AUTO-UPDATING updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trg_platforms_updated BEFORE UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_platform_tasks_updated BEFORE UPDATE ON platform_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_recurring_jobs_updated BEFORE UPDATE ON recurring_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_content_items_updated BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed default projects if empty
INSERT INTO projects (name, color, sort_order)
SELECT 'Merchant Services', '#EC4899', 0
WHERE NOT EXISTS (SELECT 1 FROM projects);

INSERT INTO projects (name, color, sort_order)
SELECT 'Affiliate Flow', '#A855F7', 1
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = 2);

INSERT INTO projects (name, color, sort_order)
SELECT 'Personal', '#F9A8D4', 2
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = 3);
