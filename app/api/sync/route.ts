import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type PhaseInfo = {
  id: string;
  name: string;
};

type ProjectSync = {
  project_id: string;
  current_phase: number | null;
  current_phase_name: string | null;
  milestone: string | null;
  milestone_name: string | null;
  status: string | null;
  total_phases: number;
  completed_phases: number;
  percent: number;
  phase_list: PhaseInfo[];
  last_updated: string | null;
  has_planning: boolean;
};

export async function GET() {
  const { data, error } = await supabase
    .from('project_sync')
    .select('*');

  if (error) {
    // Never 500 the dashboard — render empty state with diagnostic instead.
    // Common cases: table missing on DB, env mismatch, RLS misconfig.
    return NextResponse.json({
      synced_at: new Date().toISOString(),
      projects: [],
      warning: error.message,
    });
  }

  // Parse phase_list from JSON string if needed
  const projects: ProjectSync[] = (data || []).map((row) => ({
    project_id: row.project_id,
    current_phase: row.current_phase,
    current_phase_name: row.current_phase_name,
    milestone: row.milestone,
    milestone_name: row.milestone_name,
    status: row.status,
    total_phases: row.total_phases ?? 0,
    completed_phases: row.completed_phases ?? 0,
    percent: row.percent ?? 0,
    phase_list: typeof row.phase_list === 'string'
      ? JSON.parse(row.phase_list)
      : (row.phase_list || []),
    last_updated: row.last_updated,
    has_planning: row.has_planning ?? false,
  }));

  return NextResponse.json({
    synced_at: new Date().toISOString(),
    projects,
    _debug: {
      url: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 50),
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  });
}
