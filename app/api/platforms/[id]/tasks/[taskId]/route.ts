import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const db = getDb();
  const body = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];

  const allowed = ['phase', 'task_number', 'title', 'description', 'status', 'can_automate', 'automation_script', 'depends_on', 'deliverable_type', 'deliverable_path', 'due_date', 'completed_at', 'tags'];
  for (const key of allowed) {
    if (key in body) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  values.push(taskId, id);
  db.prepare(`UPDATE platform_tasks SET ${fields.join(', ')} WHERE id = ? AND platform_id = ?`).run(...values);

  const task = db.prepare('SELECT * FROM platform_tasks WHERE id = ? AND platform_id = ?').get(taskId, id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}
