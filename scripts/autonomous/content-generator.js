#!/usr/bin/env node
'use strict';

const path = require('path');
const { execSync } = require('child_process');

// -- Config --
const DB_PATH = path.resolve(__dirname, '../../data/mission-control.db');
const OLLAMA = '/usr/local/bin/ollama';
const MODEL = 'qwen3:8b';

// -- Parse CLI args --
const args = {};
process.argv.slice(2).forEach(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  args[k] = v || true;
});

const platform = args.platform || 'pinterest';
const count = parseInt(args.count, 10) || 5;

// -- DB setup --
const Database = require(path.resolve(__dirname, '../../node_modules/better-sqlite3'));
let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.error('Failed to open database:', err.message);
  process.exit(1);
}

// -- Ollama helper --
function askOllama(prompt) {
  const safePrompt = prompt.replace(/'/g, "'\\''");
  try {
    const output = execSync(`${OLLAMA} run ${MODEL} '${safePrompt}' /no_think`, {
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return output.trim();
  } catch (err) {
    console.error('Ollama error:', err.message);
    return null;
  }
}

// -- Platform prompt builders --
const platformPrompts = {
  pinterest(index) {
    const topics = [
      'Shabbos outfit ideas for women',
      'Tznius workwear for the office',
      'Modest wedding guest dresses',
      'Simcha style for frum women',
      'Tznius swimwear and cover-ups',
      'Modest summer fashion finds under $50',
      'Yom Tov outfit inspiration',
      'Family matching outfit ideas for holidays',
      'Tichel and hair covering style ideas',
      'Modest fashion deals and steals',
    ];
    const topic = topics[index % topics.length];
    return `Generate a Pinterest pin for a tznius/frum fashion affiliate account. Topic: "${topic}". Return ONLY valid JSON with these fields: title (under 100 chars, keyword-rich), description (150-250 chars with 3-5 relevant hashtags), board (one of: "Shabbos Outfit Ideas", "Tznius Workwear", "Modest Wedding Guest Dresses", "Simcha Style", "Tznius Swimwear", "Modest Summer Finds", "Yom Tov Outfit Inspiration", "Family Matching Outfits", "Tichel Styles", "Modest Fashion Deals"). No markdown formatting, just the raw JSON object.`;
  },
  instagram(index) {
    const themes = [
      'Shabbos prep outfit flat lay',
      'Weekday modest office look',
      'Date night tznius style',
      'Summer modest swimwear',
      'Holiday family matching sets',
    ];
    const theme = themes[index % themes.length];
    return `Generate an Instagram post for a modest/frum fashion affiliate account. Theme: "${theme}". Return ONLY valid JSON with: title (short hook under 60 chars), description (caption 150-300 chars with call to action), hashtags (array of 15-20 relevant hashtags). No markdown.`;
  },
  blog(index) {
    const blogTopics = [
      'Best Shabbos outfit ideas for every season',
      'How to build a tznius work wardrobe on a budget',
      'Modest wedding guest dress guide',
      'Yom Tov fashion planning checklist',
      'Tznius swimwear brands you need to know',
    ];
    const topic = blogTopics[index % blogTopics.length];
    return `Generate an SEO blog post outline for a modest fashion blog. Topic: "${topic}". Return ONLY valid JSON with: title (SEO-optimized under 70 chars), meta_description (under 160 chars), keywords (array of 5-8 keywords), outline (array of section headings with brief description for each). No markdown.`;
  },
};

// -- Helpers --
function getPlatformId(slug) {
  const row = db.prepare('SELECT id FROM platforms WHERE slug = ?').get(slug);
  if (!row) {
    console.error(`Platform "${slug}" not found in database. Creating it.`);
    const info = db.prepare(
      'INSERT INTO platforms (slug, name, status, phase) VALUES (?, ?, ?, ?)'
    ).run(slug, slug.charAt(0).toUpperCase() + slug.slice(1), 'setup', 1);
    return info.lastInsertRowid;
  }
  return row.id;
}

function parseJSON(text) {
  // Try to extract JSON from response
  let cleaned = text;
  // Strip markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  // Find first { and last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    return null;
  }
}

function contentTypeForPlatform(slug) {
  const map = { pinterest: 'pin', instagram: 'post', blog: 'blog_post' };
  return map[slug] || 'post';
}

// -- Main --
function main() {
  console.log(`\n=== Content Generator ===`);
  console.log(`Platform: ${platform} | Count: ${count} | Model: ${MODEL}\n`);

  const promptBuilder = platformPrompts[platform];
  if (!promptBuilder) {
    console.error(`Unsupported platform: ${platform}. Use: pinterest, instagram, blog`);
    process.exit(1);
  }

  const platformId = getPlatformId(platform);
  const contentType = contentTypeForPlatform(platform);

  const insertContent = db.prepare(`
    INSERT INTO content_items (platform_id, content_type, title, description, body, status, ai_generated, ai_model, prompt_used)
    VALUES (?, ?, ?, ?, ?, 'draft', 1, ?, ?)
  `);

  // Create a job log entry for this run
  const jobLogInsert = db.prepare(`
    INSERT INTO job_logs (job_id, platform_id, started_at, status, model_used)
    VALUES (0, ?, datetime('now'), 'running', ?)
  `);

  // job_id=0 for ad-hoc runs (no recurring_job)
  let jobLogId;
  try {
    const info = jobLogInsert.run(platformId, MODEL);
    jobLogId = info.lastInsertRowid;
  } catch {
    // job_logs might have FK constraint; skip logging if so
    jobLogId = null;
  }

  let created = 0;
  let errors = 0;
  let totalTokensEstimate = 0;

  for (let i = 0; i < count; i++) {
    const prompt = promptBuilder(i);
    console.log(`[${i + 1}/${count}] Generating ${contentType}...`);

    const raw = askOllama(prompt);
    if (!raw) {
      console.error(`  FAILED: No response from Ollama`);
      errors++;
      continue;
    }

    // Rough token estimate (words * 1.3)
    const tokenEst = Math.round(raw.split(/\s+/).length * 1.3);
    totalTokensEstimate += tokenEst;

    const parsed = parseJSON(raw);
    if (!parsed) {
      console.error(`  FAILED: Could not parse JSON response`);
      console.error(`  Raw (first 200 chars): ${raw.substring(0, 200)}`);
      errors++;
      continue;
    }

    const title = parsed.title || `${platform} content #${i + 1}`;
    const description = parsed.description || parsed.meta_description || '';
    const body = JSON.stringify(parsed, null, 2);

    try {
      insertContent.run(platformId, contentType, title, description, body, MODEL, prompt);
      console.log(`  OK: "${title}"`);
      created++;
    } catch (err) {
      console.error(`  DB ERROR: ${err.message}`);
      errors++;
    }
  }

  // Update job log
  if (jobLogId) {
    try {
      db.prepare(`
        UPDATE job_logs
        SET completed_at = datetime('now'),
            status = ?,
            items_created = ?,
            errors_count = ?,
            tokens_used = ?
        WHERE id = ?
      `).run(errors === count ? 'failed' : 'success', created, errors, totalTokensEstimate, jobLogId);
    } catch { /* ignore */ }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Created: ${created} | Errors: ${errors} | Est. tokens: ${totalTokensEstimate}`);
  console.log(`Done.\n`);
}

main();
