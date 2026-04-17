import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Get total tasks
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  // Get in progress tasks
  const { count: inProgress } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_progress');

  // Get total notes
  const { count: totalNotes } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true });

  // Get tasks due this week
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { count: dueThisWeek } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .gte('due_date', today)
    .lte('due_date', nextWeek)
    .neq('status', 'done');

  return NextResponse.json({
    totalTasks: totalTasks || 0,
    inProgress: inProgress || 0,
    dueThisWeek: dueThisWeek || 0,
    totalNotes: totalNotes || 0,
  });
}
