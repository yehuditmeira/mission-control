import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Reads from the memory_logs Supabase table (populated by
// scripts/import_memory_logs.mjs). Was filesystem-backed; switched to DB so
// the page works on Vercel where the local memory/ folder isn't deployed.
export async function GET() {
  const { data, error } = await supabase
    .from('memory_logs')
    .select('id, filename, name, description, type, date, content')
    .order('date', { ascending: false, nullsFirst: false })
    .order('filename', { ascending: true });

  if (error) {
    console.error('Error fetching memory logs:', error);
    return NextResponse.json([]);
  }

  const logs = (data || []).map((row) => ({
    filename: row.filename,
    name: row.name,
    description: row.description || '',
    type: row.type as 'daily' | 'durable',
    date: row.date,
    size: row.content.length,
    preview: (row.content.replace(/^---[\s\S]*?---\n*/, '').slice(0, 200)),
  }));

  // Sort: daily logs newest-first, then durable.
  logs.sort((a, b) => {
    if (a.type === 'daily' && b.type === 'daily') return (b.date || '').localeCompare(a.date || '');
    if (a.type === 'daily') return -1;
    return 1;
  });

  return NextResponse.json(logs);
}
