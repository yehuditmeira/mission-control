import fs from 'fs';
import React from 'react';

function parseProjects(md: string) {
  const projects: { name: string; status: string; notes: string }[] = [];
  const re = /##\s*(.+)\n([\s\S]*?)(?=\n##|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const name = m[1].trim();
    const body = m[2];
    const statusMatch = body.match(/-\s*Status:\s*(.+)/i);
    const notesMatch = body.match(/-\s*Notes:\s*([\s\S]*?)(?:\n-|$)/i);
    projects.push({
      name,
      status: statusMatch ? statusMatch[1].trim() : 'unknown',
      notes: notesMatch ? notesMatch[1].trim() : '',
    });
  }
  return projects;
}

export default function Page() {
  let md = '';
  try {
    md = fs.readFileSync('/Users/katespencer/Documents/Obsidian Vault/Agent-Shared/project-state.md', 'utf8');
  } catch (e) {
    md = 'project-state not found';
  }

  const projects = parseProjects(md);
  const columns: Record<string, typeof projects> = { Live: [], Active: [], Blocked: [], Idle: [], Unknown: [] };
  projects.forEach((p) => {
    const s = p.status.toLowerCase();
    if (s.includes('live')) columns.Live.push(p);
    else if (s.includes('active') || s.includes('running')) columns.Active.push(p);
    else if (s.includes('block') || s.includes('mismatch') || s.includes('error')) columns.Blocked.push(p);
    else if (s.includes('idle')) columns.Idle.push(p);
    else columns.Unknown.push(p);
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kanban — Project States</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        {Object.entries(columns).map(([col, items]) => (
          <div key={col} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
            <h3 style={{ marginBottom: 8 }}>{col} ({items.length})</h3>
            {items.map((it) => (
              <div key={it.name} style={{ padding: 8, marginBottom: 8, background: '#fff', borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{it.notes}</div>
              </div>
            ))}
            {items.length === 0 && <div style={{ color: '#9ca3af' }}>— none —</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
