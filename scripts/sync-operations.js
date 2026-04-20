#!/usr/bin/env node
// =====================================================
// SYNC OPERATIONS — single importer for all machine-job sources
// Reads launchd, Vercel cron configs, and APScheduler defs and upserts
// every job into Mission Control's `operations` table.
//
// Run: node scripts/sync-operations.js
// Schedule via launchd later (com.mc.sync-operations) so MC stays current.
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load env from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
               'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvY2ZnbGRhdmdvcXdreWZtemNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQzNDEyOCwiZXhwIjoyMDkyMDEwMTI4fQ.k-0iN83ypHhoKGh-Zle3I2fiRWJ35sUeHTwleSVbWuM';
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

const HOME = os.homedir();
const AI_FOLDER = path.join(HOME, 'Desktop', 'AI_Folder');

// ---------- project_id resolver ----------
let projectIdMap = {};
async function loadProjectMap() {
  const { data } = await sb.from('projects').select('id, slug');
  for (const p of data ?? []) projectIdMap[p.slug] = p.id;
}

function projectIdFor(slug) {
  return projectIdMap[slug] ?? null;
}

// ---------- launchd importer ----------
function listLaunchdJobs() {
  // Returns [{ pid, lastExit, label }, ...]
  const out = execSync('launchctl list', { encoding: 'utf-8' });
  const lines = out.split('\n').slice(1).filter(Boolean);
  return lines.map((line) => {
    const [pid, lastExit, label] = line.split('\t');
    return {
      pid: pid === '-' ? null : parseInt(pid),
      lastExit: lastExit === '-' ? null : parseInt(lastExit),
      label,
    };
  });
}

function readPlist(label) {
  const plist = path.join(HOME, 'Library', 'LaunchAgents', `${label}.plist`);
  if (!fs.existsSync(plist)) return null;
  const content = fs.readFileSync(plist, 'utf-8');
  // Crude but sufficient: pull ProgramArguments + StartInterval/StartCalendarInterval
  const args = [...content.matchAll(/<string>([^<]+)<\/string>/g)].map((m) => m[1]);
  const intervalMatch = content.match(/<key>StartInterval<\/key>\s*<integer>(\d+)<\/integer>/);
  const calendarMatch = content.match(/<key>StartCalendarInterval<\/key>([\s\S]*?)<\/dict>|<\/array>/);
  let cadence = 'manual';
  if (intervalMatch) {
    const sec = parseInt(intervalMatch[1]);
    if (sec % 86400 === 0) cadence = `every ${sec / 86400}d`;
    else if (sec % 3600 === 0) cadence = `every ${sec / 3600}h`;
    else if (sec % 60 === 0) cadence = `every ${sec / 60}min`;
    else cadence = `every ${sec}s`;
  } else if (calendarMatch) {
    cadence = 'calendar';
  } else if (content.includes('<key>KeepAlive</key>')) {
    cadence = 'always-on';
  }
  return { argv: args, cadence };
}

// Map a launchd label to a project slug + classification heuristic.
function classifyLaunchdLabel(label, plist) {
  const argv = (plist?.argv || []).join(' ');
  const isMerchant = label.includes('merchant') || argv.includes('Merchant_Services');
  const isMrkt = label.includes('mrktdrop') || argv.includes('Affiliate_Flow') || label.includes('themrktdrop');
  const isPayDirect = label.includes('paydirect') || argv.includes('paydirect');
  const isPersonal = label.includes('personal') || label.includes('morning-brief') || label.includes('email-digest');

  if (isMerchant) return 'merchant-lead-hunter';
  if (isMrkt) return 'mrkt-drop';
  if (isPayDirect) return 'paydirect';
  if (isPersonal) return 'personal-assistant';

  // Heuristic by name when path is generic henry-cron/*
  if (label.includes('reddit') || label.includes('dm-sender') || label.includes('lead-digest')) return 'merchant-lead-hunter';
  if (label.includes('deal-scanner') || label.includes('link-checker') || label.includes('competitor-monitor')) return 'mrkt-drop';
  return null;
}

// ---------- Health classification ----------
function healthFromExit(exit, label) {
  if (exit === null || exit === undefined) return 'unknown';
  if (exit === 0) return 'green';
  // -N = killed by signal N. -15 (SIGTERM) usually means clean restart, treat as yellow.
  if (exit === -15) return 'yellow';
  // 126 = not executable, 127 = command not found, -9 = SIGKILL — all red.
  return 'red';
}

function statusFromExit(exit, pid) {
  if (pid && pid > 0) return 'running';
  if (exit === 0) return 'idle';
  if (exit === null || exit === undefined) return 'unknown';
  return 'failing';
}

// ---------- Vercel crons ----------
function listVercelCrons() {
  const out = [];
  const projects = [
    { slug: 'mrkt-drop', vercelJson: path.join(AI_FOLDER, 'Affiliate_Flow', 'vercel.json'), name: 'Affiliate_Flow' },
    { slug: 'merchant-lead-hunter', vercelJson: path.join(AI_FOLDER, 'Merchant_Services', 'vercel.json'), name: 'Merchant_Services' },
    { slug: 'paydirect', vercelJson: path.join(AI_FOLDER, 'paydirect', 'vercel.json'), name: 'paydirect' },
    { slug: 'personal-assistant', vercelJson: path.join(AI_FOLDER, 'personal-assistant', 'vercel.json'), name: 'personal-assistant' },
  ];
  for (const p of projects) {
    if (!fs.existsSync(p.vercelJson)) continue;
    try {
      const cfg = JSON.parse(fs.readFileSync(p.vercelJson, 'utf-8'));
      for (const c of cfg.crons ?? []) {
        out.push({
          slug: p.slug,
          path: c.path,
          schedule: c.schedule,
          source: p.vercelJson,
        });
      }
    } catch (e) {
      console.error(`  Failed to parse ${p.vercelJson}:`, e.message);
    }
  }
  return out;
}

// ---------- APScheduler scrape (text-based, conservative) ----------
function listAPSchedulerJobs() {
  const out = [];
  const schedFile = path.join(AI_FOLDER, 'Merchant_Services', 'src', 'scheduler.py');
  if (!fs.existsSync(schedFile)) return out;
  const src = fs.readFileSync(schedFile, 'utf-8');
  // Match `id="job_id"` lines preceded by `add_job(` within ~10 lines
  const idRe = /add_job\(([\s\S]*?)id\s*=\s*["']([^"']+)["']([\s\S]*?)\)/g;
  let m;
  while ((m = idRe.exec(src))) {
    const block = m[0];
    const jobId = m[2];
    let trigger = 'unknown';
    if (/IntervalTrigger\(\s*minutes\s*=/.test(block)) trigger = 'interval (minutes)';
    else if (/IntervalTrigger\(\s*hours\s*=/.test(block)) trigger = 'interval (hours)';
    else if (/IntervalTrigger\(/.test(block)) trigger = 'interval';
    else if (/DateTrigger\(/.test(block)) trigger = 'one-shot';
    else if (/CronTrigger\(/.test(block)) trigger = 'cron';
    // Disabled detection: surrounding function early-returns
    let enabled = true;
    if (jobId.includes('telegram')) {
      // Check if add_digest_job has the DISABLED early-return marker
      if (src.includes('Telegram digest job DISABLED')) enabled = false;
    }
    out.push({ jobId, trigger, enabled });
  }
  return out;
}

// ---------- Upsert ----------
async function upsert(row) {
  // external_key is the dedupe field
  const { data: existing } = await sb
    .from('operations')
    .select('id')
    .eq('external_key', row.external_key)
    .maybeSingle();
  if (existing) {
    const { error } = await sb.from('operations').update(row).eq('id', existing.id);
    if (error) throw new Error(`update ${row.external_key}: ${error.message}`);
    return { id: existing.id, mode: 'updated' };
  } else {
    const { data, error } = await sb.from('operations').insert(row).select().single();
    if (error) throw new Error(`insert ${row.external_key}: ${error.message}`);
    return { id: data.id, mode: 'inserted' };
  }
}

// ---------- Auto-blocker ----------
async function ensureBlockerFor(op) {
  const blockerKey = `BLOCKER:${op.external_key}`;
  const { data: existing } = await sb
    .from('operations')
    .select('id, blocker_state')
    .eq('external_key', blockerKey)
    .maybeSingle();

  if (op.health_state === 'red') {
    if (existing && existing.blocker_state === 'open') return; // already open
    await upsert({
      title: `JOB FAILING: ${op.title}`,
      project_id: op.project_id,
      category: 'BLOCKER',
      subtype: 'job-failure',
      owner: 'system',
      enabled: true,
      status: 'open',
      blocker_state: 'open',
      due_at: new Date().toISOString(),
      output_target: 'mc-dashboard',
      code_path: op.code_path,
      health_state: 'red',
      notes: `Auto-created by sync-operations. Last error context: ${op.notes ?? '(none)'}`,
      created_from: 'auto-blocker',
      external_key: blockerKey,
      source_path: op.source_path,
    });
  } else if (op.health_state === 'green' && existing && existing.blocker_state === 'open') {
    // Auto-resolve
    await sb
      .from('operations')
      .update({ blocker_state: 'resolved', status: 'resolved', notes: 'Auto-resolved: job is green again' })
      .eq('id', existing.id);
  }
}

// ---------- Main ----------
async function main() {
  console.log('Mission Control: sync-operations starting...');
  await loadProjectMap();

  let ops = [];

  // 1) launchd
  for (const j of listLaunchdJobs()) {
    if (!j.label.startsWith('com.henry') && !j.label.startsWith('com.themrktdrop') &&
        !j.label.startsWith('com.merchantleads') && !j.label.startsWith('com.kate') &&
        !j.label.startsWith('ai.openclaw') && !j.label.startsWith('com.claudeclaw') &&
        !j.label.startsWith('com.paydirect') && !j.label.startsWith('com.mc')) continue;
    const plist = readPlist(j.label);
    const slug = classifyLaunchdLabel(j.label, plist);
    const codePath = (plist?.argv || []).find((a) => a.startsWith('/Users/')) || null;
    const op = {
      title: j.label,
      project_id: projectIdFor(slug),
      category: 'MACHINE_JOB',
      subtype: 'launchd',
      cadence: plist?.cadence || 'unknown',
      owner: 'system',
      enabled: true,
      status: statusFromExit(j.lastExit, j.pid),
      output_target: 'launchd',
      code_path: codePath,
      health_state: healthFromExit(j.lastExit, j.label),
      notes: `pid=${j.pid ?? '—'} last_exit=${j.lastExit ?? '—'}`,
      created_from: 'launchd',
      source_path: path.join(HOME, 'Library', 'LaunchAgents', `${j.label}.plist`),
      external_key: `launchd:${j.label}`,
      last_error: (j.lastExit && j.lastExit !== 0 && j.lastExit !== -15) ? `exit ${j.lastExit}` : null,
    };
    ops.push(op);
  }

  // 2) Vercel crons
  for (const c of listVercelCrons()) {
    ops.push({
      title: c.path,
      project_id: projectIdFor(c.slug),
      category: 'MACHINE_JOB',
      subtype: 'vercel-cron',
      cadence: c.schedule,
      owner: 'system',
      enabled: true,
      status: 'idle', // Vercel doesn't expose last-run via static config
      output_target: 'vercel',
      code_path: c.path,
      health_state: 'unknown',
      notes: 'Vercel cron from vercel.json. Run history requires Vercel API check.',
      created_from: 'vercel.json',
      source_path: c.source,
      external_key: `vercel:${c.slug}:${c.path}:${c.schedule}`,
    });
  }

  // 3) APScheduler
  for (const j of listAPSchedulerJobs()) {
    ops.push({
      title: `apscheduler:${j.jobId}`,
      project_id: projectIdFor('merchant-lead-hunter'),
      category: 'MACHINE_JOB',
      subtype: 'apscheduler',
      cadence: j.trigger,
      owner: 'system',
      enabled: j.enabled,
      status: j.enabled ? 'running' : 'disabled',
      output_target: j.jobId.includes('telegram') ? 'telegram (RETIRED)' : 'db',
      code_path: 'Merchant_Services/src/scheduler.py',
      health_state: j.enabled ? 'unknown' : 'green',
      notes: j.enabled
        ? 'Runs inside com.merchantleads.scraper Python process'
        : 'DISABLED in code per Kate\'s no-Telegram rule',
      created_from: 'apscheduler-source',
      source_path: 'Merchant_Services/src/scheduler.py',
      external_key: `apscheduler:${j.jobId}`,
    });
  }

  // Upsert all
  let upserts = { inserted: 0, updated: 0 };
  for (const op of ops) {
    try {
      const { mode } = await upsert(op);
      upserts[mode]++;
      // Auto-blocker pass
      await ensureBlockerFor(op);
    } catch (e) {
      console.error(`  ✗ ${op.external_key}: ${e.message}`);
    }
  }

  console.log(`\nSynced ${ops.length} operations: ${upserts.inserted} inserted, ${upserts.updated} updated.`);
  // Summary by health
  const byHealth = ops.reduce((acc, o) => { acc[o.health_state] = (acc[o.health_state] || 0) + 1; return acc; }, {});
  console.log('Health:', byHealth);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
