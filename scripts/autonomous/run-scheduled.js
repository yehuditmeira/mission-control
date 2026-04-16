#!/usr/bin/env node
// =====================================================
// SCHEDULED JOB RUNNER
// Cron-friendly entry point - runs jobs that are due
// Usage: node scripts/autonomous/run-scheduled.js [--dry-run]
// =====================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'mission-control.db');

const DRY_RUN = process.argv.includes('--dry-run');

// =====================================================
// CRON PARSER (simple subset)
// =====================================================

function shouldRun(schedule, lastRun, now = new Date()) {
  // Support simple interval: "PT2H" = every 2 hours
  if (schedule.startsWith('P')) {
    if (!lastRun) return true;
    const match = schedule.match(/PT(\d+)H/);
    if (match) {
      const hours = parseInt(match[1]);
      const lastRunTime = new Date(lastRun);
      const hoursSinceLastRun = (now - lastRunTime) / (1000 * 60 * 60);
      return hoursSinceLastRun >= hours;
    }
  }

  // Support "once" - only run if never run
  if (schedule === 'once') {
    return !lastRun;
  }

  // For cron schedules, we'll use a simple check
  // In production, use a proper cron parser like node-cron
  const parts = schedule.split(' ');
  if (parts.length === 5) {
    // Check if it's time to run (simplified)
    // Format: min hour day month dow
    const [cronMin, cronHour] = parts;
    const currentMin = now.getMinutes();
    const currentHour = now.getHours();

    // Simple: if cron is "0 8" and it's 8:00-8:05, run it
    if (cronMin === '0' && currentMin < 5) {
      if (cronHour === '*' || parseInt(cronHour) === currentHour) {
        // Check last run wasn't today
        if (lastRun) {
          const lastRunDate = new Date(lastRun).toDateString();
          const today = now.toDateString();
          if (lastRunDate === today) return false;
        }
        return true;
      }
    }
  }

  return false;
}

// =====================================================
// JOB EXECUTION
// =====================================================

function runJob(job, db) {
  const scriptPath = path.join(__dirname, '..', '..', job.script_path);

  if (!fs.existsSync(scriptPath)) {
    console.error(`   ❌ Script not found: ${scriptPath}`);
    return { success: false, error: 'Script not found' };
  }

  try {
    console.log(`   ▶️  Running: ${job.script_path}`);
    
    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would execute: node ${scriptPath}`);
      return { success: true, dryRun: true };
    }

    const output = execSync('node ' + scriptPath, {
      encoding: 'utf-8',
      timeout: 300000, // 5 minute timeout
      cwd: path.dirname(scriptPath)
    });

    console.log(`   ✅ Completed`);
    
    // Update job status
    db.prepare(`
      UPDATE recurring_jobs 
      SET last_run_at = datetime('now'),
          last_run_status = 'success',
          retry_count = 0
      WHERE id = ?
    `).run(job.id);

    return { success: true, output: output.substring(0, 500) };

  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);

    // Increment retry count
    const retries = (job.retry_count || 0) + 1;
    const status = retries >= (job.max_retries || 3) ? 'failed' : 'pending';

    db.prepare(`
      UPDATE recurring_jobs 
      SET last_run_at = datetime('now'),
          last_run_status = ?,
          retry_count = ?
      WHERE id = ?
    `).run(status, retries, job.id);

    return { success: false, error: error.message };
  }
}

// =====================================================
// MAIN EXECUTION
// =====================================================

function main() {
  const now = new Date();
  console.log(`⚡ Scheduled Job Runner`);
  console.log(`   Time: ${now.toISOString()}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);

  const db = new Database(DB_PATH);

  // Get all active jobs
  const jobs = db.prepare(`
    SELECT * FROM recurring_jobs
    WHERE active = 1
    ORDER BY next_run_at, priority DESC
  `).all();

  console.log(`\n📋 Found ${jobs.length} active jobs`);

  let runCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const job of jobs) {
    const shouldRunJob = shouldRun(job.schedule, job.last_run_at, now);

    if (shouldRunJob) {
      console.log(`\n🔄 ${job.name} (${job.job_type})`);
      console.log(`   Schedule: ${job.schedule}`);
      
      const result = runJob(job, db);
      
      if (result.success) {
        runCount++;
      } else {
        failCount++;
      }
    } else {
      skipCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Ran: ${runCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Failed: ${failCount}`);

  db.close();
}

main();
