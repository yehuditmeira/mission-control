#!/usr/bin/env node
// import_tasks_from_md.mjs
// Scans HANDOFF.md per project + root OPEN_ITEMS.md, upserts `- [ ]` items as
// tasks. `- [x]` lines mark the existing task done. One-way: never writes back
// to the markdown.
//
// Idempotent via partial unique index on (source_file, source_line).

import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MC_ROOT = resolve(__dirname, '..');
const AI_FOLDER = resolve(MC_ROOT, '..');

config({ path: resolve(MC_ROOT, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// folder name → Supabase project_id. OPEN_ITEMS.md lives at AI_Folder root and
// is cross-project, so it maps to null.
const PROJECT_MAP = {
  Affiliate_Flow: 7,       // Mrkt Drop
  Merchant_Services: 6,    // Merchant Lead Hunter (dead, but keep mapping for history)
  Merchant_Services_v2: 6,
  PayDirect: 8,
  paydirect: 8,
  'personal-assistant': 9,
  Personal_Assistant: 9,
};

const SOURCES = [
  { file: resolve(AI_FOLDER, 'OPEN_ITEMS.md'), projectId: null },
  ...Object.entries(PROJECT_MAP).map(([folder, projectId]) => ({
    file: resolve(AI_FOLDER, folder, 'HANDOFF.md'),
    projectId,
  })),
];

const CHECKBOX_RE = /^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/;

function parseMarkdown(content) {
  const items = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const m = line.match(CHECKBOX_RE);
    if (!m) return;
    const checked = m[1].toLowerCase() === 'x';
    const title = m[2].trim();
    if (!title) return;
    items.push({ line: i + 1, title, checked });
  });
  return items;
}

async function upsertTask({ source_file, source_line, title, checked, project_id }) {
  const status = checked ? 'done' : 'backlog';
  const { data: existing } = await sb
    .from('tasks')
    .select('id, status')
    .eq('source_file', source_file)
    .eq('source_line', source_line)
    .maybeSingle();

  if (existing) {
    // Only flip status if markdown moved from unchecked to checked.
    // Don't overwrite tasks the user has actively moved in the UI.
    if (checked && existing.status !== 'done') {
      await sb.from('tasks').update({ status: 'done' }).eq('id', existing.id);
      return 'closed';
    }
    return 'unchanged';
  }

  await sb.from('tasks').insert({
    title: title.slice(0, 500),
    status,
    priority: 'medium',
    author: 'ai',
    project_id,
    source_file,
    source_line,
  });
  return 'created';
}

async function main() {
  const counts = { created: 0, closed: 0, unchanged: 0, skipped_files: 0 };

  for (const { file, projectId } of SOURCES) {
    if (!existsSync(file)) {
      counts.skipped_files++;
      continue;
    }
    const content = readFileSync(file, 'utf8');
    const items = parseMarkdown(content);
    for (const item of items) {
      const result = await upsertTask({
        source_file: file,
        source_line: item.line,
        title: item.title,
        checked: item.checked,
        project_id: projectId,
      });
      counts[result] = (counts[result] || 0) + 1;
    }
  }

  console.log(JSON.stringify({ ok: true, ...counts }, null, 2));
}

main().catch((err) => {
  console.error('import failed:', err.message);
  process.exit(1);
});
