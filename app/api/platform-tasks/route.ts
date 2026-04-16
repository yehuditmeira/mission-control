import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');

    let query = 'SELECT t.*, p.name as platform_name, p.slug as platform_slug FROM platform_tasks t JOIN platforms p ON t.platform_id = p.id WHERE 1=1';
    const params: any[] = [];

    if (platformId) {
      query += ' AND t.platform_id = ?';
      params.push(platformId);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (phase) {
      query += ' AND t.phase = ?';
      params.push(phase);
    }

    query += ' ORDER BY t.platform_id, t.phase, t.task_number';

    const tasks = db.prepare(query).all(...params);

    return Response.json({ tasks });
  } catch (error) {
    console.error('Error fetching platform tasks:', error);
    return Response.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getDb();
    const data = await request.json();

    if (!data.id) {
      return Response.json({ error: 'Task ID required' }, { status: 400 });
    }

    const fields = [];
    const values = [];

    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.deliverable_path !== undefined) { fields.push('deliverable_path = ?'); values.push(data.deliverable_path); }
    if (data.deliverable_verified_at !== undefined) { fields.push('deliverable_verified_at = ?'); values.push(data.deliverable_verified_at); }
    if (data.completed_at !== undefined) { fields.push('completed_at = ?'); values.push(data.completed_at); }
    if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date); }

    values.push(data.id);

    db.prepare(`UPDATE platform_tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return Response.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error updating platform task:', error);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
