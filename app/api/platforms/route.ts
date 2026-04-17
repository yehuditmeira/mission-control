// =====================================================
// API Route: /api/platforms
// CRUD operations for marketing platforms (Supabase)
// =====================================================

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');

    let query = supabase
      .from('platforms')
      .select(`
        *,
        completed_tasks:platform_tasks(status).eq(status, done).count(),
        total_tasks:platform_tasks.count(),
        published_items:content_items(status).eq(status, published).count()
      `);

    if (status) {
      query = query.eq('status', status);
    }
    if (phase) {
      query = query.eq('phase', parseInt(phase));
    }

    query = query.order('priority', { ascending: true });

    const { data: platforms, error } = await query;

    if (error) {
      console.error('Error fetching platforms:', error);
      return Response.json({ error: 'Failed to fetch platforms' }, { status: 500 });
    }

    return Response.json({ platforms: platforms || [] });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return Response.json({ error: 'Failed to fetch platforms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const insertData = {
      slug: data.slug,
      name: data.name,
      description: data.description || null,
      priority: data.priority || 0,
      status: data.status || 'pending',
      phase: data.phase || 1,
      start_date: data.start_date || null,
      autonomous_target_date: data.autonomous_target_date || null,
      config: data.config || null,
    };

    const { data: platform, error } = await supabase
      .from('platforms')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating platform:', error);
      return Response.json({ error: 'Failed to create platform' }, { status: 500 });
    }

    return Response.json(platform, { status: 201 });
  } catch (error) {
    console.error('Error creating platform:', error);
    return Response.json({ error: 'Failed to create platform' }, { status: 500 });
  }
}
