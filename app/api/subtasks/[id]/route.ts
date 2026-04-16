import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.completed !== undefined) { fields.push('completed = ?'); values.push(body.completed ? 1 : 0); }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }

  if (fields.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  values.push(params.id);
  db.prepare(`UPDATE subtasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(params.id);
  return NextResponse.json(subtask);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(params.id);
  return NextResponse.json({ ok: true });
}
