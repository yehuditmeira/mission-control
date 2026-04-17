import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const projectId = searchParams.get('project_id');

  let query = supabase
    .from('events')
    .select('*, projects(name, color)')
    .order('start_datetime', { ascending: true });

  if (start) {
    query = query.gte('start_datetime', start);
  }
  if (end) {
    query = query.lte('start_datetime', end);
  }
  if (projectId && projectId !== 'all') {
    query = query.eq('project_id', projectId);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }

  const flatEvents = (events || []).map(({ projects, ...rest }: any) => ({
    ...rest,
    project_name: projects?.name ?? null,
    project_color: projects?.color ?? null,
  }));

  return NextResponse.json(flatEvents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, start_datetime, end_datetime, all_day, recurring, project_id, color } = body;

  if (!title || !start_datetime) return NextResponse.json({ error: 'title and start_datetime required' }, { status: 400 });

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title,
      description: description || null,
      start_datetime,
      end_datetime: end_datetime || null,
      all_day: all_day ?? false,
      recurring: recurring || null,
      project_id: project_id || null,
      color: color || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }

  return NextResponse.json(event, { status: 201 });
}
