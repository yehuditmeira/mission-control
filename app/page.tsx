import Link from 'next/link';
import { PROJECTS } from '@/lib/projects';
import {
  LayoutGrid,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  Bot,
  Zap,
} from 'lucide-react';

// Static mock data — will be replaced with live queries
const projectMeta: Record<string, { status: string; tasks: number; lastActivity: string }> = {
  'affiliate-flow': { status: 'Active', tasks: 12, lastActivity: '2 hours ago' },
  'lead-hunter': { status: 'Building', tasks: 5, lastActivity: '1 day ago' },
  'paydirect': { status: 'Planned', tasks: 0, lastActivity: '—' },
  'personal-assistant': { status: 'Active', tasks: 3, lastActivity: '4 hours ago' },
};

const statusColors: Record<string, string> = {
  Active: 'text-emerald-400',
  Building: 'text-amber-400',
  Planned: 'text-slate-400',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
        <p className="text-sm text-slate-400 mt-1">
          Multi-project command center
        </p>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECTS.map((project) => {
          const meta = projectMeta[project.id] ?? { status: 'Unknown', tasks: 0, lastActivity: '—' };
          return (
            <Link key={project.id} href={`/tasks?project=${project.id}`}>
              <div className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all cursor-pointer">
                {/* Top row: icon + name + status */}
                <div className="flex items-start justify-between mb-4">
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

                {/* Stats row */}
                <div className="flex items-center gap-5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} className={statusColors[meta.status] ?? 'text-slate-400'} />
                    <span className={statusColors[meta.status] ?? 'text-slate-400'}>
                      {meta.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 size={12} />
                    <span>{meta.tasks} tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={12} />
                    <span>{meta.lastActivity}</span>
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
