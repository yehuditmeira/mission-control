import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get('include_archived') === '1';
  const tree = searchParams.get('tree') === '1';

  let query = supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });

  if (!includeArchived) {
    query = query.is('archived_at', null);
  }

  const { data: projects, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }

  if (!tree) return NextResponse.json(projects);

  // Build parent → children tree. Parents without parent_project_id are roots.
  const byId = new Map<number, any>();
  (projects || []).forEach((p) => byId.set(p.id, { ...p, children: [] }));
  const roots: any[] = [];
  (projects || []).forEach((p) => {
    const node = byId.get(p.id);
    if (p.parent_project_id && byId.has(p.parent_project_id)) {
      byId.get(p.parent_project_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return NextResponse.json(roots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, color, parent_project_id } = body;

  if (!name || !color) {
    return NextResponse.json({ error: 'name and color required' }, { status: 400 });
  }

  // Get max sort_order within the same parent (or global if root)
  let maxQuery = supabase
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (parent_project_id) {
    maxQuery = maxQuery.eq('parent_project_id', parent_project_id);
  } else {
    maxQuery = maxQuery.is('parent_project_id', null);
  }
  const { data: maxProject } = await maxQuery.maybeSingle();

  const sortOrder = (maxProject?.sort_order ?? -1) + 1;

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name, color, sort_order: sortOrder, parent_project_id: parent_project_id || null })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }

  return NextResponse.json(project, { status: 201 });
}
