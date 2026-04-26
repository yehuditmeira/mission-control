import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  const filename = decodeURIComponent(params.filename);
  const lookup = filename.endsWith('.md') ? filename : `${filename}.md`;

  const { data, error } = await supabase
    .from('memory_logs')
    .select('filename, content')
    .eq('filename', lookup)
    .maybeSingle();

  if (error) {
    console.error('Error reading memory log:', error);
    return NextResponse.json({ error: 'read error' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ filename: data.filename, content: data.content });
}
