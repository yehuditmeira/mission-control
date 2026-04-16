import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MEMORY_DIR = path.join(process.cwd(), '..', 'memory');

export async function GET() {
  try {
    if (!fs.existsSync(MEMORY_DIR)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
    const logs = files.map(filename => {
      const content = fs.readFileSync(path.join(MEMORY_DIR, filename), 'utf-8');
      const isDaily = /^\d{4}-\d{2}-\d{2}\.md$/.test(filename);

      // Parse frontmatter if present
      let name = filename.replace('.md', '');
      let description = '';
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const fm = frontmatterMatch[1];
        const nameMatch = fm.match(/^name:\s*(.+)$/m);
        const descMatch = fm.match(/^description:\s*(.+)$/m);
        if (nameMatch) name = nameMatch[1].trim();
        if (descMatch) description = descMatch[1].trim();
      }

      return {
        filename,
        name,
        description,
        type: isDaily ? 'daily' : 'durable',
        date: isDaily ? filename.replace('.md', '') : null,
        size: content.length,
        preview: content.replace(/^---[\s\S]*?---\n*/, '').slice(0, 200),
      };
    });

    // Sort: daily logs by date desc, then durable files
    logs.sort((a, b) => {
      if (a.type === 'daily' && b.type === 'daily') return (b.date || '').localeCompare(a.date || '');
      if (a.type === 'daily') return -1;
      return 1;
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}
