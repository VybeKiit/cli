import { neon } from '@neondatabase/serverless';
import { fail, type NeonConfig, ok, type Result } from '@vybekiit/core';
import {
  createHybridPostgresProvider,
  type SqlClient,
} from '@vybekiit/db/providers/postgres/hybridProvider';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Build the Neon serverless Postgres {@link DataProvider} — opt-in via
 * `DATA_PROVIDER=neon`. Preset tables use native relational DDL; custom
 * collections fall back to the jsonb document store.
 */
export function createNeonDataProvider(config: NeonConfig) {
  const sql = neon(config.DATABASE_URL) as SqlClient;
  return createHybridPostgresProvider(sql, 'neon');
}

/** Neon connectivity probe — `SELECT 1`. */
export async function pingNeonDatabase(databaseUrl: string): Promise<Result<true>> {
  try {
    const sql = neon(databaseUrl);
    await sql`SELECT 1 AS ok`;
    return ok(true);
  } catch (error) {
    return fail('db_unreachable', errorMessage(error));
  }
}
