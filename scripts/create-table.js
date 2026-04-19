const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://docfgldavgoqwkyfmzcd.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvY2ZnbGRhdmdvcXdreWZtemNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQzNDEyOCwiZXhwIjoyMDkyMDEwMTI4fQ.k-0iN83ypHhoKGh-Zle3I2fiRWJ35sUeHTwleSVbWuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

async function createTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS project_sync (
        project_id TEXT PRIMARY KEY,
        current_phase INTEGER,
        current_phase_name TEXT,
        milestone TEXT,
        milestone_name TEXT,
        status TEXT,
        total_phases INTEGER DEFAULT 0,
        completed_phases INTEGER DEFAULT 0,
        percent INTEGER DEFAULT 0,
        phase_list JSONB DEFAULT '[]'::jsonb,
        has_planning BOOLEAN DEFAULT false,
        last_updated TEXT,
        synced_at TIMESTAMPTZ DEFAULT now()
      );
      ALTER TABLE project_sync ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "Allow public read" ON project_sync FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Allow public upsert" ON project_sync FOR ALL USING (true) WITH CHECK (true);
    `
  });
  
  if (error) {
    console.error('Error:', error);
    // Try without RPC
    console.log('Trying direct insert to test if table exists...');
    const { error: insertError } = await supabase.from('project_sync').insert({
      project_id: 'test',
      current_phase: 1,
      status: 'test'
    });
    if (insertError && insertError.code === '42P01') {
      console.log('Table does not exist. Need to create via SQL.');
    } else {
      console.log('Table exists or other error:', insertError);
    }
  } else {
    console.log('Table created successfully');
  }
}

createTable();
