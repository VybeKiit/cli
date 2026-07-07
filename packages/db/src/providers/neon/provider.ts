import { neon } from '@neondatabase/serverless';
import type { NeonConfig } from '@vybekiit/core';
import { tryDb } from '@vybekiit/db/providerEffect';
import {
  createHybridPostgresProvider,
  type SqlClient,
} from '@vybekiit/db/providers/postgres/hybridProvider';
import type { DbError } from '@vybekiit/db/types';
import type { Effect } from 'effect';

/**
 * Build the Neon serverless Postgres {@link DataProvider} — opt-in via
 * `DATA_PROVIDER=neon`. Preset tables use native relational DDL; custom
 * collections fall back to the jsonb document store.
 *
 * @param config - Validated Neon config.
 * @returns Data provider backed by Neon Postgres.
 * @example
 * const provider = createNeonDataProvider(config);
 */
export const createNeonDataProvider = (config: NeonConfig) => {
  const sql = neon(config.DATABASE_URL) as SqlClient;
  return createHybridPostgresProvider(sql, 'neon');
};

/**
 * Probe Neon connectivity with `SELECT 1`.
 *
 * @param databaseUrl - Neon connection URL.
 * @returns An Effect that succeeds when the query works.
 * @example
 * const result = await Effect.runPromise(pingNeonDatabase(databaseUrl));
 */
export const pingNeonDatabase = (databaseUrl: string): Effect.Effect<true, DbError> =>
  tryDb(
    'db_unreachable',
    async () => {
      const sql = neon(databaseUrl);
      await sql`SELECT 1 AS ok`;
      return true as const;
    },
    'unknown Neon error',
  );
