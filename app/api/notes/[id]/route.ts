import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const note = db.prepare(`
    SELECT n.*, p.name as project_name, p.color as project_color
    FROM notes n LEFT JOIN projects p ON n.project_id = p.id
    WHERE n.id = ?
  `).get(params.id);
  if (!note) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(note);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.content !== undefined) { fields.push('content = ?'); values.push(body.content); }
  if (body.project_id !== undefined) { fields.push('project_id = ?'); values.push(body.project_id); }
  if (body.pinned !== undefined) { fields.push('pinned = ?'); values.push(body.pinned ? 1 : 0); }

  if (fields.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  fields.push("updated_at = datetime('now')");
  values.push(params.id);
  db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(params.id);
  return NextResponse.json(note);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM notes WHERE id = ?').run(params.id);
  return NextResponse.json({ ok: true });
}
