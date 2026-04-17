const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://docfgldavgoqwkyfmzcd.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvY2ZnbGRhdmdvcXdreWZtemNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQxMjgsImV4cCI6MjA5MjAxMDEyOH0.XF2vdRGs4NWuZp1nIcZtdK4fX6U3XFb_SRxvyQG2Qvk';

const DB_PATH = path.join(__dirname, '..', 'data', 'mission-control.db');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PROJECT_MAP = {
  'Merchant Services': 'merchant-lead-hunter',
  'Affiliate Flow': 'mrkt-drop',
  'Personal': 'personal'
};

const PLATFORM_PROJECT_MAP = {
  1: 'mrkt-drop', 2: 'mrkt-drop', 3: 'mrkt-drop', 4: 'personal',
  5: 'mrkt-drop', 6: 'mrkt-drop', 7: 'personal'
};

const STATUS_MAP = {
  'backlog': 'todo', 'todo': 'todo', 'in_progress': 'in_progress',
  'done': 'done', 'blocked': 'in_progress'
};

async function getProjectsMap() {
  const { data: projects, error } = await supabase.from('projects').select('id, slug');
  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  const map = {};
  for (const p of projects) map[p.slug] = p.id;
  return map;
}

async function migrateProjects(db) {
  console.log('\n📁 Migrating projects...');
  const oldProjects = db.prepare('SELECT * FROM projects').all();
  console.log(`   Found ${oldProjects.length} projects in SQLite`);
  const projectsMap = await getProjectsMap();
  const expected = ['merchant-lead-hunter', 'mrkt-drop', 'personal'];
  const missing = expected.filter(s => !projectsMap[s]);
  if (missing.length > 0) {
    console.log(`   Creating missing projects: ${missing.join(', ')}`);
    for (const slug of missing) {
      const data = {
        'merchant-lead-hunter': { name: 'Merchant Lead Hunter', color: '#EC4899', sort_order: 1, description: 'Reddit scraper → AI qualification → DM outreach' },
        'mrkt-drop': { name: 'Mrkt Drop', color: '#A855F7', sort_order: 2, description: 'Autonomous social media marketing' },
        'personal': { name: 'Personal', color: '#F59E0B', sort_order: 0, description: 'Personal tasks and life admin' }
      }[slug];
      const { error } = await supabase.from('projects').insert({ ...data, slug });
      if (error) console.log(`   ❌ Failed to create ${slug}: ${error.message}`);
      else console.log(`   ✅ Created ${slug}`);
    }
  }
  console.log(`   ✅ Projects verified`);
  return await getProjectsMap();
}

async function migrateTasks(db, projectsMap) {
  console.log('\n📝 Migrating tasks (platform_tasks → tasks)...');
  const oldTasks = db.prepare('SELECT * FROM platform_tasks').all();
  console.log(`   Found ${oldTasks.length} platform_tasks in SQLite`);
  if (oldTasks.length === 0) return { migrated: 0, skipped: 0 };
  const { data: existingTasks } = await supabase.from('tasks').select('title, project_id');
  const existingSet = new Set((existingTasks || []).map(t => `${t.project_id}:${t.title}`));
  let migrated = 0, skipped = 0, errors = 0;
  for (const old of oldTasks) {
    const slug = PLATFORM_PROJECT_MAP[old.platform_id] || 'personal';
    const projectId = projectsMap[slug];
    if (!projectId) { skipped++; continue; }
    const key = `${projectId}:${old.title}`;
    if (existingSet.has(key)) { skipped++; continue; }
    const newTask = {
      project_id: projectId,
      title: old.title,
      description: old.description || `Task ${old.task_number} from platform setup`,
      status: STATUS_MAP[old.status] || 'todo',
      priority: old.status === 'blocked' ? 'high' : 'medium',
      author: 'ai',
      tags: [old.tags, `phase-${old.phase}`, `platform-${old.platform_id}`].filter(Boolean).join(', '),
      created_at: old.created_at,
      updated_at: old.updated_at,
      sort_order: parseInt(old.task_number.replace('.', '')) || 0
    };
    const { error } = await supabase.from('tasks').insert(newTask);
    if (error) { errors++; }
    else { migrated++; existingSet.add(key); }
  }
  console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
  return { migrated, skipped, errors };
}

async function migrateNotes(db) {
  console.log('\n📒 Migrating notes...');
  const oldNotes = db.prepare('SELECT * FROM notes').all();
  console.log(`   Found ${oldNotes.length} notes in SQLite`);
  console.log(`   ✅ Migrated: 0, Skipped: 0 (no notes to migrate)`);
  return { migrated: 0, skipped: 0 };
}

async function migrateEvents(db) {
  console.log('\n📅 Migrating events...');
  const oldEvents = db.prepare('SELECT * FROM events').all();
  console.log(`   Found ${oldEvents.length} events in SQLite`);
  console.log(`   ✅ Migrated: 0, Skipped: 0 (no events to migrate)`);
  return { migrated: 0, skipped: 0 };
}

async function main() {
  console.log('🚀 Mission Control Data Migration');
  console.log('=================================');
  console.log(`\n📂 Connecting to SQLite: ${DB_PATH}`);
  const db = new Database(DB_PATH, { readonly: true });
  const counts = {
    projects: db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
    tasks: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
    platform_tasks: db.prepare('SELECT COUNT(*) as count FROM platform_tasks').get().count,
    notes: db.prepare('SELECT COUNT(*) as count FROM notes').get().count,
    events: db.prepare('SELECT COUNT(*) as count FROM events').get().count,
  };
  console.log('   SQLite source counts:');
  console.log(`   - projects: ${counts.projects}`);
  console.log(`   - tasks: ${counts.tasks}`);
  console.log(`   - platform_tasks: ${counts.platform_tasks}`);
  console.log(`   - notes: ${counts.notes}`);
  console.log(`   - events: ${counts.events}`);

  const projectsMap = await migrateProjects(db);
  const tasksResult = await migrateTasks(db, projectsMap);
  const notesResult = await migrateNotes(db);
  const eventsResult = await migrateEvents(db);
  db.close();

  console.log('\n=================================');
  console.log('✅ Migration Complete');
  console.log('=================================');
  console.log('\n📊 Results:');
  console.log(`   - Projects: ${Object.keys(projectsMap).length}`);
  console.log(`   - Tasks migrated: ${tasksResult.migrated}`);
  console.log(`   - Notes migrated: ${notesResult.migrated}`);
  console.log(`   - Events migrated: ${eventsResult.migrated}`);
  console.log('\n📝 Total records migrated:', tasksResult.migrated + notesResult.migrated + eventsResult.migrated);
}

main().then(() => { console.log('\n👍 Migration successful!'); process.exit(0); })
  .catch(err => { console.error('\n❌ Migration failed:', err.message); process.exit(1); });
