import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '@vybekiit/core';
import { selectDbKey } from './key';

/**
 * Create a server-side Supabase data client.
 *
 * Uses the service-role key when available (see {@link selectDbKey}). Sessions are
 * disabled because this client is for stateless server work, not a logged-in
 * browser session — auth flows go through `@vybekiit/auth` instead.
 */
export function createDbClient(config: SupabaseConfig): SupabaseClient {
  const { key } = selectDbKey(config);
  return createClient(config.SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
