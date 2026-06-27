import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '@vybekiit/core';

/**
 * Create a Supabase client for auth using the public anon key.
 *
 * The anon key is safe in the browser; row-level security on Supabase enforces
 * access. Server-only privileged writes belong in `@vybekiit/db` with the service
 * role key — never mix the two in client-shipped code.
 */
export function createAuthClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}
