import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count;
  const inProgress = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get() as { count: number }).count;
  const totalNotes = (db.prepare('SELECT COUNT(*) as count FROM notes').get() as { count: number }).count;

  // Due this week: tasks with due_date between today and 7 days from now
  const dueThisWeek = (db.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE due_date >= date('now') AND due_date <= date('now', '+7 days') AND status != 'done'"
  ).get() as { count: number }).count;

  return NextResponse.json({
    totalTasks,
    inProgress,
    dueThisWeek,
    totalNotes,
  });
}
