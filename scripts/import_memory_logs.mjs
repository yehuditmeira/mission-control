#!/usr/bin/env node
// import_memory_logs.mjs
// One-shot + idempotent importer for ~/Desktop/AI_Folder/memory/. Upserts each
// .md file into the memory_logs table so the /memory page works on Vercel
// (where the local memory/ folder isn't deployed).
//
// Run manually after meaningful memory updates, or wire into hourly cron.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MC_ROOT = resolve(__dirname, '..');
const MEMORY_DIR = resolve(MC_ROOT, '..', 'memory');

config({ path: resolve(MC_ROOT, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { name: null, description: null };
  const fm = m[1];
  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  const descMatch = fm.match(/^description:\s*(.+)$/m);
  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    description: descMatch ? descMatch[1].trim() : null,
  };
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}

async function main() {
  let created = 0, updated = 0, skipped = 0;

  const files = walk(MEMORY_DIR);
  for (const path of files) {
    const filename = path.replace(MEMORY_DIR + '/', '');
    const content = readFileSync(path, 'utf-8');
    const isDaily = /^\d{4}-\d{2}-\d{2}\.md$/.test(filename) || /\d{4}-\d{2}-\d{2}\.md$/.test(filename.split('/').pop());
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})\.md$/);
    const fm = parseFrontmatter(content);

    const row = {
      filename,
      name: fm.name || filename.split('/').pop().replace('.md', ''),
      description: fm.description || '',
      type: isDaily ? 'daily' : 'durable',
      date: dateMatch ? dateMatch[1] : null,
      content,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await sb
      .from('memory_logs')
      .select('id, content')
      .eq('filename', filename)
      .maybeSingle();

    if (existing) {
      if (existing.content === content) { skipped++; continue; }
      await sb.from('memory_logs').update(row).eq('id', existing.id);
      updated++;
    } else {
      await sb.from('memory_logs').insert(row);
      created++;
    }
  }

  console.log(JSON.stringify({ ok: true, created, updated, skipped, total_scanned: files.length }, null, 2));
}

main().catch((err) => { console.error('import failed:', err.message); process.exit(1); });
