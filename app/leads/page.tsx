'use client';

import { useEffect, useState } from 'react';
import { Loader2, Inbox, RefreshCw, Flame, Users } from 'lucide-react';

type Digest = {
  id: number;
  posted_at: string;
  source_project: string;
  hot_count: number;
  qualified_count: number;
  total_new: number;
  scrape_window: string | null;
  payload: any;
  markdown: string | null;
  error: string | null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function LeadsPage() {
  const [digests, setDigests] = useState<Digest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  function load() {
    setDigests(null);
    fetch('/api/lead-digests?_=' + Date.now())
      .then((r) => r.json())
      .then((d) => {
        setDigests(d.digests || []);
        if (d.digests?.length && activeId === null) setActiveId(d.digests[0].id);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
        Error: {error}
      </div>
    );
  }

  if (!digests) {
    return (
      <div className="flex items-center gap-2 text-[hsl(var(--foreground-dim))]">
        <Loader2 size={14} className="animate-spin" />
        Loading lead digests…
      </div>
    );
  }

  if (digests.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
            Lead Digests
          </h1>
          <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1 tracking-wider uppercase">
            Merchant Lead Hunter — output now lives here, not Telegram
          </p>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-8 text-center text-sm text-[hsl(var(--foreground-dim))]">
          <Inbox size={28} className="mx-auto mb-3 opacity-50" />
          <p>No digests yet.</p>
          <p className="text-[11px] mt-2">
            The Merchant Lead Hunter scheduler posts here every digest interval. Next digest fires when the
            APScheduler <code>telegram_digest</code> job runs (now writes here, not Telegram).
          </p>
        </div>
      </div>
    );
  }

  const active = digests.find((d) => d.id === activeId) ?? digests[0];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] font-[family-name:var(--font-heading)]">
            Lead Digests
          </h1>
          <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1 tracking-wider uppercase">
            Merchant Lead Hunter — output now lives here, not Telegram
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-[hsl(var(--foreground-dim))] hover:text-[hsl(var(--foreground))]"
        >
          <RefreshCw size={12} /> refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Left rail */}
        <ul className="space-y-1">
          {digests.map((d) => {
            const isActive = d.id === active.id;
            return (
              <li key={d.id}>
                <button
                  onClick={() => setActiveId(d.id)}
                  className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                    isActive
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10'
                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border-bright))] hover:bg-[hsl(var(--secondary))]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[hsl(var(--foreground))] font-medium">
                      {timeAgo(d.posted_at)}
                    </span>
                    {d.hot_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-300">
                        <Flame size={10} /> {d.hot_count}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[hsl(var(--foreground-dim))]">
                    {d.total_new} new · {d.qualified_count} qualified
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Right pane: render the active digest */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[hsl(var(--border))]">
            <div>
              <div className="text-xs text-[hsl(var(--foreground-dim))] uppercase tracking-wider">
                Posted
              </div>
              <div className="text-sm text-[hsl(var(--foreground))]">
                {new Date(active.posted_at).toLocaleString()}
              </div>
            </div>
            <span className="ml-auto" />
            <Stat label="Total new" value={active.total_new} />
            <Stat label="Qualified" value={active.qualified_count} icon={<Users size={11} />} />
            <Stat label="Hot" value={active.hot_count} icon={<Flame size={11} />} accent="text-amber-300" />
          </div>

          {active.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 p-3">
              {active.error}
            </div>
          )}

          {active.markdown ? (
            <pre className="text-[12px] leading-relaxed text-[hsl(var(--foreground))] whitespace-pre-wrap font-mono bg-[hsl(var(--secondary))]/30 rounded p-4 overflow-x-auto">
              {active.markdown}
            </pre>
          ) : (
            <p className="text-sm text-[hsl(var(--foreground-dim))] italic">No markdown payload</p>
          )}

          {active.payload?.leads?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-dim))] mb-2">
                Raw lead sample (first 5)
              </p>
              <div className="space-y-1">
                {active.payload.leads.slice(0, 5).map((lead: any, i: number) => (
                  <div
                    key={i}
                    className="text-[11px] font-mono text-[hsl(var(--foreground-dim))] bg-[hsl(var(--secondary))]/30 px-2 py-1 rounded"
                  >
                    {lead.author && <span className="text-[hsl(var(--foreground))]">u/{lead.author}</span>}
                    {lead.intent && <span className="ml-2">[{lead.intent}]</span>}
                    {lead.urgency && <span className="ml-2 text-amber-300">{lead.urgency}</span>}
                    {lead.confidence != null && <span className="ml-2">conf={Math.round(lead.confidence * 100)}%</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="text-right">
      <div className={`text-xl font-semibold leading-none font-[family-name:var(--font-heading)] ${accent ?? 'text-[hsl(var(--foreground))]'}`}>
        {value}
      </div>
      <div className="text-[10px] text-[hsl(var(--foreground-dim))] uppercase tracking-wider mt-1 flex items-center justify-end gap-1">
        {icon}
        {label}
      </div>
    </div>
  );
}
