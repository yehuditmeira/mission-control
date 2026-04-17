import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project');
  const filePath = request.nextUrl.searchParams.get('path');

  if (!project || !filePath) {
    return NextResponse.json({ error: 'Missing project or path' }, { status: 400 });
  }

  const dirName = PROJECT_DIRS[project];
  if (!dirName) {
    return NextResponse.json({ error: 'Unknown project' }, { status: 400 });
  }

  // Prevent path traversal
  const resolved = path.resolve(AI_FOLDER, dirName, filePath);
  if (!resolved.startsWith(path.join(AI_FOLDER, dirName))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }

  try {
    const content = await fs.readFile(resolved, 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
