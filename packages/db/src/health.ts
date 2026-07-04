import type { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, type Result } from '@vybekiit/core';

/**
 * Confirm the database is reachable and the credentials work.
 *
 * Backs the `doctor` skill: it queries a table the buyer names, so a failure
 * cleanly distinguishes "can't connect / bad key" from app logic. Returns a
 * {@link Result} so doctor can translate the failure into one plain-language fix.
 *
 * @param table - any existing table to probe (a `head` count, no rows fetched)
 */
export async function pingDatabase(client: SupabaseClient, table: string): Promise<Result<true>> {
  const { error } = await client.from(table).select('*', { head: true, count: 'exact' });
  if (error) return fail('db_unreachable', error.message);
  return ok(true);
}
