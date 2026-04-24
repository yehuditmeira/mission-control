import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  const includeArchived = searchParams.get('include_archived') === '1';

  let query = supabase
    .from('project_phases')
    .select('*')
    .order('project_id', { ascending: true })
    .order('sort_order', { ascending: true });

  if (projectId && projectId !== 'all') {
    query = query.eq('project_id', projectId);
  }
  if (!includeArchived) {
    query = query.is('archived_at', null);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching phases:', error);
    return NextResponse.json({ error: 'Failed to fetch phases' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { project_id, name } = body;
  if (!project_id || !name) {
    return NextResponse.json({ error: 'project_id and name required' }, { status: 400 });
  }

  const { data: max } = await supabase
    .from('project_phases')
    .select('sort_order')
    .eq('project_id', project_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (max?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('project_phases')
    .insert({ project_id, name, sort_order: sortOrder })
    .select()
    .single();

  if (error) {
    console.error('Error creating phase:', error);
    return NextResponse.json({ error: 'Failed to create phase' }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
