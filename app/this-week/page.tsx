'use client';

import { PROJECTS, daysUntil, type ProjectDef, type ThisWeekTask } from '@/lib/projects';
import { Calendar, Rocket, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

// Mission Control's job: tell Kate what to do, not the other way around.
// This page pulls real this-week tasks + launch dates from each project's
// marketing/planning docs (mirrored into lib/projects.ts) so Kate can open
// the dashboard and see "today's posts + this week's blockers" at a glance.

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${DOW[d.getDay()]}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function dueLabel(iso?: string): { text: string; tone: 'overdue' | 'today' | 'soon' | 'later' | 'none' } {
  if (!iso) return { text: '', tone: 'none' };
  const days = daysUntil(iso);
  if (days < 0) return { text: `${-days}d overdue`, tone: 'overdue' };
  if (days === 0) return { text: 'today', tone: 'today' };
  if (days === 1) return { text: 'tomorrow', tone: 'soon' };
  if (days <= 7) return { text: `in ${days}d`, tone: 'soon' };
  return { text: `in ${days}d`, tone: 'later' };
}

const TONE_CLASSES: Record<string, string> = {
  overdue: 'text-red-400 bg-red-500/10 border-red-500/30',
  today: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
  soon: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  later: 'text-[hsl(var(--foreground-dim))] bg-[hsl(var(--border))]/40 border-[hsl(var(--border))]',
  none: '',
};

function LaunchCard({ project }: { project: ProjectDef }) {
  if (!project.launchDate) return null;
  const days = daysUntil(project.launchDate);
  const isPast = days < 0;
  const isImminent = days >= 0 && days <= 7;
  return (
    <div
      className="rounded-lg p-5 border"
      style={{ borderColor: project.color, background: `${project.color}10` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rocket size={14} style={{ color: project.color }} />
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))]">
              {project.name} launch
            </span>
          </div>
          <p className="text-sm text-[hsl(var(--foreground))] font-medium">{project.launchLabel}</p>
          <p className="text-[11px] text-[hsl(var(--foreground-dim))] mt-1">{formatDate(project.launchDate)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div
            className="text-3xl font-semibold font-[family-name:var(--font-heading)] leading-none"
            style={{ color: project.color }}
          >
            {isPast ? `+${-days}` : days}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mt-1">
            {isPast ? 'days since' : days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : 'days to go'}
          </div>
        </div>
      </div>
      {isImminent && !isPast && (
        <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] flex items-center gap-1.5 text-[11px] text-amber-300">
          <AlertCircle size={11} />
          Imminent — focus all open tasks here
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, color }: { task: ThisWeekTask; color: string }) {
  const due = dueLabel(task.due);
  return (
    <li className="flex items-start gap-3 py-2.5 border-b border-[hsl(var(--border))] last:border-0">
      <span className="mt-1 flex-shrink-0">
        {task.done ? (
          <CheckCircle2 size={14} className="text-emerald-400" />
        ) : (
          <span
            className="w-3.5 h-3.5 rounded-full border-2 inline-block"
            style={{ borderColor: color }}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${task.done ? 'line-through text-[hsl(var(--foreground-dim))]' : 'text-[hsl(var(--foreground))]'}`}
        >
          {task.title}
        </p>
      </div>
      {due.text && (
        <span
          className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border ${TONE_CLASSES[due.tone]}`}
        >
          {due.text}
        </span>
      )}
    </li>
  );
}

function ProjectColumn({ project }: { project: ProjectDef }) {
  const tasks = project.thisWeek ?? [];
  const openCount = tasks.filter((t) => !t.done).length;
  return (
    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg overflow-hidden">
      <div
        className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between"
        style={{ borderTopColor: project.color, borderTop: `3px solid ${project.color}` }}
      >
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
            {project.name}
          </h3>
          <p className="text-[10px] text-[hsl(var(--foreground-dim))]">{project.description}</p>
        </div>
        <span className="text-[10px] text-[hsl(var(--foreground-dim))] uppercase tracking-wider">
          {openCount} open
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="p-4 text-[11px] text-[hsl(var(--foreground-dim))] italic">No tasks for this week</div>
      ) : (
        <ul className="px-4 py-2">
          {tasks.map((t, i) => (
            <TaskRow key={i} task={t} color={project.color} />
          ))}
        </ul>
      )}

      {project.contentSources && project.contentSources.length > 0 && (
        <div className="px-4 py-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30">
          <p className="text-[9px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mb-1 flex items-center gap-1">
            <FileText size={9} /> Source of truth
          </p>
          {project.contentSources.map((src) => (
            <p key={src} className="text-[10px] text-[hsl(var(--foreground-dim))] font-mono truncate">
              {src}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ThisWeekPage() {
  const launches = PROJECTS.filter((p) => p.launchDate)
    .map((p) => ({ p, days: daysUntil(p.launchDate!) }))
    .filter(({ days }) => days >= -7 && days <= 30)
    .sort((a, b) => a.days - b.days);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Today's tasks across all projects
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayTasks = PROJECTS.flatMap((p) =>
    (p.thisWeek ?? []).filter((t) => t.due === todayIso && !t.done).map((t) => ({ project: p, task: t })),
  );

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
            This Week
          </h1>
          <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1 tracking-wider uppercase">
            {todayStr} · what to do today and next 7 days
          </p>
        </div>
        <Link href="/" className="text-xs text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]">
          ← back to dashboard
        </Link>
      </div>

      {/* Launch Countdown Row */}
      {launches.length > 0 && (
        <section>
          <h2 className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mb-3 flex items-center gap-1.5">
            <Rocket size={10} /> Upcoming launches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {launches.map(({ p }) => (
              <LaunchCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Today's Posts */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mb-3 flex items-center gap-1.5">
          <Calendar size={10} /> Today
        </h2>
        {todayTasks.length === 0 ? (
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5 text-sm text-[hsl(var(--foreground-dim))]">
            Nothing scheduled for today. Use the breathing room to get ahead on the week.
          </div>
        ) : (
          <ul className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg divide-y divide-[hsl(var(--border))]">
            {todayTasks.map(({ project, task }, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                <span className="text-[10px] text-[hsl(var(--foreground-dim))] uppercase tracking-wider w-32 flex-shrink-0">
                  {project.name}
                </span>
                <span className="text-sm text-[hsl(var(--foreground))] flex-1">{task.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Per-project columns */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mb-3 flex items-center gap-1.5">
          <Clock size={10} /> By project
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECTS.map((p) => (
            <ProjectColumn key={p.id} project={p} />
          ))}
        </div>
      </section>

      <p className="text-[10px] text-[hsl(var(--foreground-dim))] italic">
        Task data lives in <code>lib/projects.ts</code>, sourced from each project&apos;s marketing &amp; planning
        docs. Edit there to keep this page accurate. Future: auto-sync from{' '}
        <code>paydirect/marketing/content-calendar/</code> and{' '}
        <code>Affiliate_Flow/Platforms/MASTER_GANTT_TIMELINE.md</code>.
      </p>
    </div>
  );
}
