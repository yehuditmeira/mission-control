import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('content_items')
      .select('*, platforms(name, slug)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching content items:', error);
      return Response.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    // Flatten the join to match existing API shape
    const flatItems = (items || []).map(({ platforms, ...rest }: any) => ({
      ...rest,
      platform_name: platforms?.name ?? null,
      platform_slug: platforms?.slug ?? null,
    }));

    return Response.json({ items: flatItems });
  } catch (error) {
    console.error('Error fetching content items:', error);
    return Response.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { data: item, error } = await supabase
      .from('content_items')
      .insert({
        platform_id: data.platform_id,
        content_type: data.content_type,
        title: data.title,
        description: data.description || null,
        body: data.body || null,
        media_urls: data.media_urls || null,
        status: data.status || 'draft',
        scheduled_for: data.scheduled_for || null,
        ai_generated: data.ai_generated ?? false,
        ai_model: data.ai_model || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating content item:', error);
      return Response.json({ error: 'Failed to create content' }, { status: 500 });
    }

    return Response.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating content item:', error);
    return Response.json({ error: 'Failed to create content' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return Response.json({ error: 'Content ID required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.published_at !== undefined) updateData.published_at = data.published_at;
    if (data.published_url !== undefined) updateData.published_url = data.published_url;
    if (data.impressions !== undefined) updateData.impressions = data.impressions;
    if (data.saves !== undefined) updateData.saves = data.saves;
    if (data.clicks !== undefined) updateData.clicks = data.clicks;

    const { error } = await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', data.id);

    if (error) {
      console.error('Error updating content item:', error);
      return Response.json({ error: 'Failed to update content' }, { status: 500 });
    }

    return Response.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error updating content item:', error);
    return Response.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
