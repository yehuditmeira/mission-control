'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2, RefreshCw, ShieldX } from 'lucide-react';

type Operation = {
  id: number;
  title: string;
  category: 'MACHINE_JOB' | 'RECURRING_WORKFLOW' | 'DOC' | 'TODO' | 'BLOCKER' | 'MILESTONE';
  subtype: string | null;
  cadence: string | null;
  owner: string | null;
  enabled: boolean;
  status: string | null;
  output_target: string | null;
  code_path: string | null;
  health_state: 'green' | 'yellow' | 'red' | 'unknown' | null;
  blocker_state: 'open' | 'resolved' | null;
  notes: string | null;
  created_from: string | null;
  source_path: string | null;
  external_key: string | null;
  last_error: string | null;
  updated_at: string;
  projects: { slug: string; name: string; color: string } | null;
};

type Resp = {
  fetched_at: string;
  operations: Operation[];
  warning?: string;
};

const HEALTH_COLOR: Record<string, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-amber-400',
  red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]',
  unknown: 'bg-[hsl(var(--foreground-dim))]',
};

const HEALTH_LABEL: Record<string, string> = {
  green: 'OK',
  yellow: 'WARN',
  red: 'FAILING',
  unknown: '—',
};

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function OperationsPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [project, setProject] = useState<string>('ALL');

  function load() {
    setData(null);
    fetch('/api/operations?_=' + Date.now())
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
        Error loading operations: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-[hsl(var(--foreground-dim))]">
        <Loader2 size={14} className="animate-spin" />
        Loading operations…
      </div>
    );
  }

  const ops = data.operations;
  const projects = Array.from(new Set(ops.map((o) => o.projects?.slug).filter(Boolean))) as string[];

  const filtered = ops.filter((o) => {
    if (filter !== 'ALL' && o.category !== filter) return false;
    if (project !== 'ALL' && o.projects?.slug !== project) return false;
    return true;
  });

  // Health roll-up
  const machineJobs = ops.filter((o) => o.category === 'MACHINE_JOB');
  const reds = machineJobs.filter((o) => o.health_state === 'red').length;
  const yellows = machineJobs.filter((o) => o.health_state === 'yellow').length;
  const greens = machineJobs.filter((o) => o.health_state === 'green').length;
  const unknowns = machineJobs.filter((o) => o.health_state === 'unknown' || !o.health_state).length;

  const openBlockers = ops.filter((o) => o.category === 'BLOCKER' && o.blocker_state === 'open').length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
            Operations
          </h1>
          <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1 tracking-wider uppercase">
            Single source of truth for every machine job, workflow, blocker, and todo
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]"
        >
          <RefreshCw size={12} /> refresh
        </button>
      </div>

      {/* Health roll-up */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <HealthTile label="Failing" value={reds} color="text-red-400 border-red-500/40 bg-red-500/10" />
        <HealthTile label="Warning" value={yellows} color="text-amber-300 border-amber-500/40 bg-amber-500/10" />
        <HealthTile label="OK" value={greens} color="text-emerald-300 border-emerald-500/30 bg-emerald-500/10" />
        <HealthTile label="Unknown" value={unknowns} color="text-[hsl(var(--foreground-dim))] border-[hsl(var(--border))]" />
        <HealthTile
          label="Open Blockers"
          value={openBlockers}
          color={openBlockers > 0 ? 'text-red-400 border-red-500/40 bg-red-500/10' : 'text-[hsl(var(--foreground-dim))] border-[hsl(var(--border))]'}
        />
      </div>

      {data.warning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
          Sync warning: {data.warning}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mr-2">filter</span>
        {['ALL', 'MACHINE_JOB', 'RECURRING_WORKFLOW', 'BLOCKER', 'TODO', 'MILESTONE', 'DOC'].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-[11px] px-2 py-1 rounded border ${filter === c ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))] bg-[hsl(var(--primary))]/10' : 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]'}`}
          >
            {c}
          </button>
        ))}
        <span className="mx-2 h-3 w-px bg-[hsl(var(--border))]" />
        <button
          onClick={() => setProject('ALL')}
          className={`text-[11px] px-2 py-1 rounded border ${project === 'ALL' ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))] bg-[hsl(var(--primary))]/10' : 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]'}`}
        >
          ALL PROJECTS
        </button>
        {projects.map((slug) => (
          <button
            key={slug}
            onClick={() => setProject(slug)}
            className={`text-[11px] px-2 py-1 rounded border ${project === slug ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))] bg-[hsl(var(--primary))]/10' : 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]'}`}
          >
            {slug}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30">
            <tr className="text-left text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))]">
              <th className="px-3 py-2 w-8"></th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Cadence</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-[hsl(var(--foreground-dim))]">No operations match this filter.</td></tr>
            ) : (
              filtered.map((op) => (
                <tr key={op.id} className="hover:bg-[hsl(var(--secondary))]/30">
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${HEALTH_COLOR[op.health_state ?? 'unknown']}`}
                      title={HEALTH_LABEL[op.health_state ?? 'unknown']}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-[hsl(var(--foreground))] font-mono text-[11px]">{op.title}</div>
                    {op.notes && <div className="text-[10px] text-[hsl(var(--foreground-dim))] truncate max-w-md">{op.notes}</div>}
                    {op.last_error && <div className="text-[10px] text-red-400 mt-0.5">{op.last_error}</div>}
                  </td>
                  <td className="px-3 py-2">
                    {op.projects ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: op.projects.color }} />
                        {op.projects.slug}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[hsl(var(--foreground-dim))]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${categoryClass(op.category)}`}>
                      {op.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[10px] text-[hsl(var(--foreground-dim))]">{op.cadence || '—'}</td>
                  <td className="px-3 py-2 text-[10px]">{op.status || '—'}</td>
                  <td className="px-3 py-2 text-[10px] text-[hsl(var(--foreground-dim))]">{op.created_from}</td>
                  <td className="px-3 py-2 text-[10px] text-[hsl(var(--foreground-dim))] text-right">{timeAgo(op.updated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[hsl(var(--foreground-dim))] italic">
        {ops.length} operations total · synced {timeAgo(data.fetched_at)} ·{' '}
        Run <code>node scripts/sync-operations.js</code> from the mission-control repo to refresh.
      </p>
    </div>
  );
}

function HealthTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg p-3 border ${color}`}>
      <div className="text-3xl font-semibold font-[family-name:var(--font-heading)] leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider mt-1 opacity-80">{label}</div>
    </div>
  );
}

function categoryClass(c: string): string {
  switch (c) {
    case 'MACHINE_JOB': return 'border-emerald-500/40 text-emerald-300 bg-emerald-500/5';
    case 'RECURRING_WORKFLOW': return 'border-blue-500/40 text-blue-300 bg-blue-500/5';
    case 'BLOCKER': return 'border-red-500/40 text-red-300 bg-red-500/5';
    case 'TODO': return 'border-amber-500/40 text-amber-300 bg-amber-500/5';
    case 'MILESTONE': return 'border-purple-500/40 text-purple-300 bg-purple-500/5';
    case 'DOC': return 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]';
    default: return 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]';
  }
}
