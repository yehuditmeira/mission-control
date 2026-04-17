import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: platform, error } = await supabase
      .from('platforms')
      .select(`
        *,
        completed_tasks:platform_tasks(status).eq(status, done).count(),
        total_tasks:platform_tasks.count(),
        published_items:content_items(status).eq(status, published).count(),
        items_this_week:content_items!inner.count(),
        active_jobs:recurring_jobs!inner!active(active).eq(active, true).count()
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching platform:', error);
      return Response.json({ error: 'Failed to fetch platform' }, { status: 500 });
    }

    if (!platform) {
      return Response.json({ error: 'Platform not found' }, { status: 404 });
    }

    return Response.json({ platform });
  } catch (error) {
    console.error('Error fetching platform:', error);
    return Response.json({ error: 'Failed to fetch platform' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();

    const updateData: Record<string, any> = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.phase !== undefined) updateData.phase = data.phase;
    if (data.weekly_metrics !== undefined) updateData.weekly_metrics = data.weekly_metrics;
    if (data.autonomous_achieved_date !== undefined) updateData.autonomous_achieved_date = data.autonomous_achieved_date;
    if (data.last_run_at !== undefined) updateData.last_run_at = data.last_run_at;
    if (data.next_scheduled_run !== undefined) updateData.next_scheduled_run = data.next_scheduled_run;

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('platforms')
      .update(updateData)
      .eq('id', params.id);

    if (error) {
      console.error('Error updating platform:', error);
      return Response.json({ error: 'Failed to update platform' }, { status: 500 });
    }

    return Response.json({ success: true, id: params.id });
  } catch (error) {
    console.error('Error updating platform:', error);
    return Response.json({ error: 'Failed to update platform' }, { status: 500 });
  }
}
