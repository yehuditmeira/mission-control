'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Loader2, ExternalLink, Folder } from 'lucide-react';

type DocOp = {
  id: number;
  title: string;
  subtype: string | null;
  notes: string | null;
  code_path: string | null;
  source_path: string | null;
  last_run_at: string | null;
  projects: { slug: string; name: string; color: string } | null;
};

const SUBTYPE_LABEL: Record<string, string> = {
  'platform-sop': 'Platform SOP',
  'project-state': 'Project state',
  strategy: 'Strategy',
  marketing: 'Marketing',
  docs: 'Reference',
};

export default function LibraryPage() {
  const [ops, setOps] = useState<DocOp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<string>('ALL');
  const [subtype, setSubtype] = useState<string>('ALL');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/operations?category=DOC&_=' + Date.now())
      .then((r) => r.json())
      .then((d) => setOps(d.operations || []))
      .catch((e) => setError(e.message));
  }, []);

  const projects = useMemo(() => {
    if (!ops) return [];
    return Array.from(new Set(ops.map((o) => o.projects?.slug).filter(Boolean))) as string[];
  }, [ops]);

  const subtypes = useMemo(() => {
    if (!ops) return [];
    return Array.from(new Set(ops.map((o) => o.subtype).filter(Boolean))) as string[];
  }, [ops]);

  const filtered = useMemo(() => {
    if (!ops) return [];
    return ops.filter((o) => {
      if (project !== 'ALL' && o.projects?.slug !== project) return false;
      if (subtype !== 'ALL' && o.subtype !== subtype) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !o.title.toLowerCase().includes(needle) &&
          !(o.notes ?? '').toLowerCase().includes(needle) &&
          !(o.source_path ?? '').toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
  }, [ops, project, subtype, q]);

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/30 rounded p-4 text-sm text-red-400">{error}</div>;
  }
  if (!ops) {
    return (
      <div className="flex items-center gap-2 text-[hsl(var(--foreground-dim))]">
        <Loader2 size={14} className="animate-spin" /> Loading library…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
          Library
        </h1>
        <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1 tracking-wider uppercase">
          {ops.length} operating records · SOPs, plans, strategies, project state
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-dim))]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search title, summary, path…"
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:border-[hsl(var(--primary))] outline-none"
          />
        </div>
        {['ALL', ...projects].map((p) => (
          <button
            key={p}
            onClick={() => setProject(p)}
            className={`text-[11px] px-2 py-1 rounded border ${
              project === p
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))] bg-[hsl(var(--primary))]/10'
                : 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]'
            }`}
          >
            {p === 'ALL' ? 'ALL' : p}
          </button>
        ))}
        <span className="mx-2 h-3 w-px bg-[hsl(var(--border))]" />
        {['ALL', ...subtypes].map((s) => (
          <button
            key={s}
            onClick={() => setSubtype(s)}
            className={`text-[11px] px-2 py-1 rounded border ${
              subtype === s
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))] bg-[hsl(var(--primary))]/10'
                : 'border-[hsl(var(--border))] text-[hsl(var(--foreground-dim))]'
            }`}
          >
            {s === 'ALL' ? 'all types' : SUBTYPE_LABEL[s] ?? s}
          </button>
        ))}
      </div>

      {/* Doc cards */}
      {filtered.length === 0 ? (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-8 text-center text-sm text-[hsl(var(--foreground-dim))]">
          No documents match these filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 hover:border-[hsl(var(--border-bright))] transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                <FileText size={14} className="text-[hsl(var(--foreground-dim))] mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{d.title}</h3>
                  <p className="text-[10px] text-[hsl(var(--foreground-dim))] font-mono truncate" title={d.source_path ?? ''}>
                    {d.source_path}
                  </p>
                </div>
              </div>
              {d.notes && (
                <p className="text-[11px] text-[hsl(var(--foreground-dim))] leading-snug line-clamp-3 mb-2">{d.notes}</p>
              )}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  {d.projects && (
                    <span className="flex items-center gap-1 text-[hsl(var(--foreground-dim))]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.projects.color }} />
                      {d.projects.slug}
                    </span>
                  )}
                  {d.subtype && (
                    <span className="text-[hsl(var(--foreground-dim))]">· {SUBTYPE_LABEL[d.subtype] ?? d.subtype}</span>
                  )}
                </div>
                {d.code_path && (
                  <a
                    href={`file://${d.code_path}`}
                    className="flex items-center gap-1 text-[hsl(var(--primary))] hover:underline"
                  >
                    open <ExternalLink size={9} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
