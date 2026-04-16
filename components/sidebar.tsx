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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workspace', label: 'Workspace', icon: PanelsLeftRight },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/kanban', label: 'Kanban', icon: Columns3 },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/gantt', label: 'Timeline', icon: GanttChart },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/cron', label: 'Cron Jobs', icon: Clock },
  { href: '/memory', label: 'Memory', icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen bg-neutral-50 flex flex-col fixed left-0 top-0 border-r border-neutral-200/80">
      {/* Logo */}
      <div className="px-4 py-4">
        <h1 className="text-sm font-semibold text-neutral-800 tracking-tight">
          Mission Control
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5">
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
    </aside>
  );
}
