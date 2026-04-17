'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FileText,
  FolderOpen,
  Search,
  X,
  ArrowLeft,
  Upload,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROJECTS } from '@/lib/projects';
import type { DocEntry } from '@/app/api/docs/route';

const TYPE_CONFIG: Record<DocEntry['type'], { label: string; color: string }> = {
  readme: { label: 'README', color: 'bg-emerald-500/20 text-emerald-400' },
  planning: { label: 'Planning', color: 'bg-violet-500/20 text-violet-400' },
  research: { label: 'Research', color: 'bg-sky-500/20 text-sky-400' },
  api: { label: 'API / Arch', color: 'bg-amber-500/20 text-amber-400' },
  config: { label: 'Config', color: 'bg-neutral-500/20 text-neutral-400' },
  doc: { label: 'Doc', color: 'bg-pink-500/20 text-pink-400' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function DocsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string | null>(
    searchParams.get('project')
  );
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocEntry | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/docs');
      if (!res.ok) throw new Error('Failed to fetch docs');
      const data = await res.json();
      setDocs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const openDoc = useCallback(async (doc: DocEntry) => {
    setSelectedDoc(doc);
    setLoadingContent(true);
    setDocContent(null);
    try {
      const res = await fetch(
        `/api/docs/content?project=${encodeURIComponent(doc.project)}&path=${encodeURIComponent(doc.relativePath)}`
      );
      if (!res.ok) throw new Error('Failed to load file');
      const data = await res.json();
      setDocContent(data.content);
    } catch {
      setDocContent('Error: Could not load file content.');
    } finally {
      setLoadingContent(false);
    }
  }, []);

  const closeDoc = useCallback(() => {
    setSelectedDoc(null);
    setDocContent(null);
  }, []);

  const filtered = docs.filter((d) => {
    if (projectFilter && d.project !== projectFilter) return false;
    if (typeFilter && d.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.relativePath.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const projectForDoc = (id: string) => PROJECTS.find((p) => p.id === id);

  // Count by type for filter pills
  const typeCounts: Record<string, number> = {};
  const projectFiltered = docs.filter(
    (d) => !projectFilter || d.project === projectFilter
  );
  for (const d of projectFiltered) {
    typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
  }

  if (selectedDoc) {
    const proj = projectForDoc(selectedDoc.project);
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={closeDoc}
            className="p-1.5 rounded-md hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] truncate">
                {selectedDoc.name}
              </h1>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
                  TYPE_CONFIG[selectedDoc.type].color
                )}
              >
                {TYPE_CONFIG[selectedDoc.type].label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--foreground-dim))] mt-0.5">
              {proj && (
                <>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: proj.color }}
                  />
                  <span>{proj.name}</span>
                  <ChevronRight size={10} />
                </>
              )}
              <span className="font-mono">{selectedDoc.relativePath}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background-2))]">
          {loadingContent ? (
            <div className="flex items-center justify-center h-40 text-[hsl(var(--foreground-dim))] text-sm">
              Loading...
            </div>
          ) : (
            <pre className="p-4 text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap break-words font-[var(--font-mono)] leading-relaxed">
              {docContent}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            Docs Repository
          </h1>
          <p className="text-sm text-[hsl(var(--foreground-dim))] mt-0.5">
            {docs.length} documents across {Object.keys(PROJECT_DIRS_COUNT).length} projects
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Upload size={14} />
          Upload Doc
        </button>
      </div>

      {/* Search + Project Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-dim))]"
          />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground-dim))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-[hsl(var(--foreground-dim))]" />
          <button
            onClick={() => {
              setProjectFilter(null);
              router.replace('/docs');
            }}
            className={cn(
              'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              !projectFilter
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            All
          </button>
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProjectFilter(p.id === projectFilter ? null : p.id);
                router.replace(
                  p.id === projectFilter ? '/docs' : `/docs?project=${p.id}`
                );
              }}
              className={cn(
                'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                projectFilter === p.id
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-1.5 mb-4">
        <button
          onClick={() => setTypeFilter(null)}
          className={cn(
            'px-2 py-1 rounded text-[11px] font-medium transition-colors',
            !typeFilter
              ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
              : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]'
          )}
        >
          All types
        </button>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
          const count = typeCounts[key] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? null : key)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium transition-colors',
                typeFilter === key
                  ? cfg.color
                  : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-40 text-[hsl(var(--foreground-dim))] text-sm">
          Scanning documents...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center h-40 text-red-400 text-sm gap-2">
          <p>{error}</p>
          <button
            onClick={fetchDocs}
            className="text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-[hsl(var(--foreground-dim))]">
          <FolderOpen size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No documents found</p>
          {(search || projectFilter || typeFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setProjectFilter(null);
                setTypeFilter(null);
                router.replace('/docs');
              }}
              className="text-xs text-[hsl(var(--primary))] mt-1 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Document List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px_90px_80px_80px] gap-2 px-4 py-2 bg-[hsl(var(--secondary))] text-[10px] font-semibold text-[hsl(var(--foreground-dim))] uppercase tracking-wider">
            <span>Document</span>
            <span>Project</span>
            <span>Type</span>
            <span>Size</span>
            <span>Modified</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[hsl(var(--border))]">
            {filtered.map((doc) => {
              const proj = projectForDoc(doc.project);
              const cfg = TYPE_CONFIG[doc.type];
              return (
                <button
                  key={`${doc.project}/${doc.relativePath}`}
                  onClick={() => openDoc(doc)}
                  className="w-full grid grid-cols-[1fr_140px_90px_80px_80px] gap-2 px-4 py-2.5 text-left hover:bg-[hsl(var(--secondary))] transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      size={14}
                      className="text-[hsl(var(--foreground-dim))] flex-shrink-0 group-hover:text-[hsl(var(--primary))]"
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-[hsl(var(--foreground))] truncate">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-[hsl(var(--foreground-dim))] truncate font-mono">
                        {doc.relativePath}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--foreground-dim))]">
                    {proj && (
                      <>
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
                        cfg.color
                      )}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-[hsl(var(--foreground-dim))] font-mono">
                    {formatBytes(doc.size)}
                  </div>
                  <div className="flex items-center text-xs text-[hsl(var(--foreground-dim))]">
                    {timeAgo(doc.modifiedAt)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Count unique projects that have docs (used in header subtitle)
const PROJECT_DIRS_COUNT = {
  'affiliate-flow': true,
  'lead-hunter': true,
  'paydirect': true,
  'personal-assistant': true,
  'mission-control': true,
};

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-40 text-[hsl(var(--foreground-dim))] text-sm">
          Loading...
        </div>
      }
    >
      <DocsContent />
    </Suspense>
  );
}
