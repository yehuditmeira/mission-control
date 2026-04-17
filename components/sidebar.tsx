'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Columns3,
  StickyNote,
  GanttChart,
  Calendar,
  Clock,
  Brain,
  PanelsLeftRight,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTabs } from './project-tabs';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workspace', label: 'Workspace', icon: PanelsLeftRight },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/cron', label: 'Cron Jobs', icon: Clock },
  { href: '/memory', label: 'Memory', icon: Brain },
];

// Pages that show project tabs in sidebar
const projectSpecificPages = ['/kanban', '/gantt'];

export function Sidebar() {
  const pathname = usePathname();

  const isProjectView = projectSpecificPages.some(page => pathname.startsWith(page));

  return (
    <aside className="w-60 h-screen bg-neutral-50 flex flex-col fixed left-0 top-0 border-r border-neutral-200/80">
      {/* Logo */}
      <div className="px-4 py-4">
        <h1 className="text-sm font-semibold text-neutral-800 tracking-tight">
          Mission Control
        </h1>
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
                  ? 'bg-neutral-200/70 text-neutral-900 font-medium'
                  : 'text-neutral-500 hover:bg-neutral-200/40 hover:text-neutral-700'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive ? 'text-neutral-700' : 'text-neutral-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Project Tabs Section - only for Kanban/Gantt */}
      {isProjectView && (
        <>
          <div className="mt-6 px-4 mb-2">
            <h2 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              {pathname.startsWith('/kanban') ? 'Kanban Board' : pathname.startsWith('/gantt') ? 'Timeline' : 'Project'}
            </h2>
          </div>
          <div className="px-2">
            <ProjectTabs />
          </div>
        </>
      )}

      {/* Secondary Navigation */}
      <div className="mt-auto px-2 pb-4">
        {!isProjectView && (
          <>
            <div className="px-4 mb-2">
              <h2 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Views
              </h2>
            </div>
            <div className="space-y-0.5 mb-4">
              <Link
                href="/kanban"
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  pathname === '/kanban'
                    ? 'bg-neutral-200/70 text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:bg-neutral-200/40 hover:text-neutral-700'
                )}
              >
                <Columns3 className={cn('w-4 h-4', pathname === '/kanban' ? 'text-neutral-700' : 'text-neutral-400')} />
                Kanban
              </Link>
              <Link
                href="/gantt"
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  pathname === '/gantt'
                    ? 'bg-neutral-200/70 text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:bg-neutral-200/40 hover:text-neutral-700'
                )}
              >
                <GanttChart className={cn('w-4 h-4', pathname === '/gantt' ? 'text-neutral-700' : 'text-neutral-400')} />
                Timeline
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
