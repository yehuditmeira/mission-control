#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) {
  console.error('Supabase URL or key not found in .env.local');
  process.exit(2);
}

const supabase = createClient(URL, KEY);

(async () => {
  try {
    const { data, error } = await supabase
      .from('operations')
      .select('id,title,project_id,external_key,health_state,status,owner,output_target,notes,last_error')
      .or("health_state.eq.red,status.eq.failing,blocker_state.eq.open")
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('No failing or red operations found.');
      process.exit(0);
    }
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Query failed:', err.message || err);
    process.exit(1);
  }
})();
