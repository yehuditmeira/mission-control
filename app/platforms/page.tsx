'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  LayoutGrid, 
  TrendingUp, 
  AlertCircle,
  Play,
  Pause,
  Bot,
  Sparkles,
  BarChart3,
  Pin,
  ArrowRight
} from 'lucide-react';

interface Platform {
  id: number;
  slug: string;
  name: string;
  description: string;
  priority: number;
  status: string;
  phase: number;
  start_date: string;
  autonomous_target_date: string;
  config?: any;
  completed_tasks: number;
  total_tasks: number;
  published_items: number;
  items_this_week: number;
  active_jobs: number;
}

interface Task {
  id: number;
  platform_id: number;
  platform_name: string;
  phase: number;
  task_number: string;
  title: string;
  status: string;
  can_automate: number;
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gantt' | 'kanban' | 'list'>('gantt');

  useEffect(() => {
    fetchPlatforms();
    fetchTasks();
  }, []);

  async function fetchPlatforms() {
    try {
      const res = await fetch('/api/platforms');
      const data = await res.json();
      setPlatforms(data.platforms || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTasks() {
    try {
      const res = await fetch('/api/platform-tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'autonomous': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'pending': return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
      case 'failed': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-700';
    }
  }

  function getPhaseLabel(phase: number) {
    switch (phase) {
      case 1: return 'Foundation';
      case 2: return 'Content Engine';
      case 3: return 'Launch & Optimize';
      case 4: return 'Autonomous';
      default: return 'Unknown';
    }
  }

  function getTaskAutomationBadge(level: number) {
    switch (level) {
      case 2: return <span className="text-xs text-purple-600 flex items-center gap-1"><Bot size={12} /> Full Auto</span>;
      case 1: return <span className="text-xs text-blue-600 flex items-center gap-1"><Sparkles size={12} /> AI Assist</span>;
      default: return <span className="text-xs text-slate-500">Manual</span>;
    }
  }

  // GANTT CHART COMPONENT
  const GanttView = () => {
    const startDate = new Date('2026-04-14');
    const endDate = new Date('2026-08-01');
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const weeks = [];
    for (let i = 0; i <= 16; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      weeks.push(weekStart);
    }

    function getPositionForDate(dateStr: string) {
      const date = new Date(dateStr);
      const daysFromStart = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return (daysFromStart / totalDays) * 100;
    }

    function getDuration(start: string, end: string) {
      const startPos = getPositionForDate(start);
      const endPos = getPositionForDate(end);
      return endPos - startPos;
    }

    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Calendar size={18} />
            Platform Gantt Timeline
          </h2>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> Phase 1-3 (Active Work)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> Phase 4 (Autonomous)</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[1000px] p-4">
            {/* Week headers */}
            <div className="flex border-b border-slate-200 pb-2 mb-4">
              <div className="w-40 flex-shrink-0 text-xs font-medium text-slate-500">Platform</div>
              <div className="flex-1 flex">
                {weeks.map((week, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-slate-400 border-l border-slate-100">
                    {week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            </div>

            {/* Platform rows */}
            {platforms.map((platform) => {
              const startPos = getPositionForDate(platform.start_date);
              const endPos = getPositionForDate(platform.autonomous_target_date);
              const duration = endPos - startPos;
              const phase4Start = endPos;
              const phase4Duration = 15; // Show autonomous running for a bit

              return (
                <div key={platform.id} className="flex items-center py-3 border-b border-slate-100 hover:bg-slate-50">
                  <div className="w-40 flex-shrink-0 pr-4">
                    <div className="font-medium text-sm text-slate-900">{platform.name}</div>
                    <div className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full border ${getStatusColor(platform.status)}`}>
                      {platform.status === 'autonomous' ? <Bot size={12} /> : 
                       platform.status === 'active' ? <Play size={12} /> : 
                       platform.status === 'paused' ? <Pause size={12} /> : <Clock size={12} />}
                      {platform.status}
                    </div>
                  </div>
                  
                  <div className="flex-1 relative h-8">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {weeks.map((_, i) => (
                        <div key={i} className="flex-1 border-l border-slate-100"></div>
                      ))}
                    </div>
                    
                    {/* Phase 1-3 bar */}
                    <div 
                      className="absolute top-1 h-6 bg-gradient-to-r from-blue-500 to-blue-400 rounded-md shadow-sm"
                      style={{ 
                        left: `${startPos}%`, 
                        width: `${duration}%`,
                        opacity: platform.phase >= 1 && platform.phase < 4 ? 1 : 0.3
                      }}
                    >
                      <div className="px-2 h-full flex items-center text-white text-xs truncate">
                        P{platform.phase}: {getPhaseLabel(platform.phase)}
                      </div>
                    </div>
                    
                    {/* Phase 4 bar */}
                    <div 
                      className="absolute top-1 h-6 bg-gradient-to-r from-green-500 to-green-400 rounded-md shadow-sm"
                      style={{ 
                        left: `${phase4Start}%`, 
                        width: `${phase4Duration}%`,
                        opacity: platform.status === 'autonomous' ? 1 : 0.2
                      }}
                    >
                      <div className="px-2 h-full flex items-center text-white text-xs truncate flex items-center gap-1">
                        <Bot size={12} /> Autonomous
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-medium">Milestones:</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Apr 21: Pinterest Start
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Apr 28: SEO/Blog Start
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              May 5: Instagram Start
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              May 19: Pinterest Autonomous
            </div>
          </div>
        </div>
      </div>
    );
  };

  // KANBAN VIEW COMPONENT
  const KanbanView = () => {
    const columns = [
      { id: 'backlog', title: 'Backlog', color: 'bg-slate-100' },
      { id: 'todo', title: 'To Do', color: 'bg-blue-50' },
      { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-50' },
      { id: 'done', title: 'Done', color: 'bg-green-50' }
    ];

    function getTasksByStatus(status: string) {
      return tasks.filter(t => t.status === status);
    }

    async function updateTaskStatus(taskId: number, newStatus: string) {
      try {
        await fetch('/api/platform-tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: taskId, status: newStatus })
        });
        fetchTasks();
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }

    return (
      <div className="grid grid-cols-4 gap-4">
        {columns.map(col => {
          const columnTasks = getTasksByStatus(col.id);
          return (
            <div key={col.id} className={`${col.color} rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-slate-700">{col.title}</h3>
                <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {columnTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="bg-white p-3 rounded-md shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400">{task.task_number}</span>
                      {getTaskAutomationBadge(task.can_automate)}
                    </div>
                    <p className="text-sm text-slate-800 mb-2">{task.title}</p>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Pin size={12} />
                      {task.platform_name}
                    </div>
                    
                    {col.id !== 'done' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, col.id === 'backlog' ? 'todo' : col.id === 'todo' ? 'in_progress' : 'done')}
                        className="mt-2 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                      >
                        {col.id === 'backlog' ? '→ Move to Todo' : col.id === 'todo' ? '→ Start' : '✓ Complete'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // LIST VIEW COMPONENT  
  const ListView = () => (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Platform</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phase</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Content</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Jobs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Target</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map(platform => (
              <tr key={platform.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{platform.name}</div>
                  <div className="text-xs text-slate-500">{platform.description?.substring(0, 50)}...</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getStatusColor(platform.status)}`}>
                    {platform.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium">Phase {platform.phase}</span>
                  <div className="text-xs text-slate-500">{getPhaseLabel(platform.phase)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${platform.total_tasks > 0 ? (platform.completed_tasks / platform.total_tasks) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {platform.completed_tasks}/{platform.total_tasks}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{platform.published_items} published</div>
                  <div className="text-xs text-slate-500">+{platform.items_this_week} this week</div>
                </td>
                <td className="px-4 py-3">
                  {platform.active_jobs > 0 ? (
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <Bot size={14} />
                      {platform.active_jobs} active
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">No active jobs</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-700">
                    {new Date(platform.autonomous_target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-slate-500">Autonomous</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // METRICS DASHBOARD
  const MetricsDashboard = () => {
    const activePlatforms = platforms.filter(p => p.status === 'active' || p.status === 'autonomous').length;
    const autonomousPlatforms = platforms.filter(p => p.status === 'autonomous').length;
    const pendingPlatforms = platforms.filter(p => p.status === 'pending').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const automatableTasks = tasks.filter(t => t.can_automate > 0).length;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-medium mb-1">
            <TrendingUp size={14} />
            Active Platforms
          </div>
          <div className="text-2xl font-bold text-slate-900">{activePlatforms} <span className="text-sm font-normal text-slate-400">/ {platforms.length}</span></div>
          <div className="text-xs text-slate-500 mt-1">{autonomousPlatforms} autonomous</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-medium mb-1">
            <CheckCircle2 size={14} />
            Task Progress
          </div>
          <div className="text-2xl font-bold text-slate-900">{completedTasks} <span className="text-sm font-normal text-slate-400">/ {totalTasks}</span></div>
          <div className="text-xs text-slate-500 mt-1">{Math.round((completedTasks / totalTasks) * 100) || 0}% complete</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-medium mb-1">
            <Bot size={14} />
            Automation Ready
          </div>
          <div className="text-2xl font-bold text-slate-900">{automatableTasks}</div>
          <div className="text-xs text-slate-500 mt-1">
            {tasks.filter(t => t.can_automate === 2).length} fully autonomous
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-medium mb-1">
            <Clock size={14} />
            Next Start
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingPlatforms}</div>
          <div className="text-xs text-slate-500 mt-1">
            {pendingPlatforms > 0 && new Date(platforms.find(p => p.status === 'pending')?.start_date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading platforms...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LayoutGrid size={24} className="text-purple-600" />
          Marketing Platforms
        </h1>
        <p className="text-slate-500 mt-1">
          7-platform autonomous marketing system (Pinterest → SEO → Instagram → WhatsApp → Facebook → TikTok → Twitter/X)
        </p>
      </div>

      <MetricsDashboard />

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('gantt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'gantt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={16} />
            Gantt
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid size={16} />
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={16} />
            List
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/api/recurring-jobs"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Bot size={16} />
            View Autonomous Jobs
          </Link>
        </div>
      </div>

      {/* View Content */}
      {view === 'gantt' && <GanttView />}
      {view === 'kanban' && <KanbanView />}
      {view === 'list' && <ListView />}
    </div>
  );
}
