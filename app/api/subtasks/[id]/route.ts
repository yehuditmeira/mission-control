import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  
  const updateData: Record<string, any> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.completed !== undefined) updateData.completed = body.completed;
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { data: subtask, error } = await supabase
    .from('subtasks')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }

  return NextResponse.json(subtask);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
