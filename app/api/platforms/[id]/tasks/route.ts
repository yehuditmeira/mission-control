import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const phase = searchParams.get('phase');
  const status = searchParams.get('status');

  let query = 'SELECT * FROM platform_tasks WHERE platform_id = ?';
  const queryParams: unknown[] = [id];

  if (phase) {
    query += ' AND phase = ?';
    queryParams.push(phase);
  }
  if (status) {
    query += ' AND status = ?';
    queryParams.push(status);
  }

  query += ' ORDER BY task_number ASC';

  const tasks = db.prepare(query).all(...queryParams);
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const { phase, task_number, title, description, status, can_automate, automation_script, depends_on, deliverable_type, deliverable_path, due_date, tags } = body;

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO platform_tasks (platform_id, phase, task_number, title, description, status, can_automate, automation_script, depends_on, deliverable_type, deliverable_path, due_date, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    phase || null,
    task_number ?? null,
    title,
    description || null,
    status || 'pending',
    can_automate ?? 0,
    automation_script || null,
    depends_on || null,
    deliverable_type || null,
    deliverable_path || null,
    due_date || null,
    tags || null
  );

  const task = db.prepare('SELECT * FROM platform_tasks WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(task, { status: 201 });
}
