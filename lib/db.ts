// =====================================================
// Database abstraction layer - migrated to Supabase
// Replaces better-sqlite3 with @supabase/supabase-js
// =====================================================

import { supabase } from './supabase';

// Re-export supabase client for direct usage if needed
export { supabase };

// Helper type for query results
type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

// Legacy DB helper - returns null during build/static generation
export function getDb() {
  // Skip DB during build/static generation
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  return supabase;
}

// Table-specific query helpers for migration compatibility
export const dbHelpers = {
  // Projects
  projects: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });
      return { data, error };
    },
    getById: async (id: string | number) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },
  },

  // Tasks
  tasks: {
    getAll: async (filters?: { project_id?: string; status?: string }) => {
      let query = supabase
        .from('tasks')
        .select('*, projects(name, color), subtasks(*)')
        .order('sort_order', { ascending: true });
      
      if (filters?.project_id && filters.project_id !== 'all') {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      return query;
    },
    getById: async (id: string | number) => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name, color), subtasks(*)')
        .eq('id', id)
        .single();
      return { data, error };
    },
  },

  // Notes
  notes: {
    getAll: async (filters?: { project_id?: string }) => {
      let query = supabase
        .from('notes')
        .select('*, projects(name, color)')
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (filters?.project_id && filters.project_id !== 'all') {
        query = query.eq('project_id', filters.project_id);
      }
      
      return query;
    },
  },

  // Subtasks
  subtasks: {
    getByTaskId: async (taskId: string | number) => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true });
      return { data, error };
    },
  },

  // Events
  events: {
    getAll: async (filters?: { start?: string; end?: string; project_id?: string }) => {
      let query = supabase
        .from('events')
        .select('*, projects(name, color)')
        .order('start_datetime', { ascending: true });
      
      if (filters?.start) {
        query = query.gte('start_datetime', filters.start);
      }
      if (filters?.end) {
        query = query.lte('start_datetime', filters.end);
      }
      if (filters?.project_id && filters.project_id !== 'all') {
        query = query.eq('project_id', filters.project_id);
      }
      
      return query;
    },
  },

  // Stats
  stats: {
    getCounts: async () => {
      const results = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        totalTasks: results[0].count || 0,
        inProgress: results[1].count || 0,
        totalNotes: results[2].count || 0,
      };
    },
  },
};
