export interface Project {
  id: number;
  name: string;
  color: string;
  slug?: string;
  description?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Task {
  id: number;
  project_id?: number;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  author?: 'user' | 'ai';
  due_date?: string;
  start_date?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  project_name?: string;
  project_color?: string;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  completed: boolean;
  sort_order?: number;
}

export interface Note {
  id: number;
  project_id?: number;
  title: string;
  content: string;
  pinned: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: number;
  project_id?: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  recurring?: string;
  color?: string;
  created_at?: string;
  // Joined fields
  project_color?: string;
}

export interface CronJob {
  id: number;
  label: string;
  description?: string;
  schedule: string;
  schedule_raw?: string;
  command?: string;
  project_id?: number;
  source?: 'launchd' | 'apscheduler' | 'manual';
  active: boolean;
  created_at?: string;
}

// Platform-related types
export interface Platform {
  id: number;
  slug: string;
  name: string;
  description?: string;
  priority?: number;
  status: 'pending' | 'setup' | 'active' | 'paused' | 'autonomous' | 'failed';
  phase: 1 | 2 | 3 | 4;
  start_date?: string;
  autonomous_target_date?: string;
  autonomous_achieved_date?: string;
  config?: Record<string, unknown>;
  weekly_metrics?: Record<string, unknown>;
  project_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformTask {
  id: number;
  platform_id: number;
  phase: 1 | 2 | 3 | 4;
  task_number: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'blocked';
  can_automate?: number;
  automation_script?: string;
  depends_on?: string;
  deliverable_type?: string;
  deliverable_path?: string;
  deliverable_verified_at?: string;
  due_date?: string;
  completed_at?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringJob {
  id: number;
  platform_id?: number;
  name: string;
  description?: string;
  job_type: 'content_creation' | 'scheduling' | 'analytics' | 'engagement' | 'cleanup' | 'reporting';
  schedule: string;
  schedule_type: 'cron' | 'interval' | 'once';
  timezone?: string;
  script_path: string;
  script_args?: Record<string, unknown>;
  active: boolean;
  last_run_at?: string;
  last_run_status?: 'success' | 'failed' | 'running';
  last_run_output?: string;
  next_run_at?: string;
  max_retries?: number;
  retry_count?: number;
  depends_on_job_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContentItem {
  id: number;
  platform_id: number;
  job_id?: number;
  content_type: string;
  title: string;
  description?: string;
  body?: string;
  media_urls?: string;
  thumbnail_url?: string;
  affiliate_links?: Record<string, string>;
  utm_campaign?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';
  scheduled_for?: string;
  published_at?: string;
  published_url?: string;
  ai_generated?: boolean;
  ai_model?: string;
  prompt_used?: string;
  impressions?: number;
  saves?: number;
  clicks?: number;
  engagement_rate?: number;
  created_at?: string;
  updated_at?: string;
}
