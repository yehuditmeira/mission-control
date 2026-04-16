'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { ProjectSwitcher } from '@/components/project-switcher';
import { Task } from '@/lib/types';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', dotColor: '#787774' },
  { id: 'todo', label: 'To-do', dotColor: '#d44c47' },
  { id: 'in_progress', label: 'In progress', dotColor: '#cb912f' },
  { id: 'done', label: 'Complete', dotColor: '#448361' },
];

type TaskWithProject = Task & { project_name?: string; project_color?: string };

function TaskCard({ task, isDragging }: { task: TaskWithProject; isDragging?: boolean }) {
  return (
    <div className={`bg-white rounded-md border border-neutral-200 px-3 py-2.5 hover:bg-neutral-50 transition-colors ${isDragging ? 'opacity-50 shadow-lg' : ''}`}>
      <span className="text-sm text-neutral-800">{task.title}</span>
      {task.project_name && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: task.project_color }} />
          <span className="text-[11px] text-neutral-400">{task.project_name}</span>
        </div>
      )}
    </div>
  );
}

function SortableCard({ task }: { task: TaskWithProject }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

function Column({ id, label, dotColor, tasks }: { id: string; label: string; dotColor: string; tasks: TaskWithProject[] }) {
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
            {tasks.map(task => (
              <SortableCard key={task.id} task={task} />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

function KanbanContent() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project') || 'all';
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [activeTask, setActiveTask] = useState<TaskWithProject | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchTasks = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('project_id', projectFilter);
    fetch(`/api/tasks?${params}`).then(r => r.json()).then(setTasks);
  }, [projectFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const findColumn = (id: string | number): string | null => {
    const task = tasks.find(t => t.id === id);
    if (task) return task.status;
    if (COLUMNS.some(c => c.id === id)) return id as string;
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
    let overCol = findColumn(over.id);

    if (COLUMNS.some(c => c.id === over.id)) {
      overCol = over.id as string;
    }

    if (!activeCol || !overCol || activeCol === overCol) return;

    setTasks(prev => prev.map(t =>
      t.id === active.id ? { ...t, status: overCol as Task['status'] } : t
    ));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    let targetCol = findColumn(over.id);
    if (COLUMNS.some(c => c.id === over.id)) {
      targetCol = over.id as string;
    }

    if (!targetCol) return;

    const columnTasks = tasks.filter(t => t.status === targetCol);
    const updates = columnTasks.map((t, i) => ({
      id: t.id,
      status: targetCol as string,
      sort_order: i,
    }));

    const movedTask = tasks.find(t => t.id === active.id);
    if (movedTask && movedTask.status !== targetCol) {
      const idx = updates.findIndex(u => u.id === active.id);
      if (idx === -1) {
        updates.push({ id: active.id as number, status: targetCol, sort_order: updates.length });
      }
    }

    await fetch('/api/tasks/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });

    fetchTasks();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Kanban Board</h1>
        <ProjectSwitcher />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              dotColor={col.dotColor}
              tasks={getTasksByStatus(col.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
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
