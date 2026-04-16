// =====================================================
// SEED PLATFORMS - Initialize 7 Social Media Platform Records
// Run: node scripts/seed-platforms.js
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'mission-control.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema updates
const schemaPath = path.join(__dirname, '..', 'lib', 'schema-updates.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('✅ Schema updates applied');
}

// =====================================================
// 7 PLATFORM DEFINITIONS
// =====================================================

const platforms = [
  {
    slug: 'pinterest',
    name: 'Pinterest',
    description: 'Visual discovery platform - foundation for frum tznius fashion content',
    priority: 1,
    status: 'pending',
    phase: 1,
    start_date: '2026-04-21',
    autonomous_target_date: '2026-05-19',
    config: JSON.stringify({
      boards: ['Shabbos Outfit Ideas', 'Tznius Workwear', 'Modest Wedding Guest Dresses', 'Simcha Style', 'Family Matching Outfits'],
      daily_pin_target: 10,
      peak_days: ['Thursday', 'Sunday'],
      tools: ['Tailwind', 'Canva']
    })
  },
  {
    slug: 'seo-blog',
    name: 'SEO / Blog',
    description: 'Organic content foundation - blog posts and SEO optimization',
    priority: 2,
    status: 'pending',
    phase: 1,
    start_date: '2026-04-28',
    autonomous_target_date: '2026-05-26',
    config: JSON.stringify({
      post_types: ['roundup', 'gift_guide', 'style_guide', 'deal_alert'],
      weekly_post_target: 2,
      tools: ['Next.js', 'Google Analytics']
    })
  },
  {
    slug: 'instagram',
    name: 'Instagram',
    description: 'Visual storytelling - Reels, Stories, and feed posts',
    priority: 3,
    status: 'pending',
    phase: 1,
    start_date: '2026-05-05',
    autonomous_target_date: '2026-06-02',
    config: JSON.stringify({
      content_types: ['reel', 'story', 'carousel', 'static'],
      daily_post_target: 2,
      tools: ['Later', 'Canva']
    })
  },
  {
    slug: 'whatsapp',
    name: 'WhatsApp',
    description: 'Broadcast channel for deal alerts and community engagement',
    priority: 4,
    status: 'pending',
    phase: 1,
    start_date: '2026-05-12',
    autonomous_target_date: '2026-06-09',
    config: JSON.stringify({
      channel_type: 'broadcast',
      daily_update_target: 1,
      tools: ['WhatsApp Business API']
    })
  },
  {
    slug: 'facebook',
    name: 'Facebook',
    description: 'Groups and page for community building',
    priority: 5,
    status: 'pending',
    phase: 1,
    start_date: '2026-05-19',
    autonomous_target_date: '2026-06-16',
    config: JSON.stringify({
      content_types: ['group_post', 'page_post'],
      weekly_post_target: 3,
      tools: ['Buffer']
    })
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    description: 'Short-form video - growing frum presence',
    priority: 6,
    status: 'pending',
    phase: 1,
    start_date: '2026-05-26',
    autonomous_target_date: '2026-06-23',
    config: JSON.stringify({
      video_types: ['outfit_showcase', 'haul', 'styling_tips'],
      weekly_video_target: 3,
      tools: ['CapCut', 'TikTok Native']
    })
  },
  {
    slug: 'twitter-x',
    name: 'Twitter / X',
    description: 'Real-time updates and deal alerts',
    priority: 7,
    status: 'pending',
    phase: 1,
    start_date: '2026-06-02',
    autonomous_target_date: '2026-06-30',
    config: JSON.stringify({
      tweet_types: ['deal_alert', 'thread', 'engagement'],
      daily_tweet_target: 3,
      tools: ['Buffer']
    })
  }
];

// Insert or update platforms
const insertOrUpdatePlatform = db.prepare(`
  INSERT INTO platforms (slug, name, description, priority, status, phase, start_date, autonomous_target_date, config)
  VALUES (@slug, @name, @description, @priority, @status, @phase, @start_date, @autonomous_target_date, @config)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    description = excluded.description,
    priority = excluded.priority,
    start_date = excluded.start_date,
    autonomous_target_date = excluded.autonomous_target_date,
    config = excluded.config,
    updated_at = datetime('now')
`);

console.log('\n🌱 Seeding platforms...\n');

for (const platform of platforms) {
  insertOrUpdatePlatform.run(platform);
  console.log(`  ${platform.priority}. ${platform.name} (${platform.slug})`);
  console.log(`     Start: ${platform.start_date} → Autonomous: ${platform.autonomous_target_date}`);
}

// =====================================================
// PINTEREST PHASE 1 TASKS (Generated from GSD_PHASES.md)
// =====================================================

const pinterestPhase1Tasks = [
  { task_number: '1.1', title: 'Convert to Pinterest Business Account', can_automate: 0, deliverable_type: 'screenshot' },
  { task_number: '1.2', title: 'Verify themrktdrop.com for Rich Pins', can_automate: 0, deliverable_type: 'screenshot', depends_on: '1.1' },
  { task_number: '1.3', title: 'Optimize profile: name, bio, branded image', can_automate: 1, deliverable_type: 'screenshot' },
  { task_number: '1.4', title: 'Research 20 frum-specific keywords', can_automate: 1, deliverable_type: 'file' },
  { task_number: '1.5', title: 'Research 15 long-tail tznius keywords', can_automate: 1, deliverable_type: 'file', depends_on: '1.4' },
  { task_number: '1.6', title: 'Create 10 keyword-optimized boards', can_automate: 1, deliverable_type: 'file' },
  { task_number: '1.7', title: 'Write FTC disclosure templates', can_automate: 1, deliverable_type: 'file' },
  { task_number: '1.8', title: 'Install Tailwind browser extension', can_automate: 0, deliverable_type: 'screenshot' },
  { task_number: '1.9', title: 'Audit 5 competitor accounts', can_automate: 1, deliverable_type: 'file' },
  { task_number: '1.10', title: 'Set up Pinterest Analytics + UTM template', can_automate: 1, deliverable_type: 'file' }
];

const pinterestId = db.prepare('SELECT id FROM platforms WHERE slug = ?').get('pinterest').id;

const insertTask = db.prepare(`
  INSERT INTO platform_tasks (platform_id, phase, task_number, title, can_automate, deliverable_type, depends_on, status)
  VALUES (?, 1, ?, ?, ?, ?, ?, 'backlog')
  ON CONFLICT(platform_id, task_number) DO UPDATE SET
    title = excluded.title,
    can_automate = excluded.can_automate,
    deliverable_type = excluded.deliverable_type,
    depends_on = excluded.depends_on
`);

console.log('\n📝 Seeding Pinterest Phase 1 tasks...\n');

for (const task of pinterestPhase1Tasks) {
  insertTask.run(pinterestId, task.task_number, task.title, task.can_automate, task.deliverable_type, task.depends_on || null);
  const autoBadge = task.can_automate === 2 ? '🤖 FULL' : task.can_automate === 1 ? '🔧 AI' : '👤 MANUAL';
  console.log(`  ${task.task_number}: ${task.title} ${autoBadge}`);
}

// =====================================================
// RECURRING JOBS (Phase 4 automation)
// =====================================================

const recurringJobs = [
  {
    platform_id: pinterestId,
    name: 'Daily Pin Generator',
    description: 'Generate Pinterest pins using local AI',
    job_type: 'content_creation',
    schedule: '0 8 * * *', // 8 AM daily
    script_path: 'scripts/autonomous/pin-generator.js',
    active: 1
  },
  {
    platform_id: pinterestId,
    name: 'Weekly Analytics Report',
    description: 'Compile Pinterest analytics from API',
    job_type: 'analytics',
    schedule: '0 10 * * 0', // 10 AM Sundays
    script_path: 'scripts/autonomous/analytics-report.js',
    active: 1
  },
  {
    platform_id: pinterestId,
    name: 'Keyword Performance Tracker',
    description: 'Update keyword usage and performance metrics',
    job_type: 'analytics',
    schedule: '0 */6 * * *', // Every 6 hours
    script_path: 'scripts/autonomous/keyword-tracker.js',
    active: 1
  }
];

const insertJob = db.prepare(`
  INSERT INTO recurring_jobs (platform_id, name, description, job_type, schedule, script_path, active)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(platform_id, name) DO UPDATE SET
    schedule = excluded.schedule,
    active = excluded.active,
    updated_at = datetime('now')
`);

console.log('\n⚡ Seeding recurring jobs...\n');

for (const job of recurringJobs) {
  insertJob.run(job.platform_id, job.name, job.description, job.job_type, job.schedule, job.script_path, job.active);
  console.log(`  ${job.job_type}: ${job.name}`);
  console.log(`     Schedule: ${job.schedule}`);
}

// =====================================================
// CALENDAR EVENTS
// =====================================================

const calendarEvents = [
  { platform_id: pinterestId, event_type: 'phase_start', title: 'Pinterest Phase 1: Foundation Begins', event_date: '2026-04-21' },
  { platform_id: pinterestId, event_type: 'milestone', title: 'Business Account + Rich Pins Verified', event_date: '2026-04-23' },
  { platform_id: pinterestId, event_type: 'milestone', title: '10 Boards Created + Compliance Ready', event_date: '2026-04-27' },
  { platform_id: pinterestId, event_type: 'phase_start', title: 'Pinterest Phase 2: Content Engine Begins', event_date: '2026-04-28' },
  { platform_id: pinterestId, event_type: 'milestone', title: '50 Pins + Tailwind Active', event_date: '2026-05-11' },
  { platform_id: pinterestId, event_type: 'phase_start', title: 'Pinterest Phase 3: Launch & Optimize', event_date: '2026-05-12' },
  { platform_id: pinterestId, event_type: 'milestone', title: 'Pinterest AUTONOMOUS Achieved', event_date: '2026-05-19' }
];

const insertEvent = db.prepare(`
  INSERT INTO platform_events (platform_id, event_type, title, event_date)
  VALUES (?, ?, ?, ?)
  ON CONFLICT DO NOTHING
`);

console.log('\n📅 Seeding calendar events...\n');

for (const event of calendarEvents) {
  insertEvent.run(event.platform_id, event.event_type, event.title, event.event_date);
  console.log(`  ${event.event_date}: ${event.title}`);
}

// =====================================================
// INITIAL KEYWORDS FOR PINTEREST
// =====================================================

const keywords = [
  { keyword: 'shabbos outfit ideas', category: 'shabbos', intent: 'informational', relevance_score: 10 },
  { keyword: 'tznius dresses', category: 'general', intent: 'transactional', relevance_score: 10 },
  { keyword: 'modest wedding guest dress with sleeves', category: 'simcha', intent: 'transactional', relevance_score: 9 },
  { keyword: 'frum fashion', category: 'general', intent: 'informational', relevance_score: 8 },
  { keyword: 'tznius workwear', category: 'workwear', intent: 'transactional', relevance_score: 9 },
  { keyword: 'modest simcha outfit', category: 'simcha', intent: 'informational', relevance_score: 8 },
  { keyword: 'shabbos robe', category: 'shabbos', intent: 'transactional', relevance_score: 7 },
  { keyword: 'tznius swimwear', category: 'seasonal', intent: 'transactional', relevance_score: 8 },
  { keyword: 'modest maxi skirt outfits', category: 'general', intent: 'informational', relevance_score: 9 },
  { keyword: 'yom tov outfit ideas', category: 'simcha', intent: 'informational', relevance_score: 8 },
  { keyword: 'kallah outfit ideas', category: 'simcha', intent: 'informational', relevance_score: 9 },
  { keyword: 'modest sheva brachot dress', category: 'simcha', intent: 'transactional', relevance_score: 8 },
  { keyword: 'long sleeve modest dress under $50', category: 'deals', intent: 'transactional', relevance_score: 9 },
  { keyword: 'camp pickup outfit ideas', category: 'lifestyle', intent: 'informational', relevance_score: 6 },
  { keyword: 'tichel style ideas', category: 'accessories', intent: 'informational', relevance_score: 7 },
  { keyword: 'family matching shabbos outfits', category: 'family', intent: 'transactional', relevance_score: 10 },
  { keyword: 'tznius summer outfits', category: 'seasonal', intent: 'informational', relevance_score: 8 },
  { keyword: 'modest bar mitzvah guest dress', category: 'simcha', intent: 'transactional', relevance_score: 8 }
];

const insertKeyword = db.prepare(`
  INSERT INTO keywords (platform_id, keyword, category, intent, relevance_score)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT DO NOTHING
`);

console.log('\n🔑 Seeding initial keywords...\n');

for (const kw of keywords) {
  insertKeyword.run(pinterestId, kw.keyword, kw.category, kw.intent, kw.relevance_score);
}
console.log(`  ${keywords.length} keywords added`);

console.log('\n✅ Platform seeding complete!\n');

// Summary
const stats = db.prepare(`
  SELECT 
    (SELECT COUNT(*) FROM platforms) as platforms,
    (SELECT COUNT(*) FROM platform_tasks) as tasks,
    (SELECT COUNT(*) FROM recurring_jobs WHERE active = 1) as jobs,
    (SELECT COUNT(*) FROM keywords) as keywords
`).get();

console.log('📊 Summary:');
console.log(`   Platforms: ${stats.platforms}`);
console.log(`   Tasks: ${stats.tasks}`);
console.log(`   Active Jobs: ${stats.jobs}`);
console.log(`   Keywords: ${stats.keywords}`);

db.close();
