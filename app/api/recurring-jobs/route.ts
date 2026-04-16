import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');
    const active = searchParams.get('active');

    let query = `
      SELECT 
        j.*,
        p.name as platform_name,
        p.slug as platform_slug,
        (SELECT COUNT(*) FROM job_logs WHERE job_id = j.id AND status = 'success') as success_count,
        (SELECT COUNT(*) FROM job_logs WHERE job_id = j.id AND status = 'failed') as fail_count
      FROM recurring_jobs j
      JOIN platforms p ON j.platform_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (platformId) {
      query += ' AND j.platform_id = ?';
      params.push(platformId);
    }
    if (active !== null) {
      query += ' AND j.active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY j.active DESC, j.next_run_at';

    const jobs = db.prepare(query).all(...params);

    return Response.json({ jobs });
  } catch (error) {
    console.error('Error fetching recurring jobs:', error);
    return Response.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const data = await request.json();

    const result = db.prepare(`
      INSERT INTO recurring_jobs 
      (platform_id, name, description, job_type, schedule, schedule_type, script_path, script_args, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.platform_id,
      data.name,
      data.description || null,
      data.job_type,
      data.schedule,
      data.schedule_type || 'cron',
      data.script_path,
      data.script_args ? JSON.stringify(data.script_args) : null,
      data.active !== undefined ? (data.active ? 1 : 0) : 1
    );

    return Response.json({ id: result.lastInsertRowid, ...data }, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring job:', error);
    return Response.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
