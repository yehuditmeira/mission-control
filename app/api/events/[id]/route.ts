import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const updateData: Record<string, any> = {};
  const allowed = ['title', 'description', 'start_datetime', 'end_datetime', 'all_day', 'recurring', 'project_id', 'color'];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { data: event, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }

  return NextResponse.json(event);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
