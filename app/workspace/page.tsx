'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProjectSwitcher } from '@/components/project-switcher';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Task, Note } from '@/lib/types';
import {
  Pin, Trash2, StickyNote, Square, CheckSquare,
  ChevronDown, ChevronRight, ArrowRightLeft,
} from 'lucide-react';

type NoteWithProject = Note & { project_name?: string; project_color?: string };

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

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectFilter = searchParams.get('project') || 'all';

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  // Notes state
  const [notes, setNotes] = useState<NoteWithProject[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  const fetchTasks = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('project_id', projectFilter);
    fetch(`/api/tasks?${params}`).then(r => r.json()).then(setTasks);
  }, [projectFilter]);

  const fetchNotes = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('project_id', projectFilter);
    fetch(`/api/notes?${params}`).then(r => r.json()).then(setNotes);
  }, [projectFilter]);

  useEffect(() => { fetchTasks(); fetchNotes(); }, [fetchTasks, fetchNotes]);

  // Task actions
  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle.trim() }),
    });
    setNewTaskTitle('');
    fetchTasks();
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

  const toggleExpanded = (id: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Note actions
  const createNote = async () => {
    if (!newNoteTitle.trim()) return;
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newNoteTitle.trim() }),
    });
    setNewNoteTitle('');
    fetchNotes();
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    fetchNotes();
  };

  const togglePin = async (note: NoteWithProject) => {
    await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    fetchNotes();
  };

  const convertNoteToTask = async (note: NoteWithProject) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: note.title,
        description: note.content || null,
        project_id: note.project_id,
      }),
    });
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
        <h1 className="text-2xl font-bold text-neutral-900">Workspace</h1>
        <ProjectSwitcher />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Tasks */}
        <div className="min-h-0">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Tasks</h2>
          <Input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createTask()}
            placeholder="Type a task and press Enter..."
            className="mb-4"
          />

          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
              {tasks.map(task => {
                const expanded = expandedTasks.has(task.id);
                const progress = subtaskProgress(task);
                return (
                  <div key={task.id} className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                    <div className="flex items-center gap-2 p-3">
                      <button onClick={() => toggleExpanded(task.id)} className="text-neutral-400 hover:text-neutral-500">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task, task.status === 'done' ? 'todo' : 'done')}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        {task.status === 'done' ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className={`flex-1 text-sm truncate ${task.status === 'done' ? 'line-through text-neutral-400' : 'font-medium'}`}>
                        {task.title}
                      </span>
                      {progress && (
                        <span className="text-xs text-muted-foreground">{progress.done}/{progress.total}</span>
                      )}
                      <Badge className={`text-[10px] ${statusColors[task.status]}`}>{task.status.replace('_', ' ')}</Badge>
                      <Badge className={`text-[10px] ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                      <button onClick={() => deleteTask(task.id)} className="text-neutral-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {expanded && task.subtasks && task.subtasks.length > 0 && (
                      <div className="border-t border-neutral-100 px-3 py-2 pl-10 space-y-1">
                        {task.subtasks.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 text-sm">
                            {sub.completed ? <CheckSquare className="w-3.5 h-3.5 text-green-500" /> : <Square className="w-3.5 h-3.5 text-neutral-400" />}
                            <span className={sub.completed ? 'line-through text-neutral-400' : ''}>{sub.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Notes */}
        <div className="min-h-0">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Notes</h2>
          <Input
            value={newNoteTitle}
            onChange={e => setNewNoteTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createNote()}
            placeholder="Type a note and press Enter..."
            className="mb-4"
          />

          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No notes yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="font-medium text-sm truncate flex-1 cursor-pointer hover:text-neutral-600"
                        onClick={() => router.push(`/notes/${note.id}`)}
                      >
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => convertNoteToTask(note)}
                          className="p-1 rounded text-neutral-400 hover:text-blue-500"
                          title="Convert to task"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => togglePin(note)}
                          className={`p-1 rounded ${note.pinned ? 'text-neutral-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {note.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content.slice(0, 150)}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {note.project_name && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: note.project_color }} />
                          <span className="text-[10px] text-muted-foreground">{note.project_name}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
