import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { updates } = body as { updates: { id: number; status: string; sort_order: number }[] };

  if (!updates?.length) {
    return NextResponse.json({ error: 'updates required' }, { status: 400 });
  }

  const stmt = db.prepare("UPDATE tasks SET status = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?");
  const transaction = db.transaction(() => {
    for (const u of updates) {
      stmt.run(u.status, u.sort_order, u.id);
    }
  });
  transaction();

  return NextResponse.json({ ok: true });
}
