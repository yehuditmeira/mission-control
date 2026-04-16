'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ProjectSwitcher } from '@/components/project-switcher';
import { TaskForm } from '@/components/task-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Task } from '@/lib/types';
import { Plus, ChevronDown, ChevronRight, Trash2, Edit2, Check, Square, CheckSquare } from 'lucide-react';

const statusColors: Record<string, string> = {
  backlog: 'bg-neutral-100 text-neutral-500',
  todo: 'bg-red-50 text-red-600',
  in_progress: 'bg-amber-50 text-amber-600',
  done: 'bg-emerald-50 text-emerald-600',
};

const priorityColors: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-500',
  medium: 'bg-neutral-100 text-neutral-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
};

function TasksContent() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project') || 'all';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [newSubtask, setNewSubtask] = useState<{ taskId: number; title: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTasks = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('project_id', projectFilter);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/tasks?${params}`).then(r => r.json()).then(setTasks);
  }, [projectFilter, statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleExpanded = (id: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const updateTaskStatus = async (task: Task, newStatus: string) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const toggleSubtask = async (subtaskId: number, completed: boolean) => {
    await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    });
    fetchTasks();
  };

  const addSubtask = async (taskId: number, title: string) => {
    if (!title.trim()) return;
    await fetch('/api/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, title: title.trim() }),
    });
    setNewSubtask(null);
    fetchTasks();
  };

  const deleteSubtask = async (id: number) => {
    await fetch(`/api/subtasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const subtaskProgress = (task: Task) => {
    if (!task.subtasks?.length) return null;
    const done = task.subtasks.filter(s => s.completed).length;
    return { done, total: task.subtasks.length, pct: Math.round((done / task.subtasks.length) * 100) };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-600"
          >
            <option value="">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <ProjectSwitcher />
          <Button onClick={() => { setEditingTask(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No tasks yet</p>
          <p className="text-sm">Click &quot;Add Task&quot; to create your first one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const expanded = expandedTasks.has(task.id);
            const progress = subtaskProgress(task);

            return (
              <div key={task.id} className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                {/* Task row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Expand toggle */}
                  <button onClick={() => toggleExpanded(task.id)} className="text-neutral-400 hover:text-neutral-500">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Quick status toggle */}
                  <button
                    onClick={() => updateTaskStatus(task, task.status === 'done' ? 'todo' : 'done')}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    {task.status === 'done' ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5" />}
                  </button>

                  {/* Title & meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-neutral-400' : ''}`}>
                        {task.title}
                      </span>
                      {task.author === 'ai' && (
                        <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-500">AI</Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                    )}
                  </div>

                  {/* Progress bar */}
                  {progress && (
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 bg-pink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-500 rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress.done}/{progress.total}</span>
                    </div>
                  )}

                  {/* Project badge */}
                  {(task as Task & { project_name?: string; project_color?: string }).project_name && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (task as Task & { project_color?: string }).project_color }} />
                      <span className="text-xs text-muted-foreground">{(task as Task & { project_name?: string }).project_name}</span>
                    </div>
                  )}

                  {/* Status & Priority */}
                  <Badge className={`text-xs ${statusColors[task.status]}`}>{task.status.replace('_', ' ')}</Badge>
                  <Badge className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</Badge>

                  {/* Due date */}
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">{task.due_date}</span>
                  )}

                  {/* Actions */}
                  <button onClick={() => { setEditingTask(task); setFormOpen(true); }} className="text-neutral-400 hover:text-neutral-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="text-neutral-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtasks */}
                {expanded && (
                  <div className="border-t border-neutral-100 px-4 py-3 pl-14 space-y-2">
                    {task.subtasks?.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <button onClick={() => toggleSubtask(sub.id, !!sub.completed)} className="text-neutral-400 hover:text-neutral-600">
                          {sub.completed ? <Check className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                        </button>
                        <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-neutral-400' : ''}`}>{sub.title}</span>
                        <button onClick={() => deleteSubtask(sub.id)} className="text-neutral-300 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {newSubtask?.taskId === task.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          autoFocus
                          value={newSubtask.title}
                          onChange={e => setNewSubtask({ ...newSubtask, title: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') addSubtask(task.id, newSubtask.title);
                            if (e.key === 'Escape') setNewSubtask(null);
                          }}
                          placeholder="Subtask title..."
                          className="h-8 text-sm"
                        />
                        <Button size="sm" onClick={() => addSubtask(task.id, newSubtask.title)}>Add</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewSubtask({ taskId: task.id, title: '' })}
                        className="text-sm text-neutral-600 hover:text-neutral-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add subtask
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTask(null); }}
        onSaved={fetchTasks}
        task={editingTask}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TasksContent />
    </Suspense>
  );
}
