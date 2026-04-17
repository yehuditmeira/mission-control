import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { task_id, title } = body;

  if (!task_id || !title) {
    return NextResponse.json({ error: 'task_id and title required' }, { status: 400 });
  }

  // Get max sort_order for this task
  const { data: maxSubtask } = await supabase
    .from('subtasks')
    .select('sort_order')
    .eq('task_id', task_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (maxSubtask?.sort_order ?? -1) + 1;

  const { data: subtask, error } = await supabase
    .from('subtasks')
    .insert({ task_id, title, sort_order: sortOrder })
    .select()
    .single();

  if (error) {
    console.error('Error creating subtask:', error);
    return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
  }

  return NextResponse.json(subtask, { status: 201 });
}
