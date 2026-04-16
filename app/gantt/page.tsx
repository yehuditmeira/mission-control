'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProjectSwitcher } from '@/components/project-switcher';
import { Button } from '@/components/ui/button';
import { Task } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type TaskWithProject = Task & { project_name?: string; project_color?: string };

function GanttContent() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project') || 'all';
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Start of current week
    return d;
  });

  const DAYS = 28; // 4 weeks visible

  const fetchTasks = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('project_id', projectFilter);
    fetch(`/api/tasks?${params}`)
      .then(r => r.json())
      .then((all: TaskWithProject[]) => {
        // Only show tasks that have at least a start_date or due_date
        setTasks(all.filter(t => t.start_date || t.due_date));
      });
  }, [projectFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const dates: Date[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  const prevWeek = () => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); };
  const nextWeek = () => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); };
  const goToday = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); setStartDate(d); };

  const getBarPosition = (task: TaskWithProject) => {
    const taskStart = task.start_date || task.due_date!;
    const taskEnd = task.due_date || task.start_date!;

    const rangeStart = dates[0].getTime();
    const rangeEnd = dates[DAYS - 1].getTime();
    const msPerDay = 86400000;

    const barStart = Math.max(new Date(taskStart).getTime(), rangeStart);
    const barEnd = Math.min(new Date(taskEnd).getTime() + msPerDay, rangeEnd + msPerDay);

    if (barStart > rangeEnd + msPerDay || barEnd < rangeStart) return null;

    const left = ((barStart - rangeStart) / (rangeEnd - rangeStart + msPerDay)) * 100;
    const width = ((barEnd - barStart) / (rangeEnd - rangeStart + msPerDay)) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - Math.max(0, left), Math.max(width, 2))}%` };
  };

  const todayStr = toDateStr(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Timeline</h1>
        <ProjectSwitcher />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-sm font-medium min-w-[250px] text-center">
          {dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {dates[DAYS - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No tasks with dates</p>
          <p className="text-sm">Add start/due dates to your tasks to see them here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {/* Date headers */}
          <div className="flex border-b border-neutral-100">
            <div className="w-48 shrink-0 px-3 py-2 bg-neutral-50 border-r border-neutral-100">
              <span className="text-xs font-medium text-muted-foreground">Task</span>
            </div>
            <div className="flex-1 flex">
              {dates.map((d, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center py-1 border-r border-neutral-100 last:border-r-0 ${
                    toDateStr(d) === todayStr ? 'bg-neutral-100' : d.getDay() === 0 || d.getDay() === 6 ? 'bg-neutral-50' : ''
                  }`}
                >
                  <div className="text-[9px] text-muted-foreground">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`text-[10px] font-medium ${toDateStr(d) === todayStr ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    {d.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {tasks.map(task => {
            const pos = getBarPosition(task);
            return (
              <div key={task.id} className="flex border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/30">
                <div className="w-48 shrink-0 px-3 py-3 border-r border-neutral-100 flex items-center gap-2">
                  {task.project_color && (
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.project_color }} />
                  )}
                  <span className="text-xs font-medium truncate">{task.title}</span>
                </div>
                <div className="flex-1 relative py-2 px-1">
                  {pos && (
                    <div
                      className="absolute top-2 h-6 rounded-md flex items-center px-2 text-[10px] text-white font-medium truncate"
                      style={{
                        left: pos.left,
                        width: pos.width,
                        backgroundColor: task.project_color || '#A855F7',
                      }}
                      title={`${task.start_date || ''} → ${task.due_date || ''}`}
                    >
                      {task.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GanttPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GanttContent />
    </Suspense>
  );
}
