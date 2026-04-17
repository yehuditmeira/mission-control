import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const phase = searchParams.get('phase');
    const status = searchParams.get('status');

    let query = supabase
      .from('platform_tasks')
      .select('*')
      .eq('platform_id', id)
      .order('task_number', { ascending: true });

    if (phase) {
      query = query.eq('phase', parseInt(phase));
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching platform tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching platform tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { phase, task_number, title, description, status, can_automate, automation_script, depends_on, deliverable_type, deliverable_path, due_date, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const insertData = {
      platform_id: parseInt(id),
      phase: phase || null,
      task_number: task_number ?? null,
      title,
      description: description || null,
      status: status || 'backlog',
      can_automate: can_automate ?? 0,
      automation_script: automation_script || null,
      depends_on: depends_on || null,
      deliverable_type: deliverable_type || null,
      deliverable_path: deliverable_path || null,
      due_date: due_date || null,
      tags: tags || null,
    };

    const { data: task, error } = await supabase
      .from('platform_tasks')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating platform task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating platform task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
