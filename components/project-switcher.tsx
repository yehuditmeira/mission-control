'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Project } from '@/lib/types';

function ProjectSwitcherInner() {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProject = searchParams.get('project') || 'all';

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then(setProjects);
  }, []);

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('project');
    } else {
      params.set('project', value);
    }
    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ''}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Project:</label>
      <select
        value={currentProject}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-300"
      >
        <option value="all">All Projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id.toString()}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProjectSwitcher() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
      <ProjectSwitcherInner />
    </Suspense>
  );
}
