#!/usr/bin/env node
// =====================================================
// SEED MC CONTENT
// One-shot loader for:
//   - PLANNED MACHINE_JOBs Kate explicitly listed (Sara, PZ Deals, Dan's
//     Deals, Between Carpools, PayDirect research)
//   - DOC rows (markdown SOPs / strategies / playbooks across projects)
//   - MILESTONE rows (PayDirect launch, Mrkt Drop platform Gantt, etc.)
//   - RECURRING_WORKFLOW rows (PayDirect Mon-Sat content cadence,
//     Pinterest 10/day, etc.)
// Idempotent — uses external_key for upsert.
// Run: node scripts/seed-mc-content.js
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// project_id resolver
let projectIdMap = {};
async function loadProjectMap() {
  const { data } = await sb.from('projects').select('id, slug');
  for (const p of data ?? []) projectIdMap[p.slug] = p.id;
}
const pid = (slug) => projectIdMap[slug] ?? null;

async function upsert(row) {
  const { data: existing } = await sb
    .from('operations')
    .select('id')
    .eq('external_key', row.external_key)
    .maybeSingle();
  if (existing) {
    const { error } = await sb.from('operations').update(row).eq('id', existing.id);
    if (error) throw new Error(`update ${row.external_key}: ${error.message}`);
    return 'updated';
  }
  const { error } = await sb.from('operations').insert(row);
  if (error) throw new Error(`insert ${row.external_key}: ${error.message}`);
  return 'inserted';
}

// ============================================================
// 1) PLANNED MACHINE JOBS (Kate's explicit per-project rules)
// ============================================================
const PLANNED = [
  // Mrkt Drop scrapers Kate said should exist
  {
    title: 'Sara scrape — daily',
    slug: 'mrkt-drop',
    notes: 'Kate rule: machine job, fully automatic daily. Output: products → triage queue. NOT IMPLEMENTED YET — scaffold needed.',
    cadence: 'daily',
    external_key: 'planned:mrkt-drop:sara-scrape',
  },
  {
    title: 'PZ Deals scrape',
    slug: 'mrkt-drop',
    notes: 'Kate rule: machine job. Output: products → triage queue. NOT IMPLEMENTED YET.',
    cadence: 'daily',
    external_key: 'planned:mrkt-drop:pz-deals-scrape',
  },
  {
    title: "Dan's Deals scrape",
    slug: 'mrkt-drop',
    notes: 'Kate rule: machine job. Output: products → triage queue. NOT IMPLEMENTED YET.',
    cadence: 'daily',
    external_key: 'planned:mrkt-drop:dans-deals-scrape',
  },
  {
    title: 'Between Carpools — voice + product + content extractor',
    slug: 'mrkt-drop',
    notes: "Kate rule: read for voice, extract ideas, identify aligned products → product candidates to triage, content ideas → SEO/blog queue. NOT IMPLEMENTED YET. Source analysis: Affiliate_Flow/Platforms/between-carpools-analysis.md",
    cadence: 'daily',
    external_key: 'planned:mrkt-drop:between-carpools',
  },
  // PayDirect research jobs
  {
    title: 'PayDirect research: Stripe pain on Reddit',
    slug: 'paydirect',
    notes: 'Kate rule: research-only machine job. Daily research log → MC docs.',
    cadence: 'daily',
    external_key: 'planned:paydirect:research-stripe-pain',
  },
  {
    title: 'PayDirect research: Lovable AI app comments',
    slug: 'paydirect',
    notes: 'Kate rule: comment scanner on Lovable AI generated apps for payment friction signals.',
    cadence: 'daily',
    external_key: 'planned:paydirect:research-lovable-ai',
  },
  {
    title: 'PayDirect research: Reddit + FB + dev community payment integration complaints',
    slug: 'paydirect',
    notes: 'Kate rule: scan dev communities for payment integration complaints. Output: daily research brief in MC docs.',
    cadence: 'daily',
    external_key: 'planned:paydirect:research-dev-community',
  },
  // Top-10 retailer lists Kate flagged as TODOs (these are workflows-becoming-jobs)
  {
    title: 'Define "Top 10 retailers for new dresses/skirts" list',
    slug: 'mrkt-drop',
    notes: 'Kate rule: NOT a machine job yet. Operational TODO to define the exact list. Once defined, becomes scrape target list.',
    cadence: 'one-shot',
    external_key: 'planned:mrkt-drop:define-top-10-dresses',
  },
  {
    title: 'Define "Top 10 kids matching" retailer list',
    slug: 'mrkt-drop',
    notes: 'Kate rule: same as above for kids matching outfits.',
    cadence: 'one-shot',
    external_key: 'planned:mrkt-drop:define-top-10-kids',
  },
];

async function seedPlannedJobs() {
  let n = 0;
  for (const p of PLANNED) {
    await upsert({
      title: p.title,
      project_id: pid(p.slug),
      category: 'MACHINE_JOB',
      subtype: 'planned',
      cadence: p.cadence,
      owner: 'system',
      enabled: false,
      status: 'planned',
      output_target: 'mc-dashboard',
      health_state: 'unknown',
      notes: p.notes,
      created_from: 'kate-rule',
      external_key: p.external_key,
    });
    n++;
  }
  console.log(`  ✓ ${n} planned machine jobs upserted`);
}

// ============================================================
// 2) DOCS (markdown SOPs/plans/strategies)
// ============================================================
const DOC_PATTERNS = [
  // Mrkt Drop
  { glob: 'Affiliate_Flow/Platforms', recurse: true, slug: 'mrkt-drop', subtype: 'platform-sop' },
  { glob: 'Affiliate_Flow/.planning', recurse: false, slug: 'mrkt-drop', subtype: 'project-state' },
  // PayDirect
  { glob: 'paydirect', recurse: false, slug: 'paydirect', subtype: 'strategy' },
  { glob: 'paydirect/marketing', recurse: true, slug: 'paydirect', subtype: 'marketing' },
  { glob: 'paydirect/docs', recurse: true, slug: 'paydirect', subtype: 'docs' },
  { glob: 'paydirect/planning', recurse: false, slug: 'paydirect', subtype: 'project-state' },
  // Merchant Services
  { glob: 'Merchant_Services/.planning', recurse: false, slug: 'merchant-lead-hunter', subtype: 'project-state' },
  // Personal assistant
  { glob: 'personal-assistant/.planning', recurse: false, slug: 'personal-assistant', subtype: 'project-state' },
];

function walkMd(dir, recurse, maxDepth = 3, depth = 0) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recurse && depth < maxDepth && !['node_modules', '.git', '.next', '.venv', 'dist', 'build'].includes(entry.name)) {
        out.push(...walkMd(full, recurse, maxDepth, depth + 1));
      }
    } else if (/\.(md|pdf|pptx|key)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function describeDoc(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.md') return { title: path.basename(file), summary: `(${ext.slice(1).toUpperCase()} file)` };
  try {
    const text = fs.readFileSync(file, 'utf-8');
    // First H1 or first non-empty line as title
    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(file, '.md');
    // Summary: first paragraph after the H1
    const lines = text.split('\n').slice(0, 50);
    let summary = '';
    for (const line of lines.slice(1)) {
      if (line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
        summary = line.trim();
        if (summary.length > 200) summary = summary.slice(0, 200) + '…';
        break;
      }
    }
    return { title, summary };
  } catch {
    return { title: path.basename(file), summary: '(unreadable)' };
  }
}

async function seedDocs() {
  let n = 0;
  for (const pattern of DOC_PATTERNS) {
    const dir = path.join(AI_FOLDER, pattern.glob);
    const files = walkMd(dir, pattern.recurse);
    for (const f of files) {
      const meta = describeDoc(f);
      const relPath = path.relative(AI_FOLDER, f);
      const stat = fs.statSync(f);
      await upsert({
        title: meta.title,
        project_id: pid(pattern.slug),
        category: 'DOC',
        subtype: pattern.subtype,
        owner: 'kate',
        enabled: true,
        status: 'available',
        output_target: 'docs-library',
        code_path: f,
        source_path: relPath,
        notes: meta.summary,
        created_from: 'docs-importer',
        external_key: `doc:${relPath}`,
        last_run_at: stat.mtime.toISOString(),
      });
      n++;
    }
  }
  console.log(`  ✓ ${n} docs upserted`);
}

// ============================================================
// 3) MILESTONES (date-anchored goals)
// ============================================================
const MILESTONES = [
  { title: 'PayDirect public launch', slug: 'paydirect', due: '2026-04-22', notes: 'Week 1 Monday thread goes live. Source: paydirect/marketing/launch-day-sequence.md' },
  { title: 'Mrkt Drop: Pinterest rollout begins', slug: 'mrkt-drop', due: '2026-04-21', notes: 'Week 1 of 16-week multi-platform plan. 5 boards live, 10 pins/day target.' },
  { title: 'Mrkt Drop: Pinterest autonomous', slug: 'mrkt-drop', due: '2026-05-19', notes: 'Pinterest fully automated per MASTER_GANTT_TIMELINE.' },
  { title: 'Mrkt Drop: SEO/Blog setup begins', slug: 'mrkt-drop', due: '2026-04-28', notes: 'Week 2 of staggered rollout.' },
  { title: 'Mrkt Drop: SEO/Blog autonomous', slug: 'mrkt-drop', due: '2026-05-26', notes: 'Week 6.' },
  { title: 'Mrkt Drop: Instagram setup begins', slug: 'mrkt-drop', due: '2026-05-05', notes: 'Week 3.' },
  { title: 'Mrkt Drop: Instagram autonomous', slug: 'mrkt-drop', due: '2026-06-02', notes: 'Week 7.' },
  { title: 'Mrkt Drop: WhatsApp setup begins', slug: 'mrkt-drop', due: '2026-05-12', notes: 'Week 4.' },
  { title: 'Mrkt Drop: WhatsApp autonomous', slug: 'mrkt-drop', due: '2026-06-09', notes: 'Week 8.' },
  { title: 'Mrkt Drop: Facebook setup begins', slug: 'mrkt-drop', due: '2026-05-19', notes: 'Week 5.' },
  { title: 'Mrkt Drop: Facebook autonomous', slug: 'mrkt-drop', due: '2026-06-16', notes: 'Week 9.' },
  { title: 'Mrkt Drop: TikTok setup begins', slug: 'mrkt-drop', due: '2026-05-26', notes: 'Week 6.' },
  { title: 'Mrkt Drop: TikTok autonomous', slug: 'mrkt-drop', due: '2026-06-23', notes: 'Week 10.' },
  { title: 'Mrkt Drop: Twitter/X setup begins', slug: 'mrkt-drop', due: '2026-06-02', notes: 'Week 7.' },
  { title: 'Mrkt Drop: Twitter/X autonomous', slug: 'mrkt-drop', due: '2026-06-30', notes: 'Week 11.' },
  { title: 'Mrkt Drop: All 7 platforms autonomous', slug: 'mrkt-drop', due: '2026-08-01', notes: 'End of 16-week plan.' },
];

async function seedMilestones() {
  let n = 0;
  for (const m of MILESTONES) {
    await upsert({
      title: m.title,
      project_id: pid(m.slug),
      category: 'MILESTONE',
      subtype: 'plan-derived',
      owner: 'kate',
      enabled: true,
      status: new Date(m.due) < new Date() ? 'past' : 'upcoming',
      due_at: new Date(m.due + 'T12:00:00Z').toISOString(),
      output_target: 'mc-dashboard',
      notes: m.notes,
      created_from: 'milestones-seed',
      external_key: `milestone:${m.slug}:${m.title}`,
    });
    n++;
  }
  console.log(`  ✓ ${n} milestones upserted`);
}

// ============================================================
// 4) RECURRING WORKFLOWS (commitments not-yet-machine)
// ============================================================
const WORKFLOWS = [
  // PayDirect content cadence (Typefully-scheduled but human-driven for now)
  { title: 'PayDirect weekly major thread', slug: 'paydirect', cadence: 'every Mon 9am ET', notes: 'X/Twitter major thread launching biggest item. Source: paydirect/marketing/content-calendar/posting-plan.md' },
  { title: 'PayDirect progress tweet', slug: 'paydirect', cadence: 'every Tue 12pm ET', notes: 'Single progress tweet with screenshot.' },
  { title: 'PayDirect Wednesday tutorial post', slug: 'paydirect', cadence: 'every Wed 10am ET', notes: 'Dev.to / Hashnode tutorial cross-post.' },
  { title: 'PayDirect hot-take tweet', slug: 'paydirect', cadence: 'every Thu 11am ET', notes: 'Engagement / opinion tweet.' },
  { title: 'PayDirect Substack post', slug: 'paydirect', cadence: 'every Fri 8am ET', notes: 'Long-form weekly. Share on Twitter after publish.' },
  { title: 'PayDirect Saturday short video', slug: 'paydirect', cadence: 'every Sat 11am ET', notes: 'YouTube + TikTok + IG Reels under 60s. Husband films.' },
  { title: 'PayDirect weekly content gen', slug: 'paydirect', cadence: 'every Fri 60min', notes: '~45-60 min checklist run. Source: marketing/content-calendar/weekly-checklist.md' },
  // Mrkt Drop Pinterest cadence (manual until autonomous)
  { title: 'Mrkt Drop: 10 pins per day', slug: 'mrkt-drop', cadence: 'daily', notes: 'Manual until Pinterest goes autonomous May 19. Tools: Tailwind, Canva. Peak days Thu + Sun.' },
];

async function seedWorkflows() {
  let n = 0;
  for (const w of WORKFLOWS) {
    await upsert({
      title: w.title,
      project_id: pid(w.slug),
      category: 'RECURRING_WORKFLOW',
      subtype: 'content-cadence',
      cadence: w.cadence,
      owner: 'kate',
      enabled: true,
      status: 'active',
      output_target: 'manual',
      notes: w.notes,
      created_from: 'kate-cadence',
      external_key: `workflow:${w.slug}:${w.title}`,
    });
    n++;
  }
  console.log(`  ✓ ${n} recurring workflows upserted`);
}

async function main() {
  console.log('Seeding Mission Control content...');
  await loadProjectMap();
  await seedPlannedJobs();
  await seedDocs();
  await seedMilestones();
  await seedWorkflows();
  console.log('\nDone.');
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
