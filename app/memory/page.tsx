'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, FileText, Calendar, ArrowLeft } from 'lucide-react';

interface MemoryEntry {
  filename: string;
  name: string;
  description: string;
  type: 'daily' | 'durable';
  date: string | null;
  size: number;
  preview: string;
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/memory-logs').then(r => r.json()).then(setEntries);
  }, []);

  const viewFile = async (filename: string) => {
    setLoading(true);
    setSelectedFile(filename);
    const res = await fetch(`/api/memory-logs/${encodeURIComponent(filename)}`);
    const data = await res.json();
    setContent(data.content || 'Unable to load content');
    setLoading(false);
  };

  if (selectedFile) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">{selectedFile}</h1>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-600 leading-relaxed">{content}</pre>
          </div>
        )}
      </div>
    );
  }

  const dailyLogs = entries.filter(e => e.type === 'daily');
  const durableMemories = entries.filter(e => e.type === 'durable');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Memory Logs</h1>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p className="text-lg mb-2">No memory logs yet</p>
          <p className="text-sm">Daily summaries will appear here as they&apos;re created</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Durable Memories */}
          {durableMemories.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-neutral-600" /> Durable Memories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {durableMemories.map(entry => (
                  <div
                    key={entry.filename}
                    onClick={() => viewFile(entry.filename)}
                    className="bg-white rounded-lg border border-neutral-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium truncate">{entry.name}</h3>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Logs */}
          {dailyLogs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neutral-400" /> Daily Logs
              </h2>
              <div className="space-y-2">
                {dailyLogs.map(entry => (
                  <div
                    key={entry.filename}
                    onClick={() => viewFile(entry.filename)}
                    className="bg-white rounded-lg border border-neutral-200 p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <div className="text-sm font-mono font-medium text-neutral-500 min-w-[100px]">{entry.date}</div>
                    <p className="text-sm text-muted-foreground truncate flex-1">{entry.preview}</p>
                    <span className="text-xs text-muted-foreground">{Math.round(entry.size / 1024)}KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
