import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a lazy-initialized client
let _supabase: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  // During build phase without env vars, create a placeholder client
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.VERCEL_ENV === 'production') {
      // Only log once
      if (!process.env.SUPABASE_MOCK_INJECTED) {
        console.log('Supabase: Using placeholder for build (env vars not available during SSG)');
        process.env.SUPABASE_MOCK_INJECTED = 'true';
      }
      // Create placeholder - won't be used at runtime
      _supabase = createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
        auth: { persistSession: false },
      });
    } else {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  } else {
    _supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase: Connected to', supabaseUrl);
  }

  return _supabase;
}

// Export a singleton instance
export const supabase = getClient();
