'use client';

import Link from 'next/link';
import { PROJECTS } from '@/lib/projects';
import {
  LayoutGrid,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  Zap,
  Loader2,
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

const statusColors: Record<string, string> = {
  Active: 'text-emerald-400',
  Complete: 'text-emerald-400',
  Planned: 'text-amber-400',
  'No Planning': 'text-slate-500',
};

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-sm text-slate-400 mt-1">
            Multi-project command center
          </p>
        </div>
        {data && (
          <p className="text-xs text-slate-500">
            Synced {timeAgo(data.synced_at)}
          </p>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-sm text-red-400">
          Sync error: {error}
        </div>
      )}

      {/* Loading state */}
      {!data && !error && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Loading project data...</span>
        </div>
      )}

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECTS.map((project) => {
          const sync = syncMap.get(project.id);
          const label = statusLabel(sync);
          return (
            <Link key={project.id} href={`/tasks?project=${project.id}`}>
              <div className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all cursor-pointer">
                {/* Top row: icon + name + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: project.color + '20', color: project.color }}
                    >
                      {project.icon}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-sm">{project.name}</h2>
                      <p className="text-xs text-slate-400">{project.description}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                  />
                </div>

                {/* Milestone + Phase info */}
                {sync?.milestone_name && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-300 font-medium">
                      {sync.milestone_name}
                    </p>
                    {sync.current_phase_name && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phase {sync.current_phase}: {sync.current_phase_name}
                      </p>
                    )}
                  </div>
                )}

                {/* Progress bar */}
                {sync && sync.total_phases > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>
                        {sync.completed_phases}/{sync.total_phases} phases
                      </span>
                      <span>{sync.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
                <div className="flex items-center gap-5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} className={statusColors[label] ?? 'text-slate-400'} />
                    <span className={statusColors[label] ?? 'text-slate-400'}>
                      {label}
                    </span>
                  </div>
                  {sync && sync.phase_list.length > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={12} />
                      <span>{sync.phase_list.length} total phases</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={12} />
                    <span>{timeAgo(sync?.last_updated ?? null)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/cron">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap size={16} className="text-amber-400" />
              </div>
              <span className="font-medium text-sm">Cron Jobs</span>
            </div>
            <p className="text-xs text-slate-400">View scheduled tasks and errors</p>
          </div>
        </Link>

        <Link href="/tasks">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-blue-400" />
              </div>
              <span className="font-medium text-sm">All Tasks</span>
            </div>
            <p className="text-xs text-slate-400">Cross-project task view</p>
          </div>
        </Link>

        <Link href="/platforms">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <LayoutGrid size={16} className="text-purple-400" />
              </div>
              <span className="font-medium text-sm">Platforms</span>
            </div>
            <p className="text-xs text-slate-400">Social media channels</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
