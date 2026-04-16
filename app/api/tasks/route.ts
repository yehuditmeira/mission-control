import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  const status = searchParams.get('status');

  let query = `
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (projectId && projectId !== 'all') {
    query += ' AND t.project_id = ?';
    params.push(projectId);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.sort_order, t.created_at DESC';

  const tasks = db.prepare(query).all(...params);

  // Attach subtasks to each task
  const subtaskStmt = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order');
  const tasksWithSubtasks = (tasks as Record<string, unknown>[]).map((task) => ({
    ...task,
    subtasks: subtaskStmt.all(task.id),
  }));

  return NextResponse.json(tasksWithSubtasks);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { title, description, project_id, status, priority, author, due_date, start_date } = body;

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM tasks').get() as { max: number | null };
  const sortOrder = (maxOrder.max ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, status, priority, author, due_date, start_date, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || null,
    project_id || null,
    status || 'todo',
    priority || 'medium',
    author || 'user',
    due_date || null,
    start_date || null,
    sortOrder
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(task, { status: 201 });
}
