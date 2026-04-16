'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CronJob, Project } from '@/lib/types';
import { Plus, Clock, Zap } from 'lucide-react';

type CronWithProject = CronJob & { project_name?: string; project_color?: string };

export default function CronPage() {
  const [jobs, setJobs] = useState<CronWithProject[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [command, setCommand] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchJobs = () => { fetch('/api/cron-jobs').then(r => r.json()).then(setJobs); };

  useEffect(() => {
    fetchJobs();
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);

  const addJob = async () => {
    if (!label.trim() || !schedule.trim()) return;
    await fetch('/api/cron-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: label.trim(),
        description: description.trim() || null,
        schedule: schedule.trim(),
        command: command.trim() || null,
        project_id: projectId ? parseInt(projectId) : null,
        source: 'manual',
      }),
    });
    setAddOpen(false);
    setLabel(''); setDescription(''); setSchedule(''); setCommand(''); setProjectId('');
    fetchJobs();
  };

  const sourceColors: Record<string, string> = {
    launchd: 'bg-neutral-100 text-neutral-600',
    apscheduler: 'bg-amber-50 text-amber-600',
    manual: 'bg-red-50 text-red-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Cron Jobs</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p className="text-lg mb-2">No cron jobs tracked</p>
          <p className="text-sm">Add your scheduled jobs to see them here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Label</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Schedule</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Project</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-sm font-medium">{job.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-neutral-100 px-2 py-1 rounded">{job.schedule}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{job.description || '—'}</td>
                  <td className="px-4 py-3">
                    {job.project_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: job.project_color }} />
                        <span className="text-xs">{job.project_name}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${sourceColors[job.source] || ''}`}>{job.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${job.active ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {job.active ? 'active' : 'inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={o => !o && setAddOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Cron Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Label</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. com.morning-brief" className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Schedule</Label>
              <Input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. Every 3 hours" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this job do?" className="mt-1" />
            </div>
            <div>
              <Label>Command</Label>
              <Input value={command} onChange={e => setCommand(e.target.value)} placeholder="e.g. python run_monitor.py" className="mt-1" />
            </div>
            <div>
              <Label>Project</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">None</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addJob} disabled={!label.trim() || !schedule.trim()}>Add Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
