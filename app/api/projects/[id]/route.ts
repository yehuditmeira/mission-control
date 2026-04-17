import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  
  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }

  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
