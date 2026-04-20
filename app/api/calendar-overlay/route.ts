import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Returns calendar items derived from `operations`:
//   - MILESTONE rows with due_at falling in [start, end] => single event
//   - RECURRING_WORKFLOW rows projected onto the [start, end] range based
//     on simple cadence patterns ("every Mon 9am ET", "daily", etc.)
// Mission Control's calendar page merges these with the regular events table.

type OverlayItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'milestone' | 'workflow';
  color: string | null;
  project_name: string | null;
  notes: string | null;
};

const DOW: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

// Parse a cadence like "every Mon 9am ET" or "daily" or "every Fri 60min".
// Returns a function that takes a date and returns true if the workflow
// should fire on that date.
function cadencePredicate(cadence: string | null): ((d: Date) => boolean) | null {
  if (!cadence) return null;
  const lower = cadence.toLowerCase();

  if (/^daily\b/.test(lower)) return () => true;

  const dowMatch = lower.match(/\bevery\s+(sun|mon|tue|wed|thu|fri|sat)/);
  if (dowMatch) {
    const target = DOW[dowMatch[1]];
    return (d) => d.getDay() === target;
  }

  // "every Fri 60min" — Friday weekly
  const dowMatch2 = lower.match(/\b(sun|mon|tue|wed|thu|fri|sat)\b/);
  if (dowMatch2) {
    const target = DOW[dowMatch2[1]];
    return (d) => d.getDay() === target;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end (YYYY-MM-DD) required' }, { status: 400 });
  }

  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T23:59:59');

  const items: OverlayItem[] = [];

  // 1) Milestones in range
  const { data: milestones } = await supabase
    .from('operations')
    .select('id, title, due_at, notes, projects(name, color)')
    .eq('category', 'MILESTONE')
    .gte('due_at', startDate.toISOString())
    .lte('due_at', endDate.toISOString());

  for (const m of milestones ?? []) {
    if (!m.due_at) continue;
    items.push({
      id: `milestone-${m.id}`,
      title: m.title,
      date: m.due_at.slice(0, 10),
      type: 'milestone',
      color: (m.projects as any)?.color ?? '#a78bfa',
      project_name: (m.projects as any)?.name ?? null,
      notes: m.notes,
    });
  }

  // 2) Recurring workflows projected
  const { data: workflows } = await supabase
    .from('operations')
    .select('id, title, cadence, notes, projects(name, color)')
    .eq('category', 'RECURRING_WORKFLOW')
    .eq('enabled', true);

  for (const w of workflows ?? []) {
    const pred = cadencePredicate(w.cadence);
    if (!pred) continue;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      if (pred(cur)) {
        items.push({
          id: `workflow-${w.id}-${cur.toISOString().slice(0, 10)}`,
          title: w.title,
          date: cur.toISOString().slice(0, 10),
          type: 'workflow',
          color: (w.projects as any)?.color ?? '#7cc5ff',
          project_name: (w.projects as any)?.name ?? null,
          notes: w.notes,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  return NextResponse.json({
    fetched_at: new Date().toISOString(),
    items,
  });
}
