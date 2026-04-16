import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MEMORY_DIR = path.join(process.cwd(), '..', 'memory');

export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename.endsWith('.md') ? params.filename : `${params.filename}.md`;
    const filePath = path.join(MEMORY_DIR, filename);

    // Basic path traversal protection
    if (!filePath.startsWith(MEMORY_DIR)) {
      return NextResponse.json({ error: 'invalid path' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ filename, content });
  } catch {
    return NextResponse.json({ error: 'read error' }, { status: 500 });
  }
}
