import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const jobs = db.prepare(`
    SELECT c.*, p.name as project_name, p.color as project_color
    FROM cron_jobs c
    LEFT JOIN projects p ON c.project_id = p.id
    ORDER BY c.label
  `).all();
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { label, description, schedule, schedule_raw, command, project_id, source } = body;

  if (!label || !schedule) return NextResponse.json({ error: 'label and schedule required' }, { status: 400 });

  const result = db.prepare(
    'INSERT OR IGNORE INTO cron_jobs (label, description, schedule, schedule_raw, command, project_id, source) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(label, description || null, schedule, schedule_raw || null, command || null, project_id || null, source || 'manual');

  if (result.changes === 0) return NextResponse.json({ error: 'label already exists' }, { status: 409 });

  const job = db.prepare('SELECT * FROM cron_jobs WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(job, { status: 201 });
}
