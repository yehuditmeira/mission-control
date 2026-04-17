import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const AI_FOLDER = path.join(process.env.HOME || '', 'Desktop', 'AI_Folder');

// Map mission-control project IDs to filesystem directories
const PROJECT_DIRS: Record<string, string> = {
  'affiliate-flow': 'Affiliate_Flow',
  'lead-hunter': 'Merchant_Services',
  'paydirect': 'paydirect',
  'personal-assistant': 'personal-assistant',
};

type PhaseInfo = {
  id: string;
  name: string;
};

type ProjectSync = {
  project_id: string;
  current_phase: number | null;
  current_phase_name: string | null;
  milestone: string | null;
  milestone_name: string | null;
  status: string | null;
  total_phases: number;
  completed_phases: number;
  percent: number;
  phase_list: PhaseInfo[];
  last_updated: string | null;
  has_planning: boolean;
};

/** Parse YAML frontmatter between --- delimiters */
function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');

  let currentKey: string | null = null;
  let nested: Record<string, unknown> | null = null;

  for (const line of lines) {
    // Nested key (indented)
    if (line.startsWith('  ') && currentKey) {
      const kv = line.trim().match(/^(\w+):\s*(.+)$/);
      if (kv && nested) {
        nested[kv[1]] = parseYamlValue(kv[2]);
      }
      continue;
    }

    // Top-level key
    const topMatch = line.match(/^(\w+):\s*(.*)$/);
    if (topMatch) {
      // Save previous nested object
      if (currentKey && nested) {
        result[currentKey] = nested;
      }

      const [, key, rawVal] = topMatch;
      if (rawVal === '' || rawVal === undefined) {
        // Start of nested object
        currentKey = key;
        nested = {};
      } else {
        currentKey = null;
        nested = null;
        result[key] = parseYamlValue(rawVal);
      }
    }
  }

  // Save last nested object
  if (currentKey && nested) {
    result[currentKey] = nested;
  }

  return result;
}

function parseYamlValue(raw: string): string | number | boolean {
  // Remove surrounding quotes
  const trimmed = raw.replace(/^["']|["']$/g, '').trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

/** Extract current phase name from markdown body */
function extractCurrentPhaseName(content: string): string | null {
  // Look for "Active phase: Phase N — Name" pattern
  const match = content.match(/\*{0,2}Active phase:\*{0,2}\s*Phase\s*\d+\s*[—–-]\s*(.+)/i);
  if (match) return match[1].trim();

  // Look for "Phase: N of N (Name)" pattern
  const match2 = content.match(/Phase:\s*\d+\s*of\s*\d+\s*\((.+?)\)/i);
  if (match2) return match2[1].trim();

  return null;
}

/** List phase directories and parse their names */
async function listPhases(projectDir: string): Promise<PhaseInfo[]> {
  const phasesDir = path.join(projectDir, '.planning', 'phases');
  try {
    const entries = await fs.readdir(phasesDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && /^\d/.test(e.name))
      .map((e) => {
        const parts = e.name.split('-');
        const id = parts[0]; // e.g., "01", "13.1"
        const name = parts.slice(1).join(' ').replace(/-/g, ' ');
        return { id, name };
      })
      .sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
  } catch {
    return [];
  }
}

async function syncProject(projectId: string): Promise<ProjectSync> {
  const dirName = PROJECT_DIRS[projectId];
  const projectDir = path.join(AI_FOLDER, dirName);

  const base: ProjectSync = {
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

  // Check if .planning exists
  try {
    await fs.access(path.join(projectDir, '.planning'));
    base.has_planning = true;
  } catch {
    // Check if project dir exists at all
    try {
      await fs.access(projectDir);
    } catch {
      return base;
    }
    return base;
  }

  // Read STATE.md
  try {
    const stateContent = await fs.readFile(
      path.join(projectDir, '.planning', 'STATE.md'),
      'utf-8'
    );
    const fm = parseFrontmatter(stateContent);
    const progress = fm.progress as Record<string, unknown> | undefined;

    base.milestone = (fm.milestone as string) ?? null;
    base.milestone_name = (fm.milestone_name as string) ?? null;
    base.status = (fm.status as string) ?? null;
    base.last_updated = (fm.last_updated as string) ?? null;
    base.current_phase = (fm.current_phase as number) ?? null;
    base.current_phase_name = extractCurrentPhaseName(stateContent);

    if (progress) {
      base.total_phases = (progress.total_phases as number) ?? 0;
      base.completed_phases = (progress.completed_phases as number) ?? 0;
      base.percent = (progress.percent as number) ?? 0;
    }

    // Fallback: extract from markdown body if frontmatter is missing
    if (!base.milestone_name) {
      // Match "Milestone v1.1 — Phase 7: Name" or "Milestone v1.4 — Name"
      const mMatch = stateContent.match(/Milestone\s+(v[\d.]+)\s*[—–-]\s*(?:Phase\s*\d+[:\s]*)?(.+)/i);
      if (mMatch) {
        base.milestone = mMatch[1];
        base.milestone_name = mMatch[2].trim();
      }
    }
    if (base.current_phase === null) {
      const pMatch = stateContent.match(/Phase:\s*(\d+)\s*of\s*(\d+)/i);
      if (pMatch) {
        base.current_phase = parseInt(pMatch[1]);
        if (base.total_phases === 0) base.total_phases = parseInt(pMatch[2]);
      }
    }
    if (!base.status) {
      const sMatch = stateContent.match(/Status:\s*(.+)/i);
      if (sMatch) base.status = sMatch[1].trim();
    }
    if (!base.last_updated) {
      const aMatch = stateContent.match(/Last activity:\s*([\d-]+)/i);
      if (aMatch) base.last_updated = aMatch[1];
    }
  } catch {
    // No STATE.md — that's fine
  }

  // List phases
  base.phase_list = await listPhases(projectDir);

  // If total_phases wasn't in frontmatter, derive from phase_list
  if (base.total_phases === 0 && base.phase_list.length > 0) {
    base.total_phases = base.phase_list.length;
  }

  return base;
}

export async function GET() {
  const projectIds = Object.keys(PROJECT_DIRS);
  const results = await Promise.all(projectIds.map(syncProject));

  return NextResponse.json({
    synced_at: new Date().toISOString(),
    projects: results,
  });
}
