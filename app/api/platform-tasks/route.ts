import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');

    let query = supabase
      .from('platform_tasks')
      .select(`
        *,
        platforms(name, slug)
      `)
      .order('platform_id', { ascending: true })
      .order('phase', { ascending: true })
      .order('task_number', { ascending: true });

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (phase) {
      query = query.eq('phase', parseInt(phase));
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching platform tasks:', error);
      return Response.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Flatten the join
    const flatTasks = (tasks || []).map(({ platforms, ...rest }: any) => ({
      ...rest,
      platform_name: platforms?.name ?? null,
      platform_slug: platforms?.slug ?? null,
    }));

    return Response.json({ tasks: flatTasks });
  } catch (error) {
    console.error('Error fetching platform tasks:', error);
    return Response.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return Response.json({ error: 'Task ID required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.deliverable_path !== undefined) updateData.deliverable_path = data.deliverable_path;
    if (data.deliverable_verified_at !== undefined) updateData.deliverable_verified_at = data.deliverable_verified_at;
    if (data.completed_at !== undefined) updateData.completed_at = data.completed_at;
    if (data.due_date !== undefined) updateData.due_date = data.due_date;

    const { data: task, error } = await supabase
      .from('platform_tasks')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating platform task:', error);
      return Response.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return Response.json({ success: true, id: data.id, task });
  } catch (error) {
    console.error('Error updating platform task:', error);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
