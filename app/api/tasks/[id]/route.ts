import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, projects(name, color)')
    .eq('id', params.id)
    .single();

  if (error || !task) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const { data: subtasks } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', params.id)
    .order('sort_order', { ascending: true });

  return NextResponse.json({
    ...task,
    project_name: task.projects?.name ?? null,
    project_color: task.projects?.color ?? null,
    subtasks: subtasks || [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  
  const updateData: Record<string, any> = {};
  const allowed = ['title', 'description', 'project_id', 'status', 'priority', 'author', 'due_date', 'start_date', 'sort_order'];
  
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
