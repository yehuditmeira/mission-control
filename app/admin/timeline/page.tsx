import fs from 'fs';
import React from 'react';

function parseProjects(md: string) {
  const projects: { name: string; status: string; last: string }[] = [];
  const re = /##\s*(.+)\n([\s\S]*?)(?=\n##|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const name = m[1].trim();
    const body = m[2];
    const statusMatch = body.match(/-\s*Status:\s*(.+)/i);
    const lastMatch = body.match(/-\s*Last updated:\s*(.+)/i);
    projects.push({
      name,
      status: statusMatch ? statusMatch[1].trim() : 'unknown',
      last: lastMatch ? lastMatch[1].trim() : '',
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Timeline — Project Last Updates</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {projects.map((p) => (
          <div key={p.name} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}>
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{p.status} — last updated: {p.last || 'unknown'}</div>
          </div>
        ))}
        {projects.length === 0 && <div style={{ color: '#9ca3af' }}>No project data found.</div>}
      </div>
    </div>
  );
}
