import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT 
        c.*,
        p.name as platform_name,
        p.slug as platform_slug
      FROM content_items c
      JOIN platforms p ON c.platform_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (platformId) {
      query += ' AND c.platform_id = ?';
      params.push(platformId);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ?';
    params.push(limit);

    const items = db.prepare(query).all(...params);

    return Response.json({ items });
  } catch (error) {
    console.error('Error fetching content items:', error);
    return Response.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const data = await request.json();

    const result = db.prepare(`
      INSERT INTO content_items 
      (platform_id, content_type, title, description, body, media_urls, status, scheduled_for, ai_generated, ai_model)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.platform_id,
      data.content_type,
      data.title,
      data.description || null,
      data.body || null,
      data.media_urls || null,
      data.status || 'draft',
      data.scheduled_for || null,
      data.ai_generated ? 1 : 0,
      data.ai_model || null
    );

    return Response.json({ id: result.lastInsertRowid, ...data }, { status: 201 });
  } catch (error) {
    console.error('Error creating content item:', error);
    return Response.json({ error: 'Failed to create content' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getDb();
    const data = await request.json();

    if (!data.id) {
      return Response.json({ error: 'Content ID required' }, { status: 400 });
    }

    const fields = [];
    const values = [];

    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.published_at !== undefined) { fields.push('published_at = ?'); values.push(data.published_at); }
    if (data.published_url !== undefined) { fields.push('published_url = ?'); values.push(data.published_url); }
    if (data.impressions !== undefined) { fields.push('impressions = ?'); values.push(data.impressions); }
    if (data.saves !== undefined) { fields.push('saves = ?'); values.push(data.saves); }
    if (data.clicks !== undefined) { fields.push('clicks = ?'); values.push(data.clicks); }

    values.push(data.id);

    db.prepare(`UPDATE content_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return Response.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error updating content item:', error);
    return Response.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
