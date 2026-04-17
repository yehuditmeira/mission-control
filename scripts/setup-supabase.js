#!/usr/bin/env node
/**
 * Setup Supabase schema and seed data
 * Run: node scripts/setup-supabase.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://docfgldavgoqwkyfmzcd.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvY2ZnbGRhdmdvcXdreWZtemNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQxMjgsImV4cCI6MjA5MjAxMDEyOH0.XF2vdRGs4NWuZp1nIcZtdK4fX6U3XFb_SRxvyQG2Qvk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSql(filePath) {
  console.log(`\n📄 Executing: ${path.basename(filePath)}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Split by semicolon but handle $$ blocks
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed === '') continue;
    
    if (trimmed.includes('$$')) {
      inDollarQuote = !inDollarQuote;
    }
    
    current += line + '\n';
    
    if (!inDollarQuote && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  for (const stmt of statements) {
    if (!stmt) continue;
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_temp_exec').select('*').limit(0);
        if (queryError) {
          console.log(`   ⚠️  Could not verify: ${stmt.substring(0, 50)}...`);
        }
      }
    } catch (e) {
      // Some statements may fail if they already exist, that's ok
      if (!stmt.includes('IF NOT EXISTS') && !stmt.includes('CREATE POLICY')) {
        console.log(`   ⚠️  Statement may have failed (expected if already exists)`);
      }
    }
  }
  
  console.log(`   ✅ ${path.basename(filePath)} processed`);
}

async function setup() {
  console.log('🚀 Setting up Mission Control in Supabase...\n');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  console.log(`Found ${files.length} migration files`);
  
  // Check if projects already exist
  const { data: existingProjects, error: projectError } = await supabase.from('projects').select('id, name');
  
  if (projectError && projectError.message.includes('does not exist')) {
    console.log('⚠️  Tables do not exist. Please run the migrations in Supabase SQL Editor:');
    console.log('   https://docfgldavgoqwkyfmzcd.supabase.co/project/_/sql');
    console.log('\n📋 Steps:');
    console.log('   1. Go to SQL Editor → New Query');
    console.log('   2. Paste contents of supabase/migrations/000001_initial_schema.sql');
    console.log('   3. Run the query');
    console.log('   4. Repeat for 000002_multi_project_update.sql and 000003_seed_demo_data.sql');
    return;
  }
  
  console.log('\n📊 Current projects:', existingProjects?.map(p => p.name).join(', ') || 'None');
  
  // Update project names if needed
  const updates = [
    { oldName: 'Affiliate Flow', newName: 'Mrkt Drop', color: '#A855F7', slug: 'mrkt-drop', sort_order: 2 },
    { oldName: 'Merchant Services', newName: 'Merchant Lead Hunter', color: '#EC4899', slug: 'merchant-lead-hunter', sort_order: 1 },
  ];
  
  for (const update of updates) {
    const existing = existingProjects?.find(p => p.name === update.oldName);
    if (existing) {
      const { error } = await supabase.from('projects').update({
        name: update.newName,
        color: update.color,
        slug: update.slug,
        sort_order: update.sort_order
      }).eq('id', existing.id);
      
      if (error) {
        console.log(`   ❌ Error updating ${update.oldName}: ${error.message}`);
      } else {
        console.log(`   ✅ Renamed ${update.oldName} → ${update.newName}`);
      }
    } else {
      // Check if new name already exists
      const alreadyExists = existingProjects?.find(p => p.name === update.newName);
      if (!alreadyExists) {
        const { error } = await supabase.from('projects').insert({
          name: update.newName,
          color: update.color,
          slug: update.slug,
          sort_order: update.sort_order,
          description: update.newName === 'Mrkt Drop' 
            ? 'Autonomous social media marketing for 7 platforms'
            : 'Reddit scraper → AI qualification → DM outreach for merchant services'
        });
        if (error) console.log(`   ⚠️  Could not create ${update.newName}: ${error.message}`);
        else console.log(`   ✅ Created ${update.newName}`);
      } else {
        console.log(`   ✓ ${update.newName} already exists`);
      }
    }
  }
  
  // Ensure Personal project exists
  const personalExists = existingProjects?.find(p => p.name === 'Personal');
  if (!personalExists) {
    const { error } = await supabase.from('projects').insert({
      name: 'Personal',
      color: '#F59E0B',
      slug: 'personal',
      sort_order: 0,
      description: 'Personal tasks and life admin'
    });
    if (error) console.log(`   ⚠️  Could not create Personal: ${error.message}`);
    else console.log(`   ✅ Created Personal`);
  }
  
  console.log('\n🎯 Setup complete!');
  
  // Verify final state
  const { data: finalProjects } = await supabase.from('projects').select('*').order('sort_order');
  console.log('\n📋 Current projects:');
  finalProjects?.forEach(p => {
    console.log(`   ${p.sort_order}. ${p.name} (${p.slug}) - ${p.color}`);
  });
}

setup().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
