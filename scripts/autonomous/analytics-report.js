#!/usr/bin/env node
// =====================================================
// WEEKLY ANALYTICS REPORT GENERATOR
// Compiles analytics from Pinterest API and generates reports
// ZERO API cost - uses local Ollama for analysis
// =====================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const Database = require('better-sqlite3');
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'mission-control.db');
const REPORTS_DIR = path.join(__dirname, '..', '..', 'content', 'reports');

const MODEL = process.env.ANALYTICS_MODEL || 'gemma3:12b';

// Ensure directories exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// =====================================================
// DATA COLLECTION
// =====================================================

function collectPinterestMetrics(db) {
  // Get content items from last 7 days
  const lastWeekContent = db.prepare(`
    SELECT 
      content_type,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(impressions) as total_impressions,
      SUM(saves) as total_saves,
      SUM(clicks) as total_clicks
    FROM content_items
    WHERE platform_id = (SELECT id FROM platforms WHERE slug = 'pinterest')
      AND created_at >= datetime('now', '-7 days')
    GROUP BY content_type
  `).all();

  // Get top performing pins
  const topPins = db.prepare(`
    SELECT title, impressions, saves, clicks,
           CASE WHEN impressions > 0 THEN (saves * 100.0 / impressions) ELSE 0 END as save_rate
    FROM content_items
    WHERE platform_id = (SELECT id FROM platforms WHERE slug = 'pinterest')
      AND status = 'published'
    ORDER BY (impressions * 1 + saves * 2 + clicks * 3) DESC
    LIMIT 10
  `).all();

  // Get keyword performance
  const keywordStats = db.prepare(`
    SELECT keyword, times_used, avg_performance
    FROM keywords
    WHERE platform_id = (SELECT id FROM platforms WHERE slug = 'pinterest')
    ORDER BY times_used DESC
    LIMIT 15
  `).all();

  // Get task completion stats
  const taskStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM platform_tasks
    WHERE platform_id = (SELECT id FROM platforms WHERE slug = 'pinterest')
    GROUP BY status
  `).all();

  return {
    weekOf: new Date().toISOString().split('T')[0],
    content: lastWeekContent,
    topPins,
    keywords: keywordStats,
    tasks: taskStats,
    summary: {
      totalPins: lastWeekContent.reduce((sum, c) => sum + c.total, 0),
      publishedPins: lastWeekContent.reduce((sum, c) => sum + c.published, 0),
      totalImpressions: lastWeekContent.reduce((sum, c) => sum + (c.total_impressions || 0), 0),
      totalSaves: lastWeekContent.reduce((sum, c) => sum + (c.total_saves || 0), 0),
      totalClicks: lastWeekContent.reduce((sum, c) => sum + (c.total_clicks || 0), 0)
    }
  };
}

// =====================================================
// AI ANALYSIS
// =====================================================

function analyzeWithOllama(metrics) {
  const prompt = `You are a Pinterest marketing analyst for a frum tznius fashion brand.

Analyze the following weekly metrics and provide insights:

WEEK: ${metrics.weekOf}

CONTENT SUMMARY:
- Total Pins Created: ${metrics.summary.totalPins}
- Published: ${metrics.summary.publishedPins}
- Total Impressions: ${metrics.summary.totalImpressions.toLocaleString()}
- Total Saves: ${metrics.summary.totalSaves.toLocaleString()}
- Total Clicks: ${metrics.summary.totalClicks.toLocaleString()}

TOP PERFORMING PINS:
${metrics.topPins.slice(0, 5).map((p, i) => `${i + 1}. "${p.title.substring(0, 50)}..." - ${p.impressions} impressions, ${p.saves} saves (${p.save_rate.toFixed(1)}% save rate)`).join('\n')}

KEYWORDS USED:
${metrics.keywords.slice(0, 10).map(k => `- ${k.keyword}: used ${k.times_used} times`).join('\n')}

TASK PROGRESS:
${metrics.tasks.map(t => `- ${t.status}: ${t.count} tasks`).join('\n')}

Generate a JSON report with:
{
  "executive_summary": "2-3 sentence overview of week performance",
  "wins": ["list 3 specific wins this week"],
  "concerns": ["list 2-3 areas needing attention"],
  "recommendations": ["3 actionable recommendations for next week"],
  "focus_keywords": ["3 keywords to prioritize next week"],
  "content_gaps": ["2-3 content opportunities identified"]
}

Base recommendations on:
- Pins with highest engagement rates
- Keywords with growth potential
- Frum tznius fashion trends`;

  try {
    const result = execSync('ollama run ' + MODEL + ' --format json', {
      input: prompt,
      encoding: 'utf-8',
      timeout: 180000,
      maxBuffer: 1024 * 1024
    });
    
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(result);
  } catch (error) {
    console.error('Ollama analysis failed:', error.message);
    return null;
  }
}

// =====================================================
// REPORT GENERATION
// =====================================================

function generateMarkdownReport(metrics, analysis) {
  const reportDate = new Date().toISOString().split('T')[0];
  
  return `# Pinterest Analytics Report - Week of ${metrics.weekOf}

## Executive Summary
${analysis?.executive_summary || 'Weekly report generated. See metrics below for details.'}

## Key Metrics

| Metric | Value |
|--------|-------|
| Total Pins Created | ${metrics.summary.totalPins} |
| Published Pins | ${metrics.summary.publishedPins} |
| Total Impressions | ${metrics.summary.totalImpressions.toLocaleString()} |
| Total Saves | ${metrics.summary.totalSaves.toLocaleString()} |
| Total Clicks | ${metrics.summary.totalClicks.toLocaleString()} |
| Save Rate | ${metrics.summary.totalImpressions > 0 ? ((metrics.summary.totalSaves / metrics.summary.totalImpressions) * 100).toFixed(2) : 0}% |
| Click Rate | ${metrics.summary.totalImpressions > 0 ? ((metrics.summary.totalClicks / metrics.summary.totalImpressions) * 100).toFixed(2) : 0}% |

## Top Performing Pins

| Rank | Title | Impressions | Saves | Clicks | Save Rate |
|------|-------|-------------|-------|--------|-----------|
${metrics.topPins.slice(0, 10).map((p, i) => `| ${i + 1} | ${p.title.substring(0, 40)}${p.title.length > 40 ? '...' : ''} | ${p.impressions.toLocaleString()} | ${p.saves.toLocaleString()} | ${p.clicks.toLocaleString()} | ${p.save_rate.toFixed(1)}% |`).join('\n')}

## Task Progress

${metrics.tasks.map(t => `- **${t.status}**: ${t.count} tasks`).join('\n')}

## Keyword Performance

${metrics.keywords.map(k => `- ${k.keyword}: used ${k.times_used} times${k.avg_performance ? ` (avg CTR: ${(k.avg_performance * 100).toFixed(2)}%)` : ''}`).join('\n')}

## AI-Generated Insights

### Wins
${analysis?.wins?.map(w => `- ${w}`).join('\n') || '- (No AI analysis available)'}

### Areas of Concern
${analysis?.concerns?.map(c => `- ${c}`).join('\n') || '- (No AI analysis available)'}

### Recommendations
${analysis?.recommendations?.map(r => `- ${r}`).join('\n') || '- (No AI analysis available)'}

### Focus Keywords Next Week
${analysis?.focus_keywords?.map(k => `- ${k}`).join('\n') || '- (No AI analysis available)'}

### Content Gaps
${analysis?.content_gaps?.map(g => `- ${g}`).join('\n') || '- (No AI analysis available)'}

---
*Report generated on ${reportDate} using ${MODEL}*
`;
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.log('📊 Weekly Analytics Report Starting...');
  console.log(`   Model: ${MODEL}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  const db = new Database(DB_PATH);

  // Collect metrics
  console.log('\n📈 Collecting Pinterest metrics...');
  const metrics = collectPinterestMetrics(db);

  console.log(`   - ${metrics.summary.totalPins} pins created this week`);
  console.log(`   - ${metrics.summary.totalImpressions} impressions`);
  console.log(`   - ${metrics.summary.totalSaves} saves`);
  console.log(`   - ${metrics.topPins.length} top pins identified`);

  // Generate AI analysis
  console.log('\n🤖 Running AI analysis...');
  const analysis = analyzeWithOllama(metrics);

  if (analysis) {
    console.log('   ✅ Analysis complete');
    console.log('   Highlights:', analysis.wins?.[0] || 'N/A');
  } else {
    console.log('   ⚠️ AI analysis failed, generating report without insights');
  }

  // Generate markdown report
  const markdown = generateMarkdownReport(metrics, analysis);
  
  // Save report
  const reportFilename = `pinterest-weekly-${metrics.weekOf}.md`;
  const reportPath = path.join(REPORTS_DIR, reportFilename);
  fs.writeFileSync(reportPath, markdown);

  console.log(`\n📄 Report saved: ${reportPath}`);

  // Update platform metrics
  db.prepare(`
    UPDATE platforms 
    SET weekly_metrics = ?, updated_at = datetime('now')
    WHERE slug = 'pinterest'
  `).run(JSON.stringify(metrics.summary));

  // Log job execution
  db.prepare(`
    INSERT INTO job_logs 
    (job_id, platform_id, started_at, completed_at, status, items_processed)
    VALUES (
      (SELECT id FROM recurring_jobs WHERE name = 'Weekly Analytics Report'),
      (SELECT id FROM platforms WHERE slug = 'pinterest'),
      datetime('now'),
      datetime('now'),
      'success',
      ?
    )
  `).run(metrics.summary.totalPins);

  console.log('\n✅ Analytics report complete!');
  
  // Print summary to console
  console.log('\n📋 Summary:');
  console.log(`   Pins created: ${metrics.summary.totalPins}`);
  console.log(`   Impressions: ${metrics.summary.totalImpressions.toLocaleString()}`);
  console.log(`   Saves: ${metrics.summary.totalSaves.toLocaleString()}`);
  console.log(`   Save rate: ${metrics.summary.totalImpressions > 0 ? ((metrics.summary.totalSaves / metrics.summary.totalImpressions) * 100).toFixed(2) : 0}%`);

  db.close();
}

main().catch(console.error);
