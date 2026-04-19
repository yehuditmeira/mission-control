// =====================================================
// SYNC TO DB - Read .planning/ phase data from local projects, write to Supabase
// Run: node scripts/sync-to-db.js
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const AI_FOLDER = path.join(process.env.HOME || '', 'Desktop', 'AI_Folder');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Try reading from .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// Map mission-control project IDs to filesystem directories
const PROJECT_DIRS = {
  'affiliate-flow': 'Affiliate_Flow',
  'lead-hunter': 'Merchant_Services',
  'paydirect': 'paydirect',
  'personal-assistant': 'personal-assistant',
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};
  const lines = yaml.split('\n');
  let currentKey = null;
  let nested = null;

  for (const line of lines) {
    if (line.startsWith('  ') && currentKey) {
      const kv = line.trim().match(/^(\w+):\s*(.+)$/);
      if (kv && nested) {
        nested[kv[1]] = parseYamlValue(kv[2]);
      }
      continue;
    }

    const topMatch = line.match(/^(\w+):\s*(.*)$/);
    if (topMatch) {
      if (currentKey && nested) {
        result[currentKey] = nested;
      }

      const [, key, rawVal] = topMatch;
      if (rawVal === '' || rawVal === undefined) {
        currentKey = key;
        nested = {};
      } else {
        currentKey = null;
        nested = null;
        result[key] = parseYamlValue(rawVal);
      }
    }
  }

  if (currentKey && nested) {
    result[currentKey] = nested;
  }

  return result;
}

function parseYamlValue(raw) {
  const trimmed = raw.replace(/^["']|["']$/g, '').trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

function extractCurrentPhaseName(content) {
  const match = content.match(/\*{0,2}Active phase:\*{0,2}\s*Phase\s*\d+\s*[—–-]\s*(.+)/i);
  if (match) return match[1].trim();
  const match2 = content.match(/Phase:\s*\d+\s*of\s*\d+\s*\((.+?)\)/i);
  if (match2) return match2[1].trim();
  return null;
}

// Prefer body text "Active phase: Phase N — name" over frontmatter,
// since frontmatter can drift if the doc was updated by hand.
function extractActivePhaseNumber(content) {
  const m = content.match(/\*{0,2}Active phase:\*{0,2}\s*Phase\s*(\d+(?:\.\d+)?)/i);
  if (m) return parseFloat(m[1]);
  return null;
}

// Some projects (paydirect) use "planning/" without the leading dot.
// Returns the actual planning dir name found, or null.
function findPlanningDir(projectDir) {
  for (const candidate of ['.planning', 'planning']) {
    const p = path.join(projectDir, candidate);
    if (fs.existsSync(p)) return candidate;
  }
  return null;
}

function listPhases(projectDir, planningDirName) {
  const phasesDir = path.join(projectDir, planningDirName, 'phases');
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && /^(\d|phase[-_]?\d)/i.test(e.name))
      .map((e) => {
        // Match either "01-name" or "phase-1-name" or "phase1-name"
        const m = e.name.match(/^(?:phase[-_]?)?(\d+(?:\.\d+)?)[-_](.*)$/i);
        if (!m) return { id: e.name, name: e.name };
        const id = m[1];
        const name = m[2].replace(/[-_]/g, ' ');
        return { id, name };
      })
      .sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
  } catch {
    return [];
  }
}

function syncProject(projectId) {
  const dirName = PROJECT_DIRS[projectId];
  const projectDir = path.join(AI_FOLDER, dirName);

  const data = {
    project_id: projectId,
    current_phase: null,
    current_phase_name: null,
    milestone: null,
    milestone_name: null,
    status: null,
    total_phases: 0,
    completed_phases: 0,
    percent: 0,
    phase_list: [],
    last_updated: null,
    has_planning: false,
  };

  // Check if a planning dir exists (.planning or planning/ — paydirect uses no dot)
  const planningDirName = findPlanningDir(projectDir);
  if (!planningDirName) {
    return data;
  }
  const planningDir = path.join(projectDir, planningDirName);
  data.has_planning = true;

  // Read STATE.md
  const statePath = path.join(planningDir, 'STATE.md');
  try {
    const stateContent = fs.readFileSync(statePath, 'utf-8');
    const fm = parseFrontmatter(stateContent);
    const progress = fm.progress || {};

    data.milestone = fm.milestone || null;
    data.milestone_name = fm.milestone_name || null;
    data.status = fm.status || null;
    data.last_updated = fm.last_updated || null;
    data.current_phase = extractActivePhaseNumber(stateContent) ?? fm.current_phase ?? null;
    data.current_phase_name = extractCurrentPhaseName(stateContent);

    data.total_phases = progress.total_phases || 0;
    data.completed_phases = progress.completed_phases || 0;
    data.percent = progress.percent || 0;

    // Fallback: extract from markdown body
    if (!data.milestone_name) {
      const mMatch = stateContent.match(/Milestone\s+(v[\d.]+)\s*[—–-]\s*(?:Phase\s*\d+[:\s]*)?(.+)/i);
      if (mMatch) {
        data.milestone = mMatch[1];
        data.milestone_name = mMatch[2].trim();
      }
    }
    if (data.current_phase === null) {
      const pMatch = stateContent.match(/Phase:\s*(\d+)\s*of\s*(\d+)/i);
      if (pMatch) {
        data.current_phase = parseInt(pMatch[1]);
        if (data.total_phases === 0) data.total_phases = parseInt(pMatch[2]);
      }
    }
    if (!data.status) {
      const sMatch = stateContent.match(/Status:\s*(.+)/i);
      if (sMatch) data.status = sMatch[1].trim();
    }
    if (!data.last_updated) {
      const aMatch = stateContent.match(/Last activity:\s*([\d-]+)/i);
      if (aMatch) data.last_updated = aMatch[1];
    }
    // Fallback: look for "Last Updated" line (paydirect format)
    if (!data.last_updated) {
      const luMatch = stateContent.match(/Last Updated\s*\n([\d-]+)/i);
      if (luMatch) data.last_updated = luMatch[1];
    }
    // Fallback: look for "All N Phases COMPLETE" (paydirect format)
    if (!data.status) {
      if (/all\s+\d+\s+phases?\s+complete/i.test(stateContent)) {
        data.status = 'Complete';
        const phaseCount = stateContent.match(/all\s+(\d+)\s+phases?\s+complete/i);
        if (phaseCount) {
          data.total_phases = parseInt(phaseCount[1]);
          data.completed_phases = parseInt(phaseCount[1]);
          data.percent = 100;
        }
      }
    }
    // Fallback: extract milestone name from "# ProjectName — Project State" heading
    if (!data.milestone_name) {
      const headingMatch = stateContent.match(/^#\s+(.+?)\s*[—–-]\s*Project State/im);
      if (headingMatch) data.milestone_name = headingMatch[1].trim();
    }
  } catch {
    // No STATE.md
  }

  // List phases
  data.phase_list = listPhases(projectDir, planningDirName);

  if (data.total_phases === 0 && data.phase_list.length > 0) {
    data.total_phases = data.phase_list.length;
  }

  return data;
}

async function main() {
  console.log('Syncing project phases to Supabase...\n');

  const projectIds = Object.keys(PROJECT_DIRS);
  const results = [];

  for (const id of projectIds) {
    const data = syncProject(id);
    results.push(data);

    // Upsert to Supabase
    const { error } = await supabase
      .from('project_sync')
      .upsert({
        ...data,
        phase_list: JSON.stringify(data.phase_list),
        synced_at: new Date().toISOString(),
      }, { onConflict: 'project_id' });

    if (error) {
      console.error(`  ✗ ${id}: ${error.message}`);
    } else {
      const phases = data.phase_list.length;
      const phaseName = data.current_phase_name || 'N/A';
      console.log(`  ✓ ${id}: phase ${data.current_phase || '?'} (${phaseName}), ${phases} phases, ${data.percent}%`);
    }
  }

  console.log(`\nDone. Synced ${results.length} projects at ${new Date().toISOString()}`);
}

main().catch(console.error);
