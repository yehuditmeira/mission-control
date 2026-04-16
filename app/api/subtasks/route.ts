import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { task_id, title } = body;

  if (!task_id || !title) {
    return NextResponse.json({ error: 'task_id and title required' }, { status: 400 });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM subtasks WHERE task_id = ?').get(task_id) as { max: number | null };
  const sortOrder = (maxOrder.max ?? -1) + 1;

  const result = db.prepare('INSERT INTO subtasks (task_id, title, sort_order) VALUES (?, ?, ?)').run(task_id, title, sortOrder);
  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(subtask, { status: 201 });
}
