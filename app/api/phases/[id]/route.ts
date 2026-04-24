import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.name === 'string')        updates.name = body.name;
  if (typeof body.sort_order === 'number')  updates.sort_order = body.sort_order;
  if (body.archived === true)               updates.archived_at = new Date().toISOString();
  if (body.archived === false)              updates.archived_at = null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'no updates' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_phases')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating phase:', error);
    return NextResponse.json({ error: 'Failed to update phase' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Soft-delete = archive. Preserves task history.
  const { data, error } = await supabase
    .from('project_phases')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving phase:', error);
    return NextResponse.json({ error: 'Failed to archive phase' }, { status: 500 });
  }
  return NextResponse.json(data);
}
