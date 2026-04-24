'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Task, Project, ProjectPhase } from '@/lib/types';
import { Columns3, Calendar, Settings2 } from 'lucide-react';

type ViewMode = 'workflow' | 'phases';

const WORKFLOW_COLUMNS = [
  { id: 'backlog', label: 'Backlog', dotColor: '#787774' },
  { id: 'todo', label: 'To-do', dotColor: '#d44c47' },
  { id: 'in_progress', label: 'In progress', dotColor: '#cb912f' },
  { id: 'done', label: 'Complete', dotColor: '#448361' },
];

type TaskRow = Task & { project_name?: string; project_color?: string; phase_name?: string };

function TaskCard({ task, isDragging }: { task: TaskRow; isDragging?: boolean }) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueIsToday = due && due >= today && due < new Date(today.getTime() + 86400000);
  const isOverdue = due && due < today && task.status !== 'done';

  return (
    <div className={`bg-white rounded-md border border-neutral-200 px-3 py-2.5 hover:bg-neutral-50 transition-colors ${isDragging ? 'opacity-50 shadow-lg' : ''}`}>
      <span className="text-sm text-neutral-800">{task.title}</span>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {task.project_name && (
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: task.project_color }} />
            <span className="text-[11px] text-neutral-400">{task.project_name}</span>
          </span>
        )}
        {dueIsToday && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">today</span>
        )}
        {isOverdue && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-medium">overdue</span>
        )}
        {(task.labels || []).map((l) => (
          <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">{l}</span>
        ))}
      </div>
    </div>
  );
}

function SortableCard({ task }: { task: TaskRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

function Column({ id, label, dotColor, tasks }: { id: string; label: string; dotColor: string; tasks: TaskRow[] }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div className="flex-1 min-w-[250px]">
      <div className="min-h-[500px]">
        <div className="flex items-center gap-2 px-1 pb-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
          <h3 className="text-sm font-medium text-neutral-700">{label}</h3>
          <span className="text-xs text-neutral-400 ml-1">{tasks.length}</span>
        </div>
        <div ref={setNodeRef} className="space-y-1.5 min-h-[200px]">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => <SortableCard key={task.id} task={task} />)}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

// Flatten the project tree into a render list with depth, so we can show
// indented sub-projects in the picker.
function flattenTree(projects: Project[], depth = 0): { project: Project; depth: number }[] {
  const out: { project: Project; depth: number }[] = [];
  for (const p of projects) {
    out.push({ project: p, depth });
    if (p.children?.length) out.push(...flattenTree(p.children, depth + 1));
  }
  return out;
}

function KanbanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const projectFilter = searchParams.get('project') || 'all';
  const viewMode: ViewMode = (searchParams.get('view') as ViewMode) || 'workflow';
  const todayOnly = searchParams.get('today') === '1';

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === null || value === '' || value === 'all' || value === 'workflow' || value === '0') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const fetchTasks = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('project_id', projectFilter);
    if (todayOnly) params.set('due_today', '1');
    fetch(`/api/tasks?${params}`).then(r => r.json()).then((data: TaskRow[]) => setTasks(data));
  }, [projectFilter, todayOnly]);

  const fetchProjects = useCallback(() => {
    fetch('/api/projects?tree=1').then(r => r.json()).then(setProjects);
  }, []);

  const fetchPhases = useCallback(() => {
    if (projectFilter === 'all') { setPhases([]); return; }
    fetch(`/api/phases?project_id=${projectFilter}`).then(r => r.json()).then(setPhases);
  }, [projectFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchPhases(); }, [fetchPhases]);

  const flatProjects = useMemo(() => flattenTree(projects), [projects]);
  const selectedProject = flatProjects.find(p => p.project.id.toString() === projectFilter)?.project;

  const findColumn = (id: string | number): string | null => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      return viewMode === 'phases'
        ? (task.phase_id != null ? `phase-${task.phase_id}` : 'phase-none')
        : task.status;
    }
    if (typeof id === 'string' && (id.startsWith('phase-') || WORKFLOW_COLUMNS.some(c => c.id === id))) {
      return id;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeCol = findColumn(active.id);
    const overCol = findColumn(over.id) ?? (typeof over.id === 'string' ? over.id : null);
    if (!activeCol || !overCol || activeCol === overCol) return;

    setTasks(prev => prev.map(t => {
      if (t.id !== active.id) return t;
      if (viewMode === 'phases') {
        const phaseId = overCol === 'phase-none' ? null : Number(overCol.replace('phase-', ''));
        return { ...t, phase_id: phaseId };
      }
      return { ...t, status: overCol as Task['status'] };
    }));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const targetCol = findColumn(over.id) ?? (typeof over.id === 'string' ? over.id : null);
    if (!targetCol) return;
    const moved = tasks.find(t => t.id === active.id);
    if (!moved) return;

    if (viewMode === 'phases') {
      const phaseId = targetCol === 'phase-none' ? null : Number(targetCol.replace('phase-', ''));
      await fetch(`/api/tasks/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase_id: phaseId }),
      });
    } else {
      // Workflow drag: persist new status + sort order via existing reorder endpoint.
      const columnTasks = tasks.filter(t => t.status === targetCol);
      const updates = columnTasks.map((t, i) => ({ id: t.id, status: targetCol, sort_order: i }));
      if (moved.status !== targetCol && !updates.some(u => u.id === active.id)) {
        updates.push({ id: active.id as number, status: targetCol, sort_order: updates.length });
      }
      await fetch('/api/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
    }
    fetchTasks();
  };

  const phaseColumns = useMemo(() => {
    const cols = phases.map(p => ({ id: `phase-${p.id}`, label: p.name, dotColor: '#6b7280' }));
    cols.push({ id: 'phase-none', label: 'No phase', dotColor: '#d4d4d4' });
    return cols;
  }, [phases]);

  const columns = viewMode === 'phases' ? phaseColumns : WORKFLOW_COLUMNS;

  const tasksForColumn = (colId: string): TaskRow[] => {
    if (viewMode === 'phases') {
      if (colId === 'phase-none') return tasks.filter(t => t.phase_id == null);
      const pid = Number(colId.replace('phase-', ''));
      return tasks.filter(t => t.phase_id === pid);
    }
    return tasks.filter(t => t.status === colId);
  };

  const phasesAvailable = viewMode === 'phases' && projectFilter !== 'all' && phases.length > 0;
  const phasesEmpty = viewMode === 'phases' && projectFilter !== 'all' && phases.length === 0;
  const phasesNoProject = viewMode === 'phases' && projectFilter === 'all';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Columns3 className="w-6 h-6 text-neutral-700" />
        <h1 className="text-2xl font-bold text-neutral-900">Kanban</h1>
        {selectedProject && (
          <span className="text-sm text-neutral-500">— {selectedProject.name}</span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Project picker */}
        <select
          value={projectFilter}
          onChange={(e) => setParam('project', e.target.value)}
          className="px-3 py-1.5 text-sm border border-neutral-200 rounded-md bg-white hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        >
          <option value="all">All projects</option>
          {flatProjects.map(({ project, depth }) => (
            <option key={project.id} value={project.id.toString()}>
              {`${'\u00A0\u00A0'.repeat(depth)}${depth > 0 ? '↳ ' : ''}${project.name}${project.archived_at ? ' (archived)' : ''}`}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="inline-flex border border-neutral-200 rounded-md overflow-hidden">
          <button
            onClick={() => setParam('view', 'workflow')}
            className={`px-3 py-1.5 text-sm ${viewMode === 'workflow' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
          >
            Workflow
          </button>
          <button
            onClick={() => setParam('view', 'phases')}
            className={`px-3 py-1.5 text-sm border-l border-neutral-200 ${viewMode === 'phases' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
          >
            Phases
          </button>
        </div>

        {/* Today pill */}
        <button
          onClick={() => setParam('today', todayOnly ? null : '1')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border ${todayOnly ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Today
        </button>

        {/* Manage phases (only when a project is selected) */}
        {projectFilter !== 'all' && (
          <a
            href={`/admin/phases?project_id=${projectFilter}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Manage phases
          </a>
        )}
      </div>

      {/* Empty/guidance states */}
      {phasesNoProject && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-900">
          Phases view needs a project. Pick one from the dropdown above to see its phase columns.
        </div>
      )}
      {phasesEmpty && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-md px-4 py-3 text-sm text-neutral-600">
          This project has no phases yet. <a href={`/admin/phases?project_id=${projectFilter}`} className="underline">Add phases →</a>
        </div>
      )}

      {/* Board */}
      {(viewMode === 'workflow' || phasesAvailable) && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map(col => (
              <Column key={col.id} id={col.id} label={col.label} dotColor={col.dotColor} tasks={tasksForColumn(col.id)} />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

export default function KanbanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KanbanContent />
    </Suspense>
  );
}
