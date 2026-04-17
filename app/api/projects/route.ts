import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, color } = body;

  if (!name || !color) {
    return NextResponse.json({ error: 'name and color required' }, { status: 400 });
  }

  // Get max sort_order
  const { data: maxProject } = await supabase
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (maxProject?.sort_order ?? -1) + 1;

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name, color, sort_order: sortOrder })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }

  return NextResponse.json(project, { status: 201 });
}
