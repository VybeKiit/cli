import { type RailwayConfig, type Result, fail, ok } from '@vybekiit/core';
import { neon } from '@neondatabase/serverless';
import { createHybridPostgresProvider, type SqlClient } from '../postgres/hybrid-provider';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Build the Railway Postgres {@link DataProvider} — opt-in via
 * `DATA_PROVIDER=railway` (ADR-0017). Preset tables use native relational DDL;
 * custom collections fall back to the jsonb document store.
 */
export function createRailwayDataProvider(config: RailwayConfig) {
  const sql = neon(config.DATABASE_URL) as SqlClient;
  return createHybridPostgresProvider(sql, 'railway');
}

/** Railway Postgres connectivity probe — `SELECT 1`. */
export async function pingRailwayDatabase(databaseUrl: string): Promise<Result<true>> {
  try {
    const sql = neon(databaseUrl);
    await sql`SELECT 1 AS ok`;
    return ok(true);
  } catch (error) {
    return fail('db_unreachable', errorMessage(error));
  }
}
