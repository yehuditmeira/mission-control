import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: note, error } = await supabase
    .from('notes')
    .select('*, projects(name, color)')
    .eq('id', params.id)
    .single();

  if (error || !note) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...note,
    project_name: note.projects?.name ?? null,
    project_color: note.projects?.color ?? null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  
  const updateData: Record<string, any> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.project_id !== undefined) updateData.project_id = body.project_id;
  if (body.pinned !== undefined) updateData.pinned = body.pinned;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { data: note, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }

  return NextResponse.json(note);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
