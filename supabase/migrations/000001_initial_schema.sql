-- Initial PostgreSQL Schema for Mission Control
-- Converted from SQLite schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Platforms table
CREATE TABLE platforms (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','setup','active','paused','autonomous','failed')),
  phase INTEGER NOT NULL DEFAULT 1 CHECK(phase IN (1,2,3,4)),
  
  -- Timeline fields
  start_date TIMESTAMPTZ,
  autonomous_target_date TIMESTAMPTZ,
  autonomous_achieved_date TIMESTAMPTZ,
  
  -- Configuration (JSON)
  config JSONB,
  
  -- Metrics (JSON for flexibility)
  weekly_metrics JSONB,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  next_scheduled_run TIMESTAMPTZ
);

-- Platform tasks table
CREATE TABLE platform_tasks (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK(phase IN (1,2,3,4)),
  task_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','todo','in_progress','done','blocked')),
  
  -- Automation fields
  can_automate INTEGER NOT NULL DEFAULT 0,
  automation_script TEXT,
  
  -- Dependencies
  depends_on TEXT,
  
  -- Deliverable tracking
  deliverable_type TEXT,
  deliverable_path TEXT,
  deliverable_verified_at TIMESTAMPTZ,
  
  -- Scheduling
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(platform_id, task_number)
);

-- Recurring jobs table
CREATE TABLE recurring_jobs (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  
  -- Job definition
  name TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL CHECK(job_type IN ('content_creation','scheduling','analytics','engagement','cleanup','reporting')),
  
  -- Schedule
  schedule TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'cron' CHECK(schedule_type IN ('cron','interval','once')),
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Script to execute
  script_path TEXT NOT NULL,
  script_args JSONB,
  
  -- Execution tracking
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK(last_run_status IN ('success','failed','running')),
  last_run_output TEXT,
  next_run_at TIMESTAMPTZ,
  
  -- Retry config
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  
  -- Dependencies
  depends_on_job_id INTEGER REFERENCES recurring_jobs(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(platform_id, name)
);

-- Job logs table
CREATE TABLE job_logs (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES recurring_jobs(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES platforms(id),
  
  -- Execution details
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK(status IN ('running','success','failed','cancelled')),
  exit_code INTEGER,
  
  -- Output capture
  stdout TEXT,
  stderr TEXT,
  output_file TEXT,
  
  -- Metrics captured
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- AI generation metadata
  model_used TEXT,
  tokens_used INTEGER,
  cost_estimate REAL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content items table
CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES job_logs(id),
  
  -- Content details
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  body TEXT,
  
  -- Media
  media_urls TEXT,
  thumbnail_url TEXT,
  
  -- Affiliate/tracking
  affiliate_links JSONB,
  utm_campaign TEXT,
  
  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','published','failed','archived')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  
  -- AI generation tracking
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  prompt_used TEXT,
  
  -- Performance
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate REAL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keywords table
CREATE TABLE keywords (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition TEXT CHECK(competition IN ('low','medium','high')),
  relevance_score INTEGER CHECK(relevance_score BETWEEN 1 AND 10),
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  avg_performance REAL,
  
  -- Categorization
  category TEXT,
  intent TEXT CHECK(intent IN ('informational','transactional','navigational')),
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform events table
CREATE TABLE platform_events (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK(event_type IN ('phase_start','phase_end','milestone','deadline','review')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  event_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT TRUE,
  
  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Notification
  notify_before_hours INTEGER DEFAULT 24,
  notification_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','todo','in_progress','done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
  author TEXT NOT NULL DEFAULT 'user' CHECK(author IN ('user','ai')),
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subtasks table
CREATE TABLE subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Notes table
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
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
CREATE TABLE cron_jobs (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule TEXT NOT NULL,
  schedule_raw TEXT,
  command TEXT,
  project_id INTEGER REFERENCES projects(id),
  source TEXT DEFAULT 'manual' CHECK(source IN ('launchd','apscheduler','manual')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_platforms_status ON platforms(status);
CREATE INDEX idx_platforms_phase ON platforms(phase);
CREATE INDEX idx_platform_tasks_status ON platform_tasks(status);
CREATE INDEX idx_platform_tasks_phase ON platform_tasks(phase);
CREATE INDEX idx_recurring_jobs_next_run ON recurring_jobs(next_run_at) WHERE active = TRUE;
CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX idx_job_logs_status ON job_logs(status);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_scheduled ON content_items(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_keywords_platform ON keywords(platform_id);
CREATE INDEX idx_platform_events_date ON platform_events(event_date);

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
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

-- Enable Row Level Security (RLS)
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all" ON platforms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON platform_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON recurring_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON job_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON content_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON platform_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON subtasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cron_jobs FOR ALL USING (true) WITH CHECK (true);

-- Insert default platforms from Affiliate Flow
INSERT INTO platforms (slug, name, description, priority, status, phase) VALUES
('pinterest', 'Pinterest', 'Content creation and scheduling platform', 1, 'pending', 1),
('instagram', 'Instagram', 'Social media engagement platform', 2, 'pending', 1),
('facebook', 'Facebook', 'Community building platform', 3, 'pending', 1),
('tiktok', 'TikTok', 'Short-form video platform', 4, 'pending', 1),
('twitter', 'Twitter / X', 'Microblogging platform', 5, 'pending', 1),
('whatsapp', 'WhatsApp', 'Direct messaging platform', 6, 'pending', 1),
('seo', 'SEO / Blog', 'Search optimization content', 7, 'pending', 1);

-- Insert default projects
INSERT INTO projects (name, color, sort_order) VALUES
('Mission Control', 'bg-blue-500', 0),
('Affiliate Flow', 'bg-purple-500', 1),
('Merchant Services', 'bg-green-500', 2),
('Personal', 'bg-yellow-500', 3);