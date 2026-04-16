import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');

  let query = `
    SELECT n.*, p.name as project_name, p.color as project_color
    FROM notes n
    LEFT JOIN projects p ON n.project_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (projectId && projectId !== 'all') {
    query += ' AND n.project_id = ?';
    params.push(projectId);
  }

  query += ' ORDER BY n.pinned DESC, n.updated_at DESC';

  const notes = db.prepare(query).all(...params);
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { title, content, project_id } = body;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const result = db.prepare('INSERT INTO notes (title, content, project_id) VALUES (?, ?, ?)').run(
    title,
    content || '',
    project_id || null
  );

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(note, { status: 201 });
}
