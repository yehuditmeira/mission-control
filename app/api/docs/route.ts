import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const AI_FOLDER = path.join(process.env.HOME || '', 'Desktop', 'AI_Folder');

const PROJECT_DIRS: Record<string, string> = {
  'affiliate-flow': 'Affiliate_Flow',
  'lead-hunter': 'Merchant_Services',
  'paydirect': 'paydirect',
  'personal-assistant': 'personal-assistant',
  'mission-control': 'mission-control',
};

export type DocEntry = {
  name: string;
  project: string;
  projectDir: string;
  type: 'readme' | 'planning' | 'research' | 'api' | 'config' | 'doc';
  relativePath: string;
  modifiedAt: string;
  size: number;
};

function classifyDoc(filename: string, relPath: string): DocEntry['type'] {
  const lower = filename.toLowerCase();
  if (lower === 'readme.md') return 'readme';
  if (relPath.includes('.planning')) return 'planning';
  if (lower.includes('research') || lower.includes('r&d')) return 'research';
  if (lower.includes('api') || lower.includes('tech_architecture')) return 'api';
  if (lower.includes('claude') || lower.includes('identity') || lower.includes('soul') || lower.includes('heartbeat') || lower.includes('agents')) return 'config';
  return 'doc';
}

async function scanDir(dirPath: string, baseDir: string, results: { name: string; relativePath: string; modifiedAt: Date; size: number }[]) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;

    if (entry.isDirectory()) {
      // Only go 2 levels deep from project root
      const depth = fullPath.replace(baseDir, '').split(path.sep).filter(Boolean).length;
      if (depth < 3) {
        await scanDir(fullPath, baseDir, results);
      }
    } else if (entry.name.endsWith('.md')) {
      const stat = await fs.stat(fullPath);
      results.push({
        name: entry.name,
        relativePath: path.relative(baseDir, fullPath),
        modifiedAt: stat.mtime,
        size: stat.size,
      });
    }
  }
}

export async function GET() {
  const docs: DocEntry[] = [];

  for (const [projectId, dirName] of Object.entries(PROJECT_DIRS)) {
    const projectPath = path.join(AI_FOLDER, dirName);
    const files: { name: string; relativePath: string; modifiedAt: Date; size: number }[] = [];
    await scanDir(projectPath, projectPath, files);

    for (const file of files) {
      docs.push({
        name: file.name,
        project: projectId,
        projectDir: dirName,
        type: classifyDoc(file.name, file.relativePath),
        relativePath: file.relativePath,
        modifiedAt: file.modifiedAt.toISOString(),
        size: file.size,
      });
    }
  }

  // Sort by most recently modified
  docs.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

  return NextResponse.json(docs);
}
