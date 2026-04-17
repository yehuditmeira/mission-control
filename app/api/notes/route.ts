import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');

  let query = supabase
    .from('notes')
    .select('*, projects(name, color)')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (projectId && projectId !== 'all') {
    query = query.eq('project_id', projectId);
  }

  const { data: notes, error } = await query;

  if (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }

  const flatNotes = (notes || []).map((note: any) => ({
    ...note,
    project_name: note.projects?.name ?? null,
    project_color: note.projects?.color ?? null,
  }));

  return NextResponse.json(flatNotes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, project_id } = body;

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      title,
      content: content || '',
      project_id: project_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }

  return NextResponse.json(note, { status: 201 });
}
