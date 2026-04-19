import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get env vars with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

console.log('Supabase: Initializing client with URL:', supabaseUrl.slice(0, 30) + '...');

// Custom fetch that disables Next.js fetch caching — without this,
// Vercel can serve stale Supabase responses for hours despite
// `dynamic = 'force-dynamic'` on routes.
const noCacheFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store', next: { revalidate: 0 } } as RequestInit);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  db: { schema: 'public' },
  global: { fetch: noCacheFetch },
});
