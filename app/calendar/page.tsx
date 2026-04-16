'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProjectSwitcher } from '@/components/project-switcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Project } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarItem {
  id: string;
  title: string;
  type: 'task' | 'event' | 'cron';
  color: string;
  date: string;
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project') || 'all';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addProjectId, setAddProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { fetch('/api/projects').then(r => r.json()).then(setProjects); }, []);

  const fetchItems = useCallback(async () => {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const params = new URLSearchParams({ start, end });
    if (projectFilter !== 'all') params.set('project_id', projectFilter);

    // Fetch tasks and events in parallel
    const [tasksRes, eventsRes] = await Promise.all([
      fetch(`/api/tasks?${projectFilter !== 'all' ? `project_id=${projectFilter}` : ''}`),
      fetch(`/api/events?${params}`),
    ]);
    const tasks = await tasksRes.json();
    const events = await eventsRes.json();

    const calItems: CalendarItem[] = [];

    // Tasks with due dates
    for (const t of tasks) {
      if (t.due_date) {
        calItems.push({
          id: `task-${t.id}`,
          title: t.title,
          type: 'task',
          color: t.project_color || '#EC4899',
          date: t.due_date,
        });
      }
    }

    // Events
    for (const e of events) {
      calItems.push({
        id: `event-${e.id}`,
        title: e.title,
        type: 'event',
        color: e.color || e.project_color || '#A855F7',
        date: e.start_datetime.split('T')[0],
      });
    }

    setItems(calItems);
  }, [year, month, projectFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getItemsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return items.filter(item => item.date === dateStr);
  };

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  const openAddEvent = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAddDate(dateStr);
    setAddTitle('');
    setAddProjectId('');
    setAddOpen(true);
  };

  const addEvent = async () => {
    if (!addTitle.trim()) return;
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: addTitle.trim(),
        start_datetime: addDate,
        all_day: true,
        project_id: addProjectId ? parseInt(addProjectId) : null,
      }),
    });
    setAddOpen(false);
    fetchItems();
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Calendar</h1>
        <ProjectSwitcher />
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
        <h2 className="text-lg font-semibold min-w-[200px] text-center">{monthName}</h2>
        <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="outline" size="sm" onClick={today}>Today</Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-neutral-100">
          {dayNames.map(d => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center bg-neutral-50">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-neutral-100 last:border-b-0">
            {week.map((day, di) => (
              <div
                key={di}
                className={`min-h-[100px] border-r border-neutral-100 last:border-r-0 p-1.5 ${
                  day ? 'cursor-pointer hover:bg-neutral-50/50' : 'bg-gray-50/50'
                }`}
                onClick={() => day && openAddEvent(day)}
              >
                {day && (
                  <>
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday(day) ? 'bg-neutral-500 text-white' : 'text-neutral-500'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {getItemsForDay(day).slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          className="text-[10px] px-1.5 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: item.color }}
                          title={`${item.type}: ${item.title}`}
                        >
                          {item.type === 'task' ? '✓ ' : item.type === 'cron' ? '⏰ ' : ''}{item.title}
                        </div>
                      ))}
                      {getItemsForDay(day).length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{getItemsForDay(day).length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-500" /> Tasks</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-500" /> Events</span>
      </div>

      {/* Add event dialog */}
      <Dialog open={addOpen} onOpenChange={o => !o && setAddOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Event — {addDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={addTitle}
                onChange={e => setAddTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEvent()}
                placeholder="Event title..."
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label>Project</Label>
              <select value={addProjectId} onChange={e => setAddProjectId(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">None</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addEvent} disabled={!addTitle.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
