import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order').all();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, color } = body;

  if (!name || !color) {
    return NextResponse.json({ error: 'name and color required' }, { status: 400 });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM projects').get() as { max: number | null };
  const sortOrder = (maxOrder.max ?? -1) + 1;

  const result = db.prepare('INSERT INTO projects (name, color, sort_order) VALUES (?, ?, ?)').run(name, color, sortOrder);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(project, { status: 201 });
}
