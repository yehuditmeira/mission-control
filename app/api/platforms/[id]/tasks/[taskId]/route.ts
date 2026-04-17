import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const body = await req.json();

  const updateData: Record<string, any> = {};
  const allowed = ['phase', 'task_number', 'title', 'description', 'status', 'can_automate', 'automation_script', 'depends_on', 'deliverable_type', 'deliverable_path', 'due_date', 'completed_at', 'tags'];
  
  for (const key of allowed) {
    if (key in body) {
      updateData[key] = body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: task, error } = await supabase
    .from('platform_tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('platform_id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating platform task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;

  const { error } = await supabase
    .from('platform_tasks')
    .delete()
    .eq('id', taskId)
    .eq('platform_id', id);

  if (error) {
    console.error('Error deleting platform task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
