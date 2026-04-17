'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Project } from '@/lib/types';
import { Filter } from 'lucide-react';

export function ProjectSwitcher() {
  return (
    <Suspense fallback={<div className="h-9" />}>
      <ProjectSwitcherInner />
    </Suspense>
  );
}

function ProjectSwitcherInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string>('all');

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      });
  }, []);

  useEffect(() => {
    const projectParam = searchParams.get('project');
    setSelected(projectParam || 'all');
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (projectId === 'all') {
      params.delete('project');
    } else {
      params.set('project', projectId);
    }
    router.push(`${pathname}?${params}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-neutral-400" />
      <select
        value={selected}
        onChange={handleChange}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="all">All Projects</option>
        {projects.map(p => (
          <option key={p.id} value={p.id.toString()}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
