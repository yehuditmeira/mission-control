'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/types';
import { LayoutGrid, Pin, Target, User } from 'lucide-react';

interface ProjectTabsProps {
  showAll?: boolean;
}

const PROJECT_ICONS: Record<string, React.ReactNode> = {
  'all': <LayoutGrid className="w-3.5 h-3.5" />,
  'personal': <User className="w-3.5 h-3.5" />,
  'merchant-lead-hunter': <Target className="w-3.5 h-3.5" />,
  'mrkt-drop': <Pin className="w-3.5 h-3.5" />,
};

export function ProjectTabs(props: ProjectTabsProps) {
  return (
    <Suspense fallback={<div className="px-2.5 py-1.5 text-sm text-neutral-400">Loading...</div>}>
      <ProjectTabsInner {...props} />
    </Suspense>
  );
}

function ProjectTabsInner({ showAll = true }: ProjectTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        // Sort by sort_order
        const sorted = data.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setProjects(sorted);
      });
  }, []);

  const currentProject = searchParams.get('project') || 'all';

  const getIcon = (slug: string) => PROJECT_ICONS[slug] || <LayoutGrid className="w-3.5 h-3.5" />;

  const buildUrl = (projectId: string) => {
    const params = new URLSearchParams(searchParams);
    if (projectId === 'all') {
      params.delete('project');
    } else {
      params.set('project', projectId);
    }
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-1">
      {/* All Projects tab */}
      {showAll && (
        <Link
          href={buildUrl('all')}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors',
            currentProject === 'all'
              ? 'bg-neutral-200/70 text-neutral-900 font-medium'
              : 'text-neutral-500 hover:bg-neutral-200/40 hover:text-neutral-700'
          )}
        >
          <LayoutGrid className={cn('w-4 h-4', currentProject === 'all' ? 'text-neutral-700' : 'text-neutral-400')} />
          <span className="truncate">All Projects</span>
        </Link>
      )}

      {/* Project tabs */}
      {projects.map((project) => {
        const isActive = currentProject === project.id.toString();
        const icon = getIcon(project.slug || '');
        
        return (
          <Link
            key={project.id}
            href={buildUrl(project.id.toString())}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors group',
              isActive
                ? 'bg-neutral-200/70 text-neutral-900 font-medium'
                : 'text-neutral-500 hover:bg-neutral-200/40 hover:text-neutral-700'
            )}
          >
            <div 
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
              )} 
              style={{ backgroundColor: project.color }} 
            />
            <span className="truncate">{project.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
