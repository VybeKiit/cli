import type { SupabaseClient } from '@supabase/supabase-js';
import { failDb, tryDb } from '@vybekiit/db/providerEffect';
import type { DbError } from '@vybekiit/db/types';
import { Effect } from 'effect';

/**
 * Confirm the database is reachable and the credentials work.
 *
 * Backs the `doctor` skill: it queries a table the buyer names, so a failure
 * cleanly distinguishes "can't connect / bad key" from app logic. Returns a
 * typed Effect so doctor can translate the failure into one plain-language fix.
 *
 * @param client - Supabase client to probe.
 * @param table - any existing table to probe (a `head` count, no rows fetched)
 * @returns An Effect that succeeds when the table query works.
 * @example
 * const result = await Effect.runPromise(pingDatabase(client, 'orders'));
 */
export const pingDatabase = (client: SupabaseClient, table: string): Effect.Effect<true, DbError> =>
  Effect.gen(function* () {
    const { error } = yield* tryDb<{ readonly error: { readonly message: string } | null }>(
      'db_unreachable',
      async () => client.from(table).select('*', { head: true, count: 'exact' }),
      'unknown Supabase error',
    );
    if (error) {
      return yield* failDb('db_unreachable', error.message);
    }
    return true as const;
  });
