// =====================================================
// API Route: /api/platforms
// CRUD operations for marketing platforms
// =====================================================

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');

    let query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM platform_tasks WHERE platform_id = p.id AND status = 'done') as completed_tasks,
        (SELECT COUNT(*) FROM platform_tasks WHERE platform_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM content_items WHERE platform_id = p.id AND status = 'published') as published_items
      FROM platforms p
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (phase) {
      query += ' AND p.phase = ?';
      params.push(phase);
    }
    
    query += ' ORDER BY p.priority, p.start_date';

    const platforms = db.prepare(query).all(...params);

    return Response.json({ platforms });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return Response.json({ error: 'Failed to fetch platforms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const data = await request.json();

    const result = db.prepare(`
      INSERT INTO platforms (slug, name, description, priority, status, phase, start_date, autonomous_target_date, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.slug,
      data.name,
      data.description || null,
      data.priority || 0,
      data.status || 'pending',
      data.phase || 1,
      data.start_date || null,
      data.autonomous_target_date || null,
      data.config ? JSON.stringify(data.config) : null
    );

    return Response.json({ id: result.lastInsertRowid, ...data }, { status: 201 });
  } catch (error) {
    console.error('Error creating platform:', error);
    return Response.json({ error: 'Failed to create platform' }, { status: 500 });
  }
}
