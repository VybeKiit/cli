import { neon } from '@neondatabase/serverless';
import type { RailwayConfig } from '@vybekiit/core';
import { tryDb } from '@vybekiit/db/providerEffect';
import {
  createHybridPostgresProvider,
  type SqlClient,
} from '@vybekiit/db/providers/postgres/hybridProvider';
import type { DbError } from '@vybekiit/db/types';
import type { Effect } from 'effect';

/**
 * Build the Railway Postgres {@link DataProvider} — opt-in via
 * `DATA_PROVIDER=railway` (ADR-0017). Preset tables use native relational DDL;
 * custom collections fall back to the jsonb document store.
 *
 * @param config - Validated Railway config.
 * @returns Data provider backed by Railway Postgres.
 * @example
 * const provider = createRailwayDataProvider(config);
 */
export const createRailwayDataProvider = (config: RailwayConfig) => {
  const sql = neon(config.DATABASE_URL) as SqlClient;
  return createHybridPostgresProvider(sql, 'railway');
};

/**
 * Probe Railway Postgres connectivity with `SELECT 1`.
 *
 * @param databaseUrl - Railway Postgres connection URL.
 * @returns An Effect that succeeds when the query works.
 * @example
 * const result = await Effect.runPromise(pingRailwayDatabase(databaseUrl));
 */
export const pingRailwayDatabase = (databaseUrl: string): Effect.Effect<true, DbError> =>
  tryDb(
    'db_unreachable',
    async () => {
      const sql = neon(databaseUrl);
      await sql`SELECT 1 AS ok`;
      return true as const;
    },
    'unknown Railway error',
  );
