import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');
    const active = searchParams.get('active');

    let query = supabase
      .from('recurring_jobs')
      .select(`
        *,
        platforms(name, slug)
      `)
      .order('active', { ascending: false })
      .order('next_run_at', { ascending: true });

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }
    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching recurring jobs:', error);
      return Response.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Flatten the join
    const flatJobs = (jobs || []).map(({ platforms, ...rest }: any) => ({
      ...rest,
      platform_name: platforms?.name ?? null,
      platform_slug: platforms?.slug ?? null,
    }));

    return Response.json({ jobs: flatJobs });
  } catch (error) {
    console.error('Error fetching recurring jobs:', error);
    return Response.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { data: job, error } = await supabase
      .from('recurring_jobs')
      .insert({
        platform_id: data.platform_id,
        name: data.name,
        description: data.description || null,
        job_type: data.job_type,
        schedule: data.schedule,
        schedule_type: data.schedule_type || 'cron',
        script_path: data.script_path,
        script_args: data.script_args || null,
        active: data.active !== undefined ? data.active : true,
        timezone: data.timezone || 'America/New_York',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring job:', error);
      return Response.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return Response.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring job:', error);
    return Response.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
