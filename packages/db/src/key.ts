import type { SupabaseConfig } from '@vybekiit/core';

/** Which Supabase key a data client is using, and why. */
export type DbKeySelection = {
  readonly key: string;
  readonly role: 'service' | 'anon';
};

/**
 * Pick the strongest available Supabase key for server-side data access.
 *
 * Prefers the service-role key (bypasses row-level security for trusted server
 * work like fulfilling an order); falls back to the anon key when the service
 * key isn't set. Pure + tested so the precedence rule can't silently regress —
 * picking the wrong key is a security-relevant mistake.
 *
 * @param config - Validated Supabase credentials.
 * @returns The selected key and its role.
 * @example
 * const selection = selectDbKey(config);
 */
export const selectDbKey = (config: SupabaseConfig): DbKeySelection => {
  if (config.SUPABASE_SERVICE_ROLE_KEY) {
    return { key: config.SUPABASE_SERVICE_ROLE_KEY, role: 'service' };
  }
  return { key: config.SUPABASE_ANON_KEY, role: 'anon' };
};
