'use client';

import Link from 'next/link';
import { PROJECTS, daysUntil } from '@/lib/projects';
import {
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  Zap,
  Loader2,
  CheckSquare,
  Calendar,
  Network,
  AlertTriangle,
  Rocket,
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
  warning?: string;
};

type Counts = {
  tasks: number;
  events: number;
  cron: number;
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
      return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] animate-pulse';
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
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Find the next 2 phases after the current one. Phases are sorted numerically.
function getUpcomingPhases(sync: ProjectSync | undefined): PhaseInfo[] {
  if (!sync || !sync.current_phase || sync.phase_list.length === 0) return [];
  const cur = sync.current_phase;
  return sync.phase_list
    .filter((p) => parseFloat(p.id) > cur)
    .slice(0, 2);
}

export default function DashboardPage() {
  const [data, setData] = useState<SyncResponse | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/sync').then((r) => r.json()),
      fetch('/api/tasks').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/events').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/cron-jobs').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([sync, tasks, events, cron]) => {
        setData(sync);
        setCounts({
          tasks: Array.isArray(tasks) ? tasks.length : 0,
          events: Array.isArray(events) ? events.length : 0,
          cron: Array.isArray(cron) ? cron.length : 0,
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  const syncMap = new Map(data?.projects.map((p) => [p.project_id, p]));

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Imminent launch banner — surfaces highest-priority deadline */}
      {(() => {
        const upcoming = PROJECTS.filter((p) => p.launchDate)
          .map((p) => ({ p, days: daysUntil(p.launchDate!) }))
          .filter(({ days }) => days >= 0 && days <= 14)
          .sort((a, b) => a.days - b.days)[0];
        if (!upcoming) return null;
        const { p, days } = upcoming;
        return (
          <Link href="/this-week">
            <div
              className="rounded-lg p-4 border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:opacity-90 transition-opacity"
              style={{ borderColor: p.color, background: `${p.color}10` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Rocket size={18} style={{ color: p.color }} className="flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))]">
                    Next launch
                  </div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                    {p.name} — {p.launchLabel}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className="text-2xl font-semibold leading-none font-[family-name:var(--font-heading)]"
                  style={{ color: p.color }}
                >
                  {days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `${days}d`}
                </div>
                <div className="text-[10px] text-[hsl(var(--foreground-dim))] mt-0.5">view tasks →</div>
              </div>
            </div>
          </Link>
        );
      })()}

      {/* Warning banner — only when /api/sync has a soft failure */}
      {data?.warning && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-0.5">Sync warning</div>
            <div className="text-amber-300/80">{data.warning}</div>
          </div>
        </div>
      )}

      {/* Hard error */}
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

      {/* At-a-glance tiles — real counts */}
      {counts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Tile href="/tasks" icon={<CheckSquare size={14} />} label="Tasks" value={counts.tasks} accent="hsl(var(--primary))" />
          <Tile href="/calendar" icon={<Calendar size={14} />} label="Events" value={counts.events} accent="hsl(var(--accent))" />
          <Tile href="/cron" icon={<Zap size={14} />} label="Cron Jobs" value={counts.cron} accent="#fbbf24" />
          <Tile href="/org" icon={<Network size={14} />} label="Agents" value={12} accent="#c084fc" subtitle="across 4 projects" />
        </div>
      )}

      {/* Project Cards — richer view with milestone + upcoming phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECTS.map((project) => {
          const sync = syncMap.get(project.id);
          const label = statusLabel(sync);
          const upcoming = getUpcomingPhases(sync);
          return (
            <Link key={project.id} href={`/tasks?project=${project.id}`}>
              <div className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5 hover:border-[hsl(var(--border-bright))] transition-all cursor-pointer overflow-hidden">
                {/* Accent left border */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg" style={{ backgroundColor: project.color }} />

                {/* Top row: status dot + name + arrow */}
                <div className="flex items-start justify-between mb-3 pl-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(label)}`} />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-[hsl(var(--foreground))] text-sm font-[family-name:var(--font-heading)]">
                        {project.name}
                      </h2>
                      <p className="text-[11px] text-[hsl(var(--foreground-dim))] truncate">{project.description}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[hsl(var(--foreground-dim))] opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </div>

                {/* Milestone + Phase info */}
                {sync?.milestone_name && (
                  <div className="mb-3 pl-2">
                    <p className="text-xs text-[hsl(var(--foreground))] font-medium">
                      {sync.milestone && <span className="text-[hsl(var(--foreground-dim))]">{sync.milestone} — </span>}
                      {sync.milestone_name}
                    </p>
                    {sync.current_phase_name && (
                      <p className="text-[11px] text-[hsl(var(--foreground-dim))] mt-0.5 truncate">
                        Phase {sync.current_phase}: {sync.current_phase_name}
                      </p>
                    )}
                  </div>
                )}

                {/* No-planning empty state */}
                {sync && !sync.has_planning && (
                  <div className="mb-3 pl-2 text-[11px] text-[hsl(var(--foreground-dim))] italic">
                    No planning data yet
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
                        style={{ width: `${sync.percent}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>
                )}

                {/* Upcoming phases preview */}
                {upcoming.length > 0 && (
                  <div className="mb-3 pl-2">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mb-1.5">Coming up</p>
                    <ul className="space-y-1">
                      {upcoming.map((p) => (
                        <li key={p.id} className="text-[11px] text-[hsl(var(--foreground-dim))] truncate">
                          <span className="text-[hsl(var(--foreground))] mr-2">Phase {p.id}</span>
                          {p.name}
                        </li>
                      ))}
                    </ul>
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
                    <span title={sync?.last_updated ?? ''}>{timeAgo(sync?.last_updated ?? null)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Tile({
  href,
  icon,
  label,
  value,
  accent,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  subtitle?: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 hover:border-[hsl(var(--border-bright))] transition-all">
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: accent }}>{icon}</span>
          <span className="text-2xl font-semibold text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
            {value}
          </span>
        </div>
        <p className="text-xs text-[hsl(var(--foreground))] font-medium">{label}</p>
        {subtitle && <p className="text-[10px] text-[hsl(var(--foreground-dim))] mt-0.5">{subtitle}</p>}
      </div>
    </Link>
  );
}
