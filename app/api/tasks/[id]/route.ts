import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const task = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(params.id);

  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order').all(params.id);

  return NextResponse.json({ ...task as Record<string, unknown>, subtasks });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowed = ['title', 'description', 'project_id', 'status', 'priority', 'author', 'due_date', 'start_date', 'sort_order'];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  fields.push("updated_at = datetime('now')");
  values.push(params.id);
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id);
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(params.id);
  return NextResponse.json({ ok: true });
}
