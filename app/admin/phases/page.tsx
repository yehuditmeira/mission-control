'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Project, ProjectPhase } from '@/lib/types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

function flatten(projects: any[], depth = 0): { id: number; name: string; depth: number; archived: boolean }[] {
  const out: { id: number; name: string; depth: number; archived: boolean }[] = [];
  for (const p of projects) {
    out.push({ id: p.id, name: p.name, depth, archived: !!p.archived_at });
    if (p.children?.length) out.push(...flatten(p.children, depth + 1));
  }
  return out;
}

function PhaseManagerInner() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project_id') || '';

  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const [projectsFlat, setProjectsFlat] = useState<{ id: number; name: string; depth: number; archived: boolean }[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [newName, setNewName] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const loadProjects = useCallback(async () => {
    const res = await fetch('/api/projects?tree=1&include_archived=1');
    setProjectsFlat(flatten(await res.json()));
  }, []);

  const loadPhases = useCallback(async () => {
    if (!projectId) { setPhases([]); return; }
    const res = await fetch(`/api/phases?project_id=${projectId}&include_archived=1`);
    setPhases(await res.json());
  }, [projectId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => { loadPhases(); }, [loadPhases]);

  const addPhase = async () => {
    if (!projectId || !newName.trim()) return;
    await fetch('/api/phases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: Number(projectId), name: newName.trim() }),
    });
    setNewName('');
    loadPhases();
  };

  const renamePhase = async (id: number) => {
    if (!editingName.trim()) { setEditingId(null); return; }
    await fetch(`/api/phases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    setEditingId(null);
    setEditingName('');
    loadPhases();
  };

  const archivePhase = async (id: number, archived: boolean) => {
    await fetch(`/api/phases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !archived }),
    });
    loadPhases();
  };

  const movePhase = async (id: number, direction: -1 | 1) => {
    const idx = phases.findIndex(p => p.id === id);
    const swap = phases[idx + direction];
    if (!swap) return;
    await Promise.all([
      fetch(`/api/phases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: swap.sort_order }),
      }),
      fetch(`/api/phases/${swap.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: phases[idx].sort_order }),
      }),
    ]);
    loadPhases();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href={projectId ? `/kanban?project=${projectId}&view=phases` : '/kanban'} className="text-sm text-neutral-500 hover:text-neutral-700 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Kanban
        </a>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Manage Phases</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-1">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-200 rounded-md bg-white"
        >
          <option value="">Pick a project…</option>
          {projectsFlat.map(p => (
            <option key={p.id} value={p.id.toString()}>
              {`${'\u00A0\u00A0'.repeat(p.depth)}${p.depth > 0 ? '↳ ' : ''}${p.name}${p.archived ? ' (archived)' : ''}`}
            </option>
          ))}
        </select>
      </div>

      {projectId && (
        <>
          <div className="bg-white border border-neutral-200 rounded-md mb-6">
            {phases.length === 0 ? (
              <div className="px-4 py-6 text-sm text-neutral-500 text-center">No phases yet. Add the first one below.</div>
            ) : (
              <ul>
                {phases.map((p, idx) => (
                  <li key={p.id} className={`flex items-center gap-2 px-4 py-2 border-b border-neutral-100 last:border-0 ${p.archived_at ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col">
                      <button onClick={() => movePhase(p.id, -1)} disabled={idx === 0} className="text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-20">▲</button>
                      <button onClick={() => movePhase(p.id, 1)} disabled={idx === phases.length - 1} className="text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-20">▼</button>
                    </div>
                    {editingId === p.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => renamePhase(p.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') renamePhase(p.id); if (e.key === 'Escape') { setEditingId(null); setEditingName(''); } }}
                        className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded"
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingId(p.id); setEditingName(p.name); }}
                        className="flex-1 text-left text-sm text-neutral-800 hover:text-neutral-900"
                      >
                        {p.name}
                        {p.archived_at && <span className="ml-2 text-xs text-neutral-400">(archived)</span>}
                      </button>
                    )}
                    <button
                      onClick={() => archivePhase(p.id, !!p.archived_at)}
                      className="text-xs text-neutral-500 hover:text-neutral-800"
                      title={p.archived_at ? 'Restore' : 'Archive'}
                    >
                      {p.archived_at ? 'Restore' : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addPhase(); }}
              placeholder="New phase name…"
              className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-md"
            />
            <button
              onClick={addPhase}
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PhaseManagerPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PhaseManagerInner />
    </Suspense>
  );
}
