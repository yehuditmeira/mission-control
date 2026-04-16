export interface Project {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number | null;
  title: string;
  description: string | null;
  status: 'backlog' | 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  author: 'user' | 'ai';
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  project?: Project;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  completed: number;
  sort_order: number;
}

export interface Note {
  id: number;
  project_id: number | null;
  title: string;
  content: string;
  pinned: number;
  created_at: string;
  updated_at: string;
  project?: Project;
}

export interface CalendarEvent {
  id: number;
  project_id: number | null;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  all_day: number;
  recurring: string | null;
  color: string | null;
  created_at: string;
}

export interface CronJob {
  id: number;
  label: string;
  description: string | null;
  schedule: string;
  schedule_raw: string | null;
  command: string | null;
  project_id: number | null;
  source: 'launchd' | 'apscheduler' | 'manual';
  active: number;
  created_at: string;
}

export interface MemoryLog {
  date: string;
  filename: string;
  content: string;
  type: 'daily' | 'durable';
}
