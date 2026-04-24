import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  const status = searchParams.get('status');

  const phaseId = searchParams.get('phase_id');
  const dueToday = searchParams.get('due_today');

  let query = supabase
    .from('tasks')
    .select('*, projects(name, color), project_phases(name)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (projectId && projectId !== 'all') {
    query = query.eq('project_id', projectId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (phaseId && phaseId !== 'all') {
    query = query.eq('phase_id', phaseId);
  }
  if (dueToday === '1') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date();   end.setHours(23, 59, 59, 999);
    query = query.gte('due_date', start.toISOString()).lte('due_date', end.toISOString());
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }

  // Fetch subtasks for each task
  const taskIds = (tasks || []).map((t: any) => t.id);
  let subtasksMap: Record<number, any[]> = {};

  if (taskIds.length > 0) {
    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('sort_order', { ascending: true });

    subtasksMap = (subtasks || []).reduce((acc: Record<number, any[]>, st: any) => {
      if (!acc[st.task_id]) acc[st.task_id] = [];
      acc[st.task_id].push(st);
      return acc;
    }, {});
  }

  const tasksWithSubtasks = (tasks || []).map((task: any) => ({
    ...task,
    project_name: task.projects?.name ?? null,
    project_color: task.projects?.color ?? null,
    phase_name: task.project_phases?.name ?? null,
    subtasks: subtasksMap[task.id] || [],
  }));

  return NextResponse.json(tasksWithSubtasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, project_id, phase_id, status, priority, author, due_date, start_date, labels } = body;

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  // Get max sort_order
  const { data: maxTask } = await supabase
    .from('tasks')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (maxTask?.sort_order ?? -1) + 1;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description: description || null,
      project_id: project_id || null,
      phase_id: phase_id || null,
      status: status || 'todo',
      priority: priority || 'medium',
      author: author || 'user',
      due_date: due_date || null,
      start_date: start_date || null,
      labels: Array.isArray(labels) ? labels : [],
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }

  return NextResponse.json(task, { status: 201 });
}
