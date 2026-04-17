#!/usr/bin/env node
/**
 * Mission Control Data Migration Script
 * Migrates data from SQLite to Supabase
 */
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://docfgldavgoqwkyfmzcd.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvY2ZnbGRhdmdvcXdreWZtemNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQxMjgsImV4cCI6MjA5MjAxMDEyOH0.XF2vdRGs4NWuZp1nIcZtdK4fX6U3XFb_SRxvyQG2Qvk';

const DB_PATH = path.join(__dirname, '..', 'data', 'mission-control.db');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Project slug mapping from SQLite to Supabase
const PROJECT_MAP = {
  'Merchant Services': 'merchant-lead-hunter',
  'Affiliate Flow': 'mrkt-drop',
  'Personal': 'personal'
};

// Platform to project mapping (based on what makes sense)
const PLATFORM_PROJECT_MAP = {
  1: 'mrkt-drop',        // Pinterest -> Mrkt Drop
  2: 'mrkt-drop',        // SEO/Blog -> Mrkt Drop
  3: 'mrkt-drop',        // Instagram -> Mrkt Drop
  4: 'personal',         // WhatsApp -> Personal
  5: 'mrkt-drop',        // Facebook -> Mrkt Drop
  6: 'mrkt-drop',        // TikTok -> Mrkt Drop
  7: 'personal'          // Twitter/X -> Personal
};

// Status mapping from old to new
const STATUS_MAP = {
  'backlog': 'todo',
  'todo': 'todo',
  'in_progress': 'in_progress',
  'done': 'done',
  'blocked': 'in_progress'
};

async function getProjectsMap() {
  const { data: projects, error } = await supabase.from('projects').select('id, slug');
  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  
  const map = {};
  for (const p of projects) {
    map[p.slug] = p.id;
  }
  return map;
}

async function migrateProjects(db) {
  console.log('\n📁 Migrating projects...');
  
  const oldProjects = db.prepare('SELECT * FROM projects').all();
  console.log(`   Found ${oldProjects.length} projects in SQLite`);
  
  // Projects are already seeded in Supabase via setup script
  // Just verify they exist
  const projectsMap = await getProjectsMap();
  
  const expected = ['merchant-lead-hunter', 'mrkt-drop', 'personal'];
  const missing = expected.filter(s => !projectsMap[s]);
  
  if (missing.length > 0) {
    console.log(`   ⚠️ Missing projects: ${missing.join(', ')}`);
    
    // Create missing projects
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
  
  if (oldTasks.length === 0) {
    console.log('   ℹ️ No tasks to migrate');
    return { migrated: 0, skipped: 0 };
  }
  
  // Get existing tasks to avoid duplicates
  const { data: existingTasks } = await supabase.from('tasks').select('title, project_id');
  const existingSet = new Set((existingTasks || []).map(t => `${t.project_id}:${t.title}`));
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const old of oldTasks) {
    const slug = PLATFORM_PROJECT_MAP[old.platform_id] || 'personal';
    const projectId = projectsMap[slug];
    
    if (!projectId) {
      console.log(`   ⚠️ No project for platform ${old.platform_id}, skipping: ${old.title}`);
      skipped++;
      continue;
    }
    
    // Check for duplicates
    const key = `${projectId}:${old.title}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
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
    
    if (error) {
      console.log(`   ❌ Failed to migrate "${old.title}": ${error.message}`);
      errors++;
    } else {
      migrated++;
      existingSet.add(key);
    }
  }
  
  console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
  return { migrated, skipped, errors };
}

async function migrateNotes(db, projectsMap) {
  console.log('\n📒 Migrating notes...');
  
  const oldNotes = db.prepare('SELECT * FROM notes').all();
  console.log(`   Found ${oldNotes.length} notes in SQLite`);
  
  if (oldNotes.length === 0) {
    console.log('   ℹ️ No notes to migrate');
    return { migrated: 0, skipped: 0 };
  }
  
  // Get existing notes to avoid duplicates
  const { data: existingNotes } = await supabase.from('notes').select('title, project_id');
  const existingSet = new Set((existingNotes || []).map(n => `${n.project_id}:${n.title}`));
  
  let migrated = 0;
  let skipped = 0;
  
  for (const old of oldNotes) {
    // Find project slug from old project_id if it exists
    let projectId = null;
    if (old.project_id) {
      // Map old SQLite project_id to slug
      const oldProject = db.prepare('SELECT name FROM projects WHERE id = ?').get(old.project_id);
      if (oldProject) {
        const slug = PROJECT_MAP[oldProject.name] || 'personal';
        projectId = projectsMap[slug] || null;
      }
    }
    
    // Check for duplicates
    const key = `${projectId || 'null'}:${old.title}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
    const newNote = {
      project_id: projectId,
      title: old.title,
      content: old.content || '',
      pinned: old.pinned || false,
      created_at: old.created_at,
      updated_at: old.updated_at
    };
    
    const { error } = await supabase.from('notes').insert(newNote);
    
    if (error) {
      console.log(`   ❌ Failed to migrate note "${old.title}": ${error.message}`);
    } else {
      migrated++;
      existingSet.add(key);
    }
  }
  
  console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
  return { migrated, skipped };
}

async function migrateEvents(db, projectsMap) {
  console.log('\n📅 Migrating events...');
  
  const oldEvents = db.prepare('SELECT * FROM events').all();
  console.log(`   Found ${oldEvents.length} events in SQLite`);
  
  if (oldEvents.length === 0) {
    console.log('   ℹ️ No events to migrate');
    return { migrated: 0, skipped: 0 };
  }
  
  // Get existing events to avoid duplicates
  const { data: existingEvents } = await supabase.from('events').select('title, start_datetime');
  const existingSet = new Set((existingEvents || []).map(e => `${e.title}:${e.start_datetime}`));
  
  let migrated = 0;
  let skipped = 0;
  
  for (const old of oldEvents) {
    // Find project slug from old project_id if it exists
    let projectId = null;
    if (old.project_id) {
      const oldProject = db.prepare('SELECT name FROM projects WHERE id = ?').get(old.project_id);
      if (oldProject) {
        const slug = PROJECT_MAP[oldProject.name] || 'personal';
        projectId = projectsMap[slug] || null;
      }
    }
    
    // Check for duplicates
    const key = `${old.title}:${old.start_datetime}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
    const newEvent = {
      project_id: projectId,
      title: old.title,
      description: old.description || '',
      start_datetime: old.start_datetime,
      end_datetime: old.end_datetime,
      all_day: old.all_day || false,
      recurring: old.recurring,
      color: old.color || '#3B82F6',
      created_at: old.created_at
    };
    
    const { error } = await supabase.from('events').insert(newEvent);
    
    if (error) {
      console.log(`   ❌ Failed to migrate event "${old.title}": ${error.message}`);
    } else {
      migrated++;
      existingSet.add(key);
    }
  }
  
  console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
  return { migrated, skipped };
}

async function main() {
  console.log('🚀 Mission Control Data Migration');
  console.log('=================================');
  
  // Connect to SQLite
  console.log(`\n📂 Connecting to SQLite: ${DB_PATH}`);
  const db = new Database(DB_PATH, { readonly: true });
  
  // Get counts
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
  
  // Migrate
  const projectsMap = await migrateProjects(db);
  const tasksResult = await migrateTasks(db, projectsMap);
  const notesResult = await migrateNotes(db, projectsMap);
  const eventsResult = await migrateEvents(db, projectsMap);
  
  db.close();
  
  // Summary
  console.log('\n=================================');
  console.log('✅ Migration Complete');
  console.log('=================================');
  console.log('\n📊 Results:');
  console.log(`   - Projects verified: 3`);
  console.log(`   - Platform tasks migrated: ${tasksResult.migrated} (skipped: ${tasksResult.skipped})`);
  console.log(`   - Notes migrated: ${notesResult.migrated} (skipped: ${notesResult.skipped})`);
  console.log(`   - Events migrated: ${eventsResult.migrated} (skipped: ${eventsResult.skipped})`);
  
  console.log('\n📝 Total records migrated:', 
    tasksResult.migrated + notesResult.migrated + eventsResult.migrated);
  
  return {
    projects: Object.keys(projectsMap).length,
    tasks: tasksResult,
    notes: notesResult,
    events: eventsResult
  };
}

main()
  .then(result => {
    console.log('\n👍 Migration successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
