import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const projectId = searchParams.get('project_id');

  let query = `
    SELECT e.*, p.name as project_name, p.color as project_color
    FROM events e
    LEFT JOIN projects p ON e.project_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (start) { query += ' AND e.start_datetime >= ?'; params.push(start); }
  if (end) { query += ' AND e.start_datetime <= ?'; params.push(end); }
  if (projectId && projectId !== 'all') { query += ' AND e.project_id = ?'; params.push(projectId); }

  query += ' ORDER BY e.start_datetime';
  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { title, description, start_datetime, end_datetime, all_day, recurring, project_id, color } = body;

  if (!title || !start_datetime) return NextResponse.json({ error: 'title and start_datetime required' }, { status: 400 });

  const result = db.prepare(
    'INSERT INTO events (title, description, start_datetime, end_datetime, all_day, recurring, project_id, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || null, start_datetime, end_datetime || null, all_day ? 1 : 0, recurring || null, project_id || null, color || null);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(event, { status: 201 });
}
