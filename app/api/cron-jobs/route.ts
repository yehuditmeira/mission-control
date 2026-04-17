import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: jobs, error } = await supabase
    .from('cron_jobs')
    .select('*, projects(name, color)')
    .order('label', { ascending: true });

  if (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch cron jobs' }, { status: 500 });
  }

  const flatJobs = (jobs || []).map(({ projects, ...rest }: any) => ({
    ...rest,
    project_name: projects?.name ?? null,
    project_color: projects?.color ?? null,
  }));

  return NextResponse.json(flatJobs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { label, description, schedule, schedule_raw, command, project_id, source } = body;

  if (!label || !schedule) return NextResponse.json({ error: 'label and schedule required' }, { status: 400 });

  const { data: job, error } = await supabase
    .from('cron_jobs')
    .insert({
      label,
      description: description || null,
      schedule,
      schedule_raw: schedule_raw || null,
      command: command || null,
      project_id: project_id || null,
      source: source || 'manual',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'label already exists' }, { status: 409 });
    }
    console.error('Error creating cron job:', error);
    return NextResponse.json({ error: 'Failed to create cron job' }, { status: 500 });
  }

  return NextResponse.json(job, { status: 201 });
}
