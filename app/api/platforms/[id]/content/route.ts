import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const contentType = searchParams.get('content_type');

  let query = supabase
    .from('content_items')
    .select('*')
    .eq('platform_id', id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error('Error fetching content items:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { content_type, title, description, body: contentBody, media_urls, affiliate_links, status, scheduled_for, ai_generated } = body;

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  const { data: item, error } = await supabase
    .from('content_items')
    .insert({
      platform_id: id,
      content_type: content_type || null,
      title,
      description: description || null,
      body: contentBody || null,
      media_urls: media_urls || null,
      affiliate_links: affiliate_links || null,
      status: status || 'draft',
      scheduled_for: scheduled_for || null,
      ai_generated: ai_generated ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating content item:', error);
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
  }

  return NextResponse.json(item, { status: 201 });
}
