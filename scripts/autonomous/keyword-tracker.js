#!/usr/bin/env node
// =====================================================
// KEYWORD PERFORMANCE TRACKER
// Tracks keyword usage, estimates performance, and suggests optimizations
// ZERO API cost - uses local Ollama for keyword analysis
// =====================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const Database = require('better-sqlite3');
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'mission-control.db');

const MODEL = process.env.KEYWORD_MODEL || 'qwen3:8b';

// =====================================================
// KEYWORD ANALYSIS
// =====================================================

function analyzeKeywordOpportunities(keywords) {
  const prompt = `You are a Pinterest SEO expert for frum tznius fashion.

Analyze these keywords and suggest 10 NEW keyword opportunities:

CURRENT KEYWORDS:
${keywords.map(k => `- ${k.keyword} (used ${k.times_used}x, relevance: ${k.relevance_score}/10)`).join('\n')}

Generate a JSON array of 10 NEW keywords with this structure:
{
  "new_keywords": [
    {
      "keyword": "exact search phrase",
      "category": "shabbos|simcha|workwear|deals|family|accessories|seasonal",
      "intent": "informational|transactional",
      "relevance_score": 1-10,
      "rationale": "why this keyword works for frum tznius fashion"
    }
  ]
}

Rules:
- Focus on frum terminology (Shabbos, tznius, simcha)
- Include seasonal/event-based terms
- Mix high-volume and long-tail keywords
- Avoid anything that doesn't serve tznius fashion`;

  try {
    const result = execSync('ollama run ' + MODEL + ' --format json', {
      input: prompt,
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 1024 * 1024
    });
    
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.new_keywords || [];
    }
    return [];
  } catch (error) {
    console.error('Keyword analysis failed:', error.message);
    return [];
  }
}

function categorizeKeywordPerformance(keywords) {
  return {
    champions: keywords.filter(k => k.times_used > 5 && (k.avg_performance || 0) > 0.03),
    rising: keywords.filter(k => k.times_used > 0 && k.times_used <= 5 && (k.avg_performance || 0) > 0.02),
    potential: keywords.filter(k => k.times_used === 0 && k.relevance_score >= 8),
    underperformers: keywords.filter(k => k.times_used > 5 && (k.avg_performance || 1) < 0.01)
  };
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.log('🔑 Keyword Tracker Starting...');
  console.log(`   Model: ${MODEL}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  const db = new Database(DB_PATH);

  // Get Pinterest platform ID
  const platform = db.prepare('SELECT id FROM platforms WHERE slug = ?').get('pinterest');
  if (!platform) {
    console.error('❌ Pinterest platform not found');
    process.exit(1);
  }

  const platformId = platform.id;

  // Get all keywords
  const allKeywords = db.prepare(`
    SELECT id, keyword, times_used, avg_performance, relevance_score, category, intent, active
    FROM keywords
    WHERE platform_id = ?
    ORDER BY relevance_score DESC, times_used DESC
  `).all(platformId);

  console.log(`\n📊 Tracking ${allKeywords.length} keywords`);

  // Categorize performance
  const categories = categorizeKeywordPerformance(allKeywords);
  
  console.log('\n📈 Performance Breakdown:');
  console.log(`   Champions: ${categories.champions.length} keywords`);
  console.log(`   Rising: ${categories.rising.length} keywords`);
  console.log(`   Potential: ${categories.potential.length} keywords`);
  console.log(`   Underperformers: ${categories.underperformers.length} keywords`);

  // Generate new keyword opportunities
  console.log('\n🤖 Generating new keyword opportunities...');
  const newKeywords = analyzeKeywordOpportunities(allKeywords);

  // Insert new keywords
  const insertKeyword = db.prepare(`
    INSERT INTO keywords (platform_id, keyword, category, intent, relevance_score)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT DO NOTHING
  `);

  let addedCount = 0;
  for (const kw of newKeywords) {
    try {
      insertKeyword.run(platformId, kw.keyword, kw.category, kw.intent, kw.relevance_score);
      addedCount++;
    } catch (e) {
      // Keyword already exists
    }
  }

  console.log(`   ✅ Added ${addedCount} new keywords`);

  // Log recommendations
  console.log('\n💡 Recommendations:');
  
  if (categories.champions.length > 0) {
    console.log('   🔥 CHAMPIONS (keep using):');
    categories.champions.slice(0, 3).forEach(k => {
      console.log(`      - ${k.keyword} (${(k.avg_performance * 100).toFixed(1)}% CTR)`);
    });
  }

  if (categories.potential.length > 0) {
    console.log('   🌱 POTENTIAL (start using):');
    categories.potential.slice(0, 3).forEach(k => {
      console.log(`      - ${k.keyword} (${k.relevance_score}/10 relevance)`);
    });
  }

  if (newKeywords.length > 0) {
    console.log('   ✨ NEW OPPORTUNITIES:');
    newKeywords.slice(0, 5).forEach(k => {
      console.log(`      - ${k.keyword} [${k.category}] - ${k.rationale}`);
    });
  }

  // Log job execution
  db.prepare(`
    INSERT INTO job_logs 
    (job_id, platform_id, started_at, completed_at, status, items_processed, items_created)
    VALUES (
      (SELECT id FROM recurring_jobs WHERE name = 'Keyword Performance Tracker'),
      ?,
      datetime('now'),
      datetime('now'),
      'success',
      ?,
      ?
    )
  `).run(platformId, allKeywords.length, addedCount);

  console.log('\n✅ Keyword tracking complete!');

  db.close();
}

main().catch(console.error);
