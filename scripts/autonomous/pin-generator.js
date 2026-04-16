#!/usr/bin/env node
// =====================================================
// AUTONOMOUS PIN GENERATOR
// Generates Pinterest pins using local Ollama models (qwen3:8b / gemma3:12b)
// ZERO API cost - runs entirely on local hardware
// =====================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Database connection
const Database = require('better-sqlite3');
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'mission-control.db');

// Config
const PINS_DIR = path.join(__dirname, '..', '..', 'content', 'pins');
const MODEL = process.env.PIN_MODEL || 'qwen3:8b';
const MAX_PINS_PER_RUN = 5;

// Ensure directories exist
if (!fs.existsSync(PINS_DIR)) {
  fs.mkdirSync(PINS_DIR, { recursive: true });
}

// =====================================================
// OLLAMA INTERACTION
// =====================================================

function callOllama(prompt, model = MODEL) {
  try {
    const result = execSync('ollama run ' + model + ' --format json', {
      input: prompt,
      encoding: 'utf-8',
      timeout: 120000, // 2 minute timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    return result.trim();
  } catch (error) {
    console.error('Ollama error:', error.message);
    return null;
  }
}

function generatePinContent(product, keywords, template) {
  const prompt = `You are a Pinterest marketing expert specializing in frum tznius fashion.

Create a Pinterest pin based on the following:

PRODUCT: ${product.name}
PRICE: ${product.price}
CATEGORY: ${product.category}
KEYWORDS TO INCLUDE: ${keywords.join(', ')}

TEMPLATE TYPE: ${template}

Generate a JSON object with:
- title: Compelling pin title (under 100 chars, keyword-rich)
- description: Full pin description (400-500 chars) with:
  * Natural keyword integration
  * Clear benefit statement  
  * Call to action
  * #affiliate hashtag
  * 3-5 relevant hashtags
- alt_text: Alt text for accessibility (under 500 chars)
- board_suggestion: Which board this should go on (Shabbos Outfit Ideas, Tznius Workwear, Modest Wedding Guest Dresses, Simcha Style, Family Matching Outfits, etc.)

RULES:
- Must pass tznius standards: midi+ length, sleeves 3/4+, no plunging necklines
- Focus on frum audience values: modesty, elegance, affordability
- Use frum terminology: Shabbos, tznius, simcha, Yom Tov

Output ONLY valid JSON, no explanation.`;

  const response = callOllama(prompt);
  if (!response) return null;

  try {
    // Extract JSON from response (handles cases where model adds extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse Ollama response:', e.message);
    console.error('Raw response:', response.substring(0, 200));
    return null;
  }
}

// =====================================================
// PIN GENERATION LOGIC
// =====================================================

function getTopKeywords(db, limit = 5) {
  // Get high-relevance keywords that haven't been used recently
  return db.prepare(`
    SELECT keyword, category FROM keywords 
    WHERE active = 1 AND relevance_score >= 8
    ORDER BY times_used ASC, relevance_score DESC
    LIMIT ?
  `).all(limit);
}

function getProductIdeas(category) {
  // Template products for different categories
  const products = {
    shabbos: [
      { name: 'Elegant Midi Dress for Shabbos', price: '$45-85', category: 'shabbos' },
      { name: 'Floral Maxi Skirt with Pockets', price: '$32-48', category: 'shabbos' },
      { name: 'Long Sleeve Wrap Dress', price: '$55-75', category: 'shabbos' }
    ],
    simcha: [
      { name: 'Modest Wedding Guest Dress', price: '$68-120', category: 'simcha' },
      { name: 'Sheva Brachos Ready Dress', price: '$75-95', category: 'simcha' },
      { name: 'Elegant Bar Mitzvah Outfit', price: '$80-150', category: 'simcha' }
    ],
    workwear: [
      { name: 'Professional Tznius Blouse', price: '$35-55', category: 'workwear' },
      { name: 'Kosher Workplace Midi Skirt', price: '$40-60', category: 'workwear' },
      { name: 'Modest Business Casual Set', price: '$65-85', category: 'workwear' }
    ],
    deals: [
      { name: 'Budget-Friendly Shabbos Dress', price: 'Under $50', category: 'deals' },
      { name: 'Affordable Modest Maxi', price: '$25-40', category: 'deals' },
      { name: 'Tznius Finds Under $30', price: 'Under $30', category: 'deals' }
    ],
    family: [
      { name: 'Mother Daughter Matching Set', price: '$45-75', category: 'family' },
      { name: 'Family Shabbos Coordinating Outfits', price: '$60-120', category: 'family' },
      { name: 'Girls Long Sleeve Midi Dress', price: '$25-40', category: 'family' }
    ]
  };

  const categoryProducts = products[category] || products.shabbos;
  return categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
}

function selectTemplate() {
  const templates = ['Product Spotlight', 'Outfit Flat Lay', 'Price Roundup', 'Blog Teaser'];
  return templates[Math.floor(Math.random() * templates.length)];
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.log('🤖 Pin Generator Starting...');
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

  // Get keywords to target
  const keywords = getTopKeywords(db, 5);
  if (keywords.length === 0) {
    console.error('❌ No keywords available');
    process.exit(1);
  }

  console.log(`\n🎯 Targeting ${keywords.length} keywords:`, keywords.map(k => k.keyword).join(', '));

  let pinsGenerated = 0;
  const generatedPins = [];

  for (const kw of keywords) {
    if (pinsGenerated >= MAX_PINS_PER_RUN) break;

    console.log(`\n  Generating pin for: ${kw.keyword}`);

    const product = getProductIdeas(kw.category);
    const template = selectTemplate();

    const pinContent = generatePinContent(product, [kw.keyword], template);

    if (pinContent) {
      // Save to content_items table
      const insert = db.prepare(`
        INSERT INTO content_items 
        (platform_id, content_type, title, description, status, ai_generated, ai_model, created_at)
        VALUES (?, 'pin', ?, ?, 'draft', 1, ?, datetime('now'))
      `);

      const result = insert.run(
        platformId,
        pinContent.title,
        `${pinContent.description}\n\nAlt: ${pinContent.alt_text}\n\nBoard: ${pinContent.board_suggestion}`,
        MODEL
      );

      // Update keyword usage
      db.prepare('UPDATE keywords SET times_used = times_used + 1 WHERE keyword = ?').run(kw.keyword);

      const pinId = result.lastInsertRowid;

      // Save copy to file for reference
      const filename = `pin_${Date.now()}_${pinId}.json`;
      fs.writeFileSync(
        path.join(PINS_DIR, filename),
        JSON.stringify({
          id: pinId,
          ...pinContent,
          product,
          keyword: kw.keyword,
          template,
          generated_at: new Date().toISOString()
        }, null, 2)
      );

      generatedPins.push({ id: pinId, title: pinContent.title });
      pinsGenerated++;

      console.log(`     ✅ Created: ${pinContent.title.substring(0, 60)}...`);
    } else {
      console.log(`     ❌ Failed to generate`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // Log to job_logs
  const insertLog = db.prepare(`
    INSERT INTO job_logs 
    (job_id, platform_id, started_at, completed_at, status, items_created, model_used)
    VALUES (
      (SELECT id FROM recurring_jobs WHERE name = 'Daily Pin Generator'),
      ?,
      datetime('now'),
      datetime('now'),
      'success',
      ?,
      ?
    )
  `);
  insertLog.run(platformId, pinsGenerated, MODEL);

  console.log(`\n✅ Generated ${pinsGenerated} pins`);
  console.log('\nGenerated pins:');
  generatedPins.forEach(p => console.log(`   - ${p.title}`));

  db.close();
}

main().catch(console.error);
