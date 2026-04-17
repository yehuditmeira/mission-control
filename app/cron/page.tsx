'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CronJob, Project } from '@/lib/types';
import { PROJECTS } from '@/lib/projects';
import { Plus, Clock, Zap, AlertTriangle, X } from 'lucide-react';

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
  const [filterProject, setFilterProject] = useState<string>('all');
  const [errorLogJob, setErrorLogJob] = useState<CronWithProject | null>(null);

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

  const filteredJobs = filterProject === 'all'
    ? jobs
    : jobs.filter(j => j.project_name === filterProject);

  const sourceColors: Record<string, string> = {
    launchd: 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-dim))]',
    apscheduler: 'bg-amber-900/30 text-amber-400',
    manual: 'bg-red-900/30 text-red-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cron Jobs</h1>
        <Button onClick={() => setAddOpen(true)} className="bg-[hsl(var(--primary))] text-white hover:opacity-90">
          <Plus className="w-4 h-4 mr-1" /> Add Job
        </Button>
      </div>

      {/* Project Filter */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilterProject('all')}
          className={`px-3 py-1 rounded-md text-xs transition-colors ${
            filterProject === 'all'
              ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]'
              : 'text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          All
        </button>
        {PROJECTS.map(p => (
          <button
            key={p.id}
            onClick={() => setFilterProject(p.name)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
              filterProject === p.name
                ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]'
                : 'text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </button>
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-[hsl(var(--foreground-dim))]">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-2">No cron jobs tracked</p>
          <p className="text-sm">Add your scheduled jobs to see them here</p>
        </div>
      ) : (
        <div className="bg-[hsl(var(--background-2))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--foreground-dim))]">Label</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--foreground-dim))]">Schedule</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--foreground-dim))]">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--foreground-dim))]">Project</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--foreground-dim))]">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--foreground-dim))]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--foreground-dim))]">Errors</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id} className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--secondary))/30]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[hsl(var(--foreground-dim))]" />
                      <span className="text-sm font-medium">{job.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-[hsl(var(--secondary))] px-2 py-1 rounded">{job.schedule}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--foreground-dim))]">{job.description || '\u2014'}</td>
                  <td className="px-4 py-3">
                    {job.project_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: job.project_color }} />
                        <span className="text-xs">{job.project_name}</span>
                      </div>
                    ) : <span className="text-xs text-[hsl(var(--foreground-dim))]">\u2014</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${sourceColors[job.source] || ''}`}>{job.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${job.active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-dim))]'}`}>
                      {job.active ? 'active' : 'inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setErrorLogJob(job)}
                      className="text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))] transition-colors"
                      title="View error log"
                    >
                      <AlertTriangle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Error Log Viewer */}
      <Dialog open={!!errorLogJob} onOpenChange={(o) => !o && setErrorLogJob(null)}>
        <DialogContent className="max-w-lg bg-[hsl(var(--background-2))] border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Error Log: {errorLogJob?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-[hsl(var(--background))] rounded-md p-4 text-xs font-mono text-[hsl(var(--foreground-dim))] max-h-64 overflow-y-auto">
            <p className="opacity-50">No errors recorded for this job.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrorLogJob(null)} className="border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Job Dialog */}
      <Dialog open={addOpen} onOpenChange={o => !o && setAddOpen(false)}>
        <DialogContent className="max-w-md bg-[hsl(var(--background-2))] border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle>Add Cron Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Label</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. com.morning-brief" className="mt-1 bg-[hsl(var(--background))] border-[hsl(var(--border))]" autoFocus />
            </div>
            <div>
              <Label>Schedule</Label>
              <Input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. Every 3 hours" className="mt-1 bg-[hsl(var(--background))] border-[hsl(var(--border))]" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this job do?" className="mt-1 bg-[hsl(var(--background))] border-[hsl(var(--border))]" />
            </div>
            <div>
              <Label>Command</Label>
              <Input value={command} onChange={e => setCommand(e.target.value)} placeholder="e.g. python run_monitor.py" className="mt-1 bg-[hsl(var(--background))] border-[hsl(var(--border))]" />
            </div>
            <div>
              <Label>Project</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]">
                <option value="">None</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]">Cancel</Button>
            <Button onClick={addJob} disabled={!label.trim() || !schedule.trim()} className="bg-[hsl(var(--primary))] text-white">Add Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
