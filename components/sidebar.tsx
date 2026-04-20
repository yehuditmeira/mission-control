'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  CheckSquare,
  Columns3,
  StickyNote,
  GanttChart,
  Calendar,
  Clock,
  Brain,
  Rocket,
  Activity,
  Inbox,
  Target,
  Library,
  PanelsLeftRight,
  ChevronDown,
  ChevronRight,
  Bot,
  Network,
  Building2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROJECTS } from '@/lib/projects';
import { ProjectTabs } from './project-tabs';

const navItems = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/this-week', label: 'This Week', icon: Rocket },
  { href: '/milestones', label: 'Milestones', icon: Target },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/workspace', label: 'Workspace', icon: PanelsLeftRight },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/cron', label: 'Cron Jobs', icon: Clock },
  { href: '/operations', label: 'Operations', icon: Activity },
  { href: '/leads', label: 'Lead Digests', icon: Inbox },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/org', label: 'Organization', icon: Network },
  { href: '/office', label: 'Agent Office', icon: Building2 },
  { href: '/docs', label: 'Docs', icon: FileText },
];

// Pages that show project tabs in sidebar
const projectSpecificPages = ['/kanban', '/gantt'];

// Static mock agent data — structured for live data later
const agentsByProject: Record<string, { name: string; status: 'working' | 'idle' | 'blocked'; task: string }[]> = {
  'affiliate-flow': [
    { name: 'Pin Generator', status: 'working', task: 'Creating daily pins' },
    { name: 'SEO Writer', status: 'idle', task: '' },
  ],
  'lead-hunter': [
    { name: 'Lead Scraper', status: 'idle', task: '' },
    { name: 'Outreach Bot', status: 'blocked', task: 'Waiting for API key' },
  ],
  'paydirect': [],
  'personal-assistant': [
    { name: 'Scheduler', status: 'working', task: 'Processing calendar' },
  ],
};

const statusIndicator = {
  working: 'bg-emerald-400 animate-pulse',
  idle: 'bg-[hsl(var(--foreground-dim))]',
  blocked: 'bg-red-400',
};

export function Sidebar() {
  const pathname = usePathname();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['affiliate-flow']));

  const isProjectView = projectSpecificPages.some(page => pathname.startsWith(page));

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="w-60 h-screen bg-[hsl(var(--background-2))] flex flex-col fixed left-0 top-0 border-r border-[hsl(var(--border))]">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[hsl(var(--border))]">
        <h1 className="text-sm font-semibold text-[hsl(var(--primary))] tracking-tight font-[family-name:var(--font-heading)]">
          Mission Control
        </h1>
        <p className="text-[10px] text-[hsl(var(--foreground-dim))] mt-0.5 tracking-wider uppercase">Command Center</p>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-medium'
                  : 'text-[hsl(var(--foreground-dim))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--foreground-dim))]')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Project Tabs Section - only for Kanban/Gantt */}
      {isProjectView && (
        <>
          <div className="mt-6 px-4 mb-2">
            <h2 className="text-[10px] font-semibold text-[hsl(var(--foreground-dim))] uppercase tracking-wider">
              {pathname.startsWith('/kanban') ? 'Kanban Board' : pathname.startsWith('/gantt') ? 'Timeline' : 'Project'}
            </h2>
          </div>
          <div className="px-2">
            <ProjectTabs />
          </div>
        </>
      )}

      {/* Agent Activity */}
      <div className="mt-6 flex-1 overflow-y-auto px-2">
        <div className="px-2 mb-2">
          <h2 className="text-[10px] font-semibold text-[hsl(var(--foreground-dim))] uppercase tracking-wider flex items-center gap-1.5">
            <Bot size={10} />
            Agent Activity
          </h2>
        </div>

        <div className="space-y-0.5">
          {PROJECTS.map((project) => {
            const agents = agentsByProject[project.id] ?? [];
            const isExpanded = expandedProjects.has(project.id);
            const activeCount = agents.filter(a => a.status === 'working').length;

            return (
              <div key={project.id}>
                <button
                  onClick={() => toggleProject(project.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[hsl(var(--foreground-dim))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-left truncate">{project.name}</span>
                  {activeCount > 0 && (
                    <span className="text-[10px] text-emerald-400">{activeCount}</span>
                  )}
                </button>

                {isExpanded && agents.length > 0 && (
                  <div className="ml-5 pl-2 border-l border-[hsl(var(--border))] space-y-0.5 mt-0.5 mb-1">
                    {agents.map((agent) => (
                      <div
                        key={agent.name}
                        className="flex items-start gap-2 px-2 py-1 rounded text-[11px]"
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0', statusIndicator[agent.status])} />
                        <div className="min-w-0">
                          <div className="text-[hsl(var(--foreground))] truncate">{agent.name}</div>
                          {agent.task && (
                            <div className="text-[hsl(var(--foreground-dim))] truncate">{agent.task}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && agents.length === 0 && (
                  <div className="ml-5 pl-2 border-l border-[hsl(var(--border))] mt-0.5 mb-1">
                    <div className="px-2 py-1 text-[10px] text-[hsl(var(--foreground-dim))]">No agents</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Views */}
      <div className="px-2 pb-4">
        {!isProjectView && (
          <>
            <div className="px-4 mb-2">
              <h2 className="text-[10px] font-semibold text-[hsl(var(--foreground-dim))] uppercase tracking-wider">
                Views
              </h2>
            </div>
            <div className="space-y-0.5 mb-4">
              <Link
                href="/kanban"
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  pathname === '/kanban'
                    ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-medium'
                    : 'text-[hsl(var(--foreground-dim))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <Columns3 className={cn('w-4 h-4', pathname === '/kanban' ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--foreground-dim))]')} />
                Kanban
              </Link>
              <Link
                href="/gantt"
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  pathname === '/gantt'
                    ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-medium'
                    : 'text-[hsl(var(--foreground-dim))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <GanttChart className={cn('w-4 h-4', pathname === '/gantt' ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--foreground-dim))]')} />
                Timeline
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
