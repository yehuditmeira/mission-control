'use client';

import Link from 'next/link';
import { Bot, CheckCircle2, Clock, TrendingUp, Pin, Play, Pause } from 'lucide-react';

interface PlatformCardProps {
  platform: {
    id: number;
    slug: string;
    name: string;
    description: string;
    status: string;
    phase: number;
    completed_tasks: number;
    total_tasks: number;
    published_items: number;
    active_jobs: number;
    autonomous_target_date: string;
    weekly_metrics?: any;
  };
}

export default function PlatformCard({ platform }: PlatformCardProps) {
  function getStatusColor(status: string) {
    switch (status) {
      case 'autonomous': return 'bg-green-100 text-green-700 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  function getPhaseLabel(phase: number) {
    const labels = ['', 'Foundation', 'Content Engine', 'Launch & Optimize', 'Autonomous'];
    return labels[phase] || 'Unknown';
  }

  const progress = platform.total_tasks > 0 
    ? Math.round((platform.completed_tasks / platform.total_tasks) * 100) 
    : 0;

  return (
    <Link href={`/platforms/${platform.id}`}>
      <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow h-full">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{platform.name}</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{platform.description}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(platform.status)}`}>
            {platform.status === 'autonomous' && <Bot size={12} className="inline mr-1" />}
            {platform.status}
          </span>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Phase {platform.phase}: {getPhaseLabel(platform.phase)}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 rounded-md p-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <CheckCircle2 size={12} />
              Tasks
            </div>
            <div className="text-sm font-medium text-slate-900">
              {platform.completed_tasks}/{platform.total_tasks}
            </div>
          </div>
          <div className="bg-slate-50 rounded-md p-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Pin size={12} />
              Content
            </div>
            <div className="text-sm font-medium text-slate-900">
              {platform.published_items}
            </div>
          </div>
        </div>

        {platform.active_jobs > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-md px-2 py-1.5">
            <Bot size={12} className="animate-pulse" />
            {platform.active_jobs} autonomous {platform.active_jobs === 1 ? 'job' : 'jobs'} running
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <Clock size={12} className="inline mr-1" />
          Autonomous target: {new Date(platform.autonomous_target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </Link>
  );
}
