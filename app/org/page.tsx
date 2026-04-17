'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AgentStatus = 'active' | 'idle' | 'blocked';

type OrgNode = {
  name: string;
  role?: string;
  status: AgentStatus;
  children?: OrgNode[];
};

const orgTree: OrgNode = {
  name: 'Yomy',
  role: 'CEO / Orchestrator-in-Chief',
  status: 'active',
  children: [
    {
      name: 'Kimi',
      role: 'Orchestrator',
      status: 'active',
      children: [
        {
          name: 'ChatGPT',
          role: 'Product Manager',
          status: 'idle',
        },
        {
          name: 'Claude Code',
          role: 'Lead Coder',
          status: 'active',
          children: [
            { name: 'QA Agent', role: 'Testing & Verification', status: 'idle' },
            { name: 'Writer Agent', role: 'Content & Copy', status: 'idle' },
          ],
        },
      ],
    },
    {
      name: 'Projects',
      role: 'Product Portfolio',
      status: 'active',
      children: [
        {
          name: 'Affiliate Flow',
          role: 'themrktdrop.com',
          status: 'active',
          children: [
            { name: 'Social Agent', role: 'Pinterest, TikTok, etc.', status: 'idle' },
          ],
        },
        { name: 'Lead Hunter', role: 'Merchant Lead Gen', status: 'active' },
        { name: 'PayDirect', role: 'Payment Platform', status: 'idle' },
        { name: 'Personal Assistant', role: 'Life Ops', status: 'idle' },
      ],
    },
  ],
};

const statusConfig: Record<AgentStatus, { dot: string; label: string }> = {
  active: { dot: 'bg-emerald-400 shadow-[0_0_6px_hsl(160,80%,50%)]', label: 'Active' },
  idle: { dot: 'bg-[hsl(var(--foreground-dim))]', label: 'Idle' },
  blocked: { dot: 'bg-red-400 shadow-[0_0_6px_hsl(0,80%,50%)]', label: 'Blocked' },
};

function TreeNode({ node, depth = 0, isLast = true }: { node: OrgNode; depth?: number; isLast?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const status = statusConfig[node.status];

  return (
    <div className="relative">
      {/* Horizontal connector line from parent */}
      {depth > 0 && (
        <div
          className="absolute top-5 -left-6 w-6 border-t border-[hsl(var(--border-bright))]"
        />
      )}

      {/* Vertical connector line continuing down for siblings */}
      {depth > 0 && !isLast && (
        <div
          className="absolute top-5 -left-6 h-full border-l border-[hsl(var(--border-bright))]"
        />
      )}

      {/* Node card */}
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all',
          'bg-[hsl(var(--card))] border border-[hsl(var(--border))]',
          'hover:border-[hsl(var(--border-bright))] hover:bg-[hsl(var(--secondary))]',
          hasChildren && 'cursor-pointer',
          depth === 0 && 'border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.08)]'
        )}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={14} className="text-[hsl(var(--foreground-dim))] flex-shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-[hsl(var(--foreground-dim))] flex-shrink-0" />
          )
        ) : (
          <span className="w-[14px] flex-shrink-0" />
        )}

        {/* Status dot */}
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', status.dot)} />

        {/* Name & role */}
        <div className="min-w-0">
          <div className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
            {node.name}
          </div>
          {node.role && (
            <div className="text-xs text-[hsl(var(--foreground-dim))] truncate">
              {node.role}
            </div>
          )}
        </div>

        {/* Status label */}
        <span className={cn(
          'ml-auto text-[10px] uppercase tracking-wider flex-shrink-0',
          node.status === 'active' ? 'text-emerald-400' :
          node.status === 'blocked' ? 'text-red-400' :
          'text-[hsl(var(--foreground-dim))]'
        )}>
          {status.label}
        </span>
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative ml-8 mt-1 space-y-1">
          {/* Vertical connector line for children */}
          <div
            className="absolute top-0 left-[-6px] border-l border-[hsl(var(--border-bright))]"
            style={{ height: 'calc(100% - 16px)' }}
          />
          {node.children!.map((child, i) => (
            <TreeNode
              key={child.name}
              node={child}
              depth={depth + 1}
              isLast={i === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))] mb-1">
          Organization
        </h1>
        <p className="text-sm text-[hsl(var(--foreground-dim))]">
          Agent hierarchy and project structure
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-xs text-[hsl(var(--foreground-dim))]">
        {Object.entries(statusConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full', val.dot)} />
            {val.label}
          </div>
        ))}
      </div>

      {/* Tree */}
      <TreeNode node={orgTree} />
    </div>
  );
}
