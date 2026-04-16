import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const platform = db.prepare(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM platform_tasks WHERE platform_id = p.id AND status = 'done') as completed_tasks,
        (SELECT COUNT(*) FROM platform_tasks WHERE platform_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM content_items WHERE platform_id = p.id AND status = 'published') as published_items,
        (SELECT COUNT(*) FROM content_items WHERE platform_id = p.id AND created_at >= datetime('now', '-7 days')) as items_this_week,
        (SELECT COUNT(*) FROM recurring_jobs WHERE platform_id = p.id AND active = 1) as active_jobs
      FROM platforms p
      WHERE p.id = ?
    `).get(params.id);

    if (!platform) {
      return Response.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Parse JSON fields
    if (platform.config) {
      try { platform.config = JSON.parse(platform.config); } catch { }
    }
    if (platform.weekly_metrics) {
      try { platform.weekly_metrics = JSON.parse(platform.weekly_metrics); } catch { }
    }

    return Response.json({ platform });
  } catch (error) {
    console.error('Error fetching platform:', error);
    return Response.json({ error: 'Failed to fetch platform' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const data = await request.json();

    const fields = [];
    const values = [];

    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.phase !== undefined) { fields.push('phase = ?'); values.push(data.phase); }
    if (data.weekly_metrics !== undefined) { fields.push('weekly_metrics = ?'); values.push(JSON.stringify(data.weekly_metrics)); }
    if (data.autonomous_achieved_date !== undefined) { fields.push('autonomous_achieved_date = ?'); values.push(data.autonomous_achieved_date); }
    if (data.last_run_at !== undefined) { fields.push('last_run_at = ?'); values.push(data.last_run_at); }
    if (data.next_scheduled_run !== undefined) { fields.push('next_scheduled_run = ?'); values.push(data.next_scheduled_run); }

    if (fields.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(params.id);

    db.prepare(`UPDATE platforms SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);

    return Response.json({ success: true, id: params.id });
  } catch (error) {
    console.error('Error updating platform:', error);
    return Response.json({ error: 'Failed to update platform' }, { status: 500 });
  }
}
