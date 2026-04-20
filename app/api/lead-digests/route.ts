import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100);

  const { data, error } = await supabase
    .from('lead_digests')
    .select('*')
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ digests: [], warning: error.message });
  }

  return NextResponse.json({
    fetched_at: new Date().toISOString(),
    digests: data ?? [],
  });
}
