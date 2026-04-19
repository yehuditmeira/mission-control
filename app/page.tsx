'use client';

import Link from 'next/link';
import { PROJECTS } from '@/lib/projects';
import {
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  Zap,
  Loader2,
  LayoutGrid,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type PhaseInfo = { id: string; name: string };

type ProjectSync = {
  project_id: string;
  current_phase: number | null;
  current_phase_name: string | null;
  milestone: string | null;
  milestone_name: string | null;
  status: string | null;
  total_phases: number;
  completed_phases: number;
  percent: number;
  phase_list: PhaseInfo[];
  last_updated: string | null;
  has_planning: boolean;
};

type SyncResponse = {
  synced_at: string;
  projects: ProjectSync[];
};

function statusLabel(sync: ProjectSync | undefined): string {
  if (!sync || !sync.has_planning) return 'No Planning';
  if (sync.percent >= 100) return 'Complete';
  if (sync.status?.toLowerCase().includes('progress')) return 'Active';
  if (sync.status?.toLowerCase().includes('not started')) return 'Planned';
  if (sync.status) return 'Active';
  return 'Planned';
}

function statusDot(label: string): string {
  switch (label) {
    case 'Active':
      return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]';
    case 'Complete':
      return 'bg-emerald-400';
    case 'Planned':
      return 'bg-[hsl(var(--primary))]';
    default:
      return 'bg-[hsl(var(--foreground-dim))]';
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sync')
      .then((r) => {
        if (!r.ok) throw new Error(`Sync failed: ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const syncMap = new Map(data?.projects.map((p) => [p.project_id, p]));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
            Mission Control
          </h1>
          <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1 tracking-wider uppercase">
            Multi-project command center
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--foreground-dim))]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Synced {timeAgo(data.synced_at)}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
          Sync error: {error}
        </div>
      )}

      {/* Loading state */}
      {!data && !error && (
        <div className="flex items-center justify-center py-16 text-[hsl(var(--foreground-dim))]">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-sm">Loading project data...</span>
        </div>
      )}

      {/* Project Cards — hierarchical layout with accent left borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECTS.map((project) => {
          const sync = syncMap.get(project.id);
          const label = statusLabel(sync);
          return (
            <Link key={project.id} href={`/tasks?project=${project.id}`}>
              <div
                className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5 hover:border-[hsl(var(--border-bright))] transition-all cursor-pointer overflow-hidden"
              >
                {/* Accent left border */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
                  style={{ backgroundColor: project.color }}
                />

                {/* Top row: status dot + name + arrow */}
                <div className="flex items-start justify-between mb-3 pl-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(label)}`} />
                    <div>
                      <h2 className="font-semibold text-[hsl(var(--foreground))] text-sm font-[family-name:var(--font-heading)]">
                        {project.name}
                      </h2>
                      <p className="text-[11px] text-[hsl(var(--foreground-dim))]">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-[hsl(var(--foreground-dim))] opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                  />
                </div>

                {/* Milestone + Phase info */}
                {sync?.milestone_name && (
                  <div className="mb-3 pl-2">
                    <p className="text-xs text-[hsl(var(--foreground))] font-medium">
                      {sync.milestone} — {sync.milestone_name}
                    </p>
                    {sync.current_phase_name && (
                      <p className="text-[11px] text-[hsl(var(--foreground-dim))] mt-0.5">
                        Phase {sync.current_phase}: {sync.current_phase_name}
                      </p>
                    )}
                  </div>
                )}

                {/* Progress bar */}
                {sync && sync.total_phases > 0 && (
                  <div className="mb-3 pl-2">
                    <div className="flex items-center justify-between text-[11px] text-[hsl(var(--foreground-dim))] mb-1.5">
                      <span>
                        {sync.completed_phases}/{sync.total_phases} phases
                      </span>
                      <span style={{ color: project.color }}>{sync.percent}%</span>
                    </div>
                    <div className="w-full h-1 bg-[hsl(var(--border))] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${sync.percent}%`,
                          backgroundColor: project.color,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 text-[11px] pl-2">
                  <div className="flex items-center gap-1.5">
                    <Activity size={11} style={{ color: project.color }} />
                    <span className="text-[hsl(var(--foreground-dim))]">{label}</span>
                  </div>
                  {sync && sync.phase_list.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[hsl(var(--foreground-dim))]">
                      <CheckCircle2 size={11} />
                      <span>{sync.phase_list.length} phases</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[hsl(var(--foreground-dim))]">
                    <Clock size={11} />
                    <span>{timeAgo(sync?.last_updated ?? null)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions — minimal cards */}
      <div>
        <h2 className="text-[10px] font-semibold text-[hsl(var(--foreground-dim))] uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/cron">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 hover:border-[hsl(var(--border-bright))] transition-all">
              <div className="flex items-center gap-3">
                <Zap size={14} className="text-[hsl(var(--primary))]" />
                <div>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">Cron Jobs</span>
                  <p className="text-[11px] text-[hsl(var(--foreground-dim))]">Scheduled tasks</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/tasks">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 hover:border-[hsl(var(--border-bright))] transition-all">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={14} className="text-[hsl(var(--accent))]" />
                <div>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">All Tasks</span>
                  <p className="text-[11px] text-[hsl(var(--foreground-dim))]">Cross-project view</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/platforms">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 hover:border-[hsl(var(--border-bright))] transition-all">
              <div className="flex items-center gap-3">
                <LayoutGrid size={14} className="text-[hsl(var(--accent))]" />
                <div>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">Platforms</span>
                  <p className="text-[11px] text-[hsl(var(--foreground-dim))]">Social channels</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
