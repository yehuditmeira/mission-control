'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Target, CheckCircle2, Clock, Calendar } from 'lucide-react';

type Milestone = {
  id: number;
  title: string;
  status: string | null;
  due_at: string | null;
  notes: string | null;
  projects: { slug: string; name: string; color: string } | null;
};

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(iso);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
}

function dueLabel(d: number): { text: string; tone: string } {
  if (d < 0) return { text: `${-d}d ago`, tone: 'past' };
  if (d === 0) return { text: 'TODAY', tone: 'today' };
  if (d === 1) return { text: 'TOMORROW', tone: 'soon' };
  if (d <= 7) return { text: `in ${d}d`, tone: 'soon' };
  if (d <= 30) return { text: `in ${d}d`, tone: 'this-month' };
  return { text: `in ${d}d`, tone: 'far' };
}

const TONE: Record<string, string> = {
  past: 'text-[hsl(var(--foreground-dim))] border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/20',
  today: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  soon: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  'this-month': 'text-sky-300 border-sky-500/30 bg-sky-500/10',
  far: 'text-[hsl(var(--foreground-dim))] border-[hsl(var(--border))]',
};

export default function MilestonesPage() {
  const [ms, setMs] = useState<Milestone[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/operations?category=MILESTONE&_=' + Date.now())
      .then((r) => r.json())
      .then((d) => setMs(d.operations || []))
      .catch((e) => setError(e.message));
  }, []);

  const projects = useMemo(() => {
    if (!ms) return [];
    return Array.from(new Set(ms.map((m) => m.projects?.slug).filter(Boolean))) as string[];
  }, [ms]);

  const filtered = useMemo(() => {
    if (!ms) return [];
    const sorted = [...ms].sort((a, b) => {
      const A = a.due_at ? new Date(a.due_at).getTime() : Infinity;
      const B = b.due_at ? new Date(b.due_at).getTime() : Infinity;
      return A - B;
    });
    return sorted.filter((m) => project === 'ALL' || m.projects?.slug === project);
  }, [ms, project]);

  if (error) return <div className="bg-red-500/10 border border-red-500/30 rounded p-4 text-sm text-red-400">{error}</div>;
  if (!ms) {
    return (
      <div className="flex items-center gap-2 text-[hsl(var(--foreground-dim))]">
        <Loader2 size={14} className="animate-spin" /> Loading milestones…
      </div>
    );
  }

  // Group by month
  const groups = new Map<string, Milestone[]>();
  for (const m of filtered) {
    if (!m.due_at) continue;
    const dt = new Date(m.due_at);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const upcoming = filtered.filter((m) => m.due_at && daysUntil(m.due_at) >= 0).slice(0, 3);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
          Milestones
        </h1>
        <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1 tracking-wider uppercase">
          {ms.length} date-anchored goals · sourced from Gantt + launch + project state docs
        </p>
      </div>

      {/* Highlights */}
      {upcoming.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {upcoming.map((m) => {
            const days = m.due_at ? daysUntil(m.due_at) : 0;
            const lbl = dueLabel(days);
            return (
              <div key={m.id} className={`rounded-lg p-4 border ${TONE[lbl.tone]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} />
                  <span className="text-[10px] uppercase tracking-wider opacity-80">{m.projects?.slug ?? '—'}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{m.title}</p>
                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-current/20">
                  <span className="text-[10px]">{m.due_at?.slice(0, 10)}</span>
                  <span className="text-base font-semibold font-[family-name:var(--font-heading)]">{lbl.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {['ALL', ...projects].map((p) => (
          <button
            key={p}
            onClick={() => setProject(p)}
            className={`text-[11px] px-2 py-1 rounded border ${
              project === p
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))] bg-[hsl(var(--primary))]/10'
                : 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Timeline by month */}
      <div className="space-y-6">
        {Array.from(groups.entries()).map(([key, items]) => (
          <div key={key}>
            <h2 className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mb-2 flex items-center gap-1.5">
              <Calendar size={10} />
              {new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </h2>
            <ul className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg divide-y divide-[hsl(var(--border))]">
              {items.map((m) => {
                const days = m.due_at ? daysUntil(m.due_at) : 0;
                const lbl = dueLabel(days);
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    {days < 0 ? (
                      <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Clock size={14} className="text-[hsl(var(--foreground-dim))] flex-shrink-0" />
                    )}
                    <span className="text-[10px] text-[hsl(var(--foreground-dim))] uppercase tracking-wider w-32 flex-shrink-0">
                      {m.due_at?.slice(0, 10)}
                    </span>
                    {m.projects && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: m.projects.color }}
                        title={m.projects.slug}
                      />
                    )}
                    <span className="text-sm text-[hsl(var(--foreground))] flex-1 truncate">{m.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border ${TONE[lbl.tone]}`}>
                      {lbl.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
