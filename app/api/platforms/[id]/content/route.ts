import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const contentType = searchParams.get('content_type');

  let query = 'SELECT * FROM content_items WHERE platform_id = ?';
  const queryParams: unknown[] = [id];

  if (status) {
    query += ' AND status = ?';
    queryParams.push(status);
  }
  if (contentType) {
    query += ' AND content_type = ?';
    queryParams.push(contentType);
  }

  query += ' ORDER BY created_at DESC';

  const items = db.prepare(query).all(...queryParams);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const { content_type, title, description, body: contentBody, media_urls, affiliate_links, status, scheduled_for, ai_generated } = body;

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO content_items (platform_id, content_type, title, description, body, media_urls, affiliate_links, status, scheduled_for, ai_generated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    content_type || null,
    title,
    description || null,
    contentBody || null,
    media_urls || null,
    affiliate_links || null,
    status || 'draft',
    scheduled_for || null,
    ai_generated ?? 0
  );

  const item = db.prepare('SELECT * FROM content_items WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(item, { status: 201 });
}
