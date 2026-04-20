import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Single endpoint backing every MC view (Cron Jobs, Calendar, Blockers, Todos,
// Docs, Milestones). Filter via ?category=MACHINE_JOB or ?project=mrkt-drop.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const project = searchParams.get('project');
  const onlyOpenBlockers = searchParams.get('only_open') === 'true';

  let q = supabase.from('operations').select('*, projects(slug, name, color)');

  if (category) q = q.eq('category', category);
  if (onlyOpenBlockers) q = q.eq('blocker_state', 'open');

  if (project) {
    // resolve slug -> id
    const { data: p } = await supabase.from('projects').select('id').eq('slug', project).maybeSingle();
    if (p) q = q.eq('project_id', p.id);
  }

  const { data, error } = await q.order('updated_at', { ascending: false }).limit(500);

  if (error) {
    return NextResponse.json({ operations: [], warning: error.message });
  }

  return NextResponse.json({
    fetched_at: new Date().toISOString(),
    operations: data ?? [],
  });
}
