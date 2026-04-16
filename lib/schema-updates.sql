-- =====================================================
-- PLATFORM MARKETING AUTOMATION SCHEMA
-- SQLite schema for 7-platform autonomous marketing agents
-- =====================================================

-- Platforms table: 7 social platforms configuration
CREATE TABLE IF NOT EXISTS platforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE, -- pinterest, instagram, facebook, tiktok, twitter, whatsapp, seo
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','setup','active','paused','autonomous','failed')),
  phase INTEGER NOT NULL DEFAULT 1 CHECK(phase IN (1,2,3,4)),
  
  -- Timeline fields
  start_date TEXT,
  autonomous_target_date TEXT,
  autonomous_achieved_date TEXT,
  
  -- Configuration (JSON)
  config TEXT, -- JSON: api_keys, webhooks, settings
  
  -- Metrics (JSON for flexibility)
  weekly_metrics TEXT, -- JSON: impressions, saves, clicks, followers
  
  -- Tracking
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_run_at TEXT,
  next_scheduled_run TEXT
);

-- Platform-specific tasks (GSD phases broken down)
CREATE TABLE IF NOT EXISTS platform_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK(phase IN (1,2,3,4)),
  task_number TEXT NOT NULL, -- "1.1", "1.2", etc.
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','todo','in_progress','done','blocked')),
  
  -- Automation fields
  can_automate INTEGER NOT NULL DEFAULT 0, -- 0=manual, 1=AI-assisted, 2=fully autonomous
  automation_script TEXT, -- path to script that handles this task
  
  -- Dependencies (comma-separated task_number references)
  depends_on TEXT,
  
  -- Deliverable tracking
  deliverable_type TEXT, -- file, screenshot, url, metric
  deliverable_path TEXT,
  deliverable_verified_at TEXT,
  
  -- Scheduling
  due_date TEXT,
  completed_at TEXT,
  
  -- Metadata
  tags TEXT, -- comma-separated
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(platform_id, task_number)
);

-- Recurring jobs for autonomous operation
CREATE TABLE IF NOT EXISTS recurring_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  
  -- Job definition
  name TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL CHECK(job_type IN ('content_creation','scheduling','analytics','engagement','cleanup','reporting')),
  
  -- Schedule (cron-style or ISO 8601 duration)
  schedule TEXT NOT NULL, -- "0 9 * * *" or "PT2H"
  schedule_type TEXT NOT NULL DEFAULT 'cron' CHECK(schedule_type IN ('cron','interval','once')),
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Script to execute
  script_path TEXT NOT NULL,
  script_args TEXT, -- JSON arguments
  
  -- Execution tracking
  active INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  last_run_status TEXT CHECK(last_run_status IN ('success','failed','running')),
  last_run_output TEXT, -- truncated output log reference
  next_run_at TEXT,
  
  -- Retry config
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  
  -- Dependencies
  depends_on_job_id INTEGER REFERENCES recurring_jobs(id),
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(platform_id, name)
);

-- Job execution logs
CREATE TABLE IF NOT EXISTS job_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES recurring_jobs(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES platforms(id),
  
  -- Execution details
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('running','success','failed','cancelled')),
  exit_code INTEGER,
  
  -- Output capture
  stdout TEXT,
  stderr TEXT,
  output_file TEXT, -- path to full log file
  
  -- Metrics captured
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- AI generation metadata
  model_used TEXT, -- qwen3:8b, gemma3:12b
  tokens_used INTEGER,
  cost_estimate REAL,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content items (pins, posts, etc.)
CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES job_logs(id),
  
  -- Content details
  content_type TEXT NOT NULL, -- pin, post, story, reel, video, image, blog_post
  title TEXT NOT NULL,
  description TEXT,
  body TEXT,
  
  -- Media
  media_urls TEXT, -- comma-separated paths/URLs
  thumbnail_url TEXT,
  
  -- Affiliate/tracking
  affiliate_links TEXT, -- JSON: product_id to url mapping
  utm_campaign TEXT,
  
  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','published','failed','archived')),
  scheduled_for TEXT,
  published_at TEXT,
  published_url TEXT,
  
  -- AI generation tracking
  ai_generated INTEGER DEFAULT 0,
  ai_model TEXT,
  prompt_used TEXT,
  
  -- Performance (updated by analytics jobs)
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate REAL,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Keywords for SEO/Pinterest
CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition TEXT CHECK(competition IN ('low','medium','high')),
  relevance_score INTEGER CHECK(relevance_score BETWEEN 1 AND 10),
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  avg_performance REAL, -- click-through or similar
  
  -- Categorization
  category TEXT, -- shabbos, simcha, workwear, etc.
  intent TEXT CHECK(intent IN ('informational','transactional','navigational')),
  
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Calendar events for platform launches
CREATE TABLE IF NOT EXISTS platform_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK(event_type IN ('phase_start','phase_end','milestone','deadline','review')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  event_date TEXT NOT NULL,
  all_day INTEGER DEFAULT 1,
  
  -- Status
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  
  -- Notification
  notify_before_hours INTEGER DEFAULT 24,
  notification_sent INTEGER DEFAULT 0,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_platforms_status ON platforms(status);
CREATE INDEX IF NOT EXISTS idx_platforms_phase ON platforms(phase);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_status ON platform_tasks(status);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_phase ON platform_tasks(phase);
CREATE INDEX IF NOT EXISTS idx_recurring_jobs_next_run ON recurring_jobs(next_run_at) WHERE active = 1;
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_logs(status);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled ON content_items(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_keywords_platform ON keywords(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_date ON platform_events(event_date);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER IF NOT EXISTS trg_platforms_updated
AFTER UPDATE ON platforms
BEGIN
  UPDATE platforms SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_platform_tasks_updated
AFTER UPDATE ON platform_tasks
BEGIN
  UPDATE platform_tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_recurring_jobs_updated
AFTER UPDATE ON recurring_jobs
BEGIN
  UPDATE recurring_jobs SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_content_items_updated
AFTER UPDATE ON content_items
BEGIN
  UPDATE content_items SET updated_at = datetime('now') WHERE id = NEW.id;
END;
