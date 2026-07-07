// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: Preset verification stays as one linear audit pass over tables and indexes.
import { neon } from '@neondatabase/serverless';
import { DbError } from '@vybekiit/db/types';
import { Effect } from 'effect';
import { ALL_PRESETS, getPreset } from './catalog';
import type {
  PostgresProviderName,
  PresetVerificationIssue,
  PresetVerificationResult,
} from './types';

/**
 * Narrow an unknown caught value to a developer-facing message.
 *
 * @param error - Unknown caught value.
 * @returns Error message for a failed DbError.
 * @example
 * const message = errorMessage(error);
 */
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

type TableRow = {
  readonly table_name: string;
};

type IndexRow = {
  readonly indexname: string;
  readonly tablename: string;
};

/**
 * Verify preset tables and indexes exist in Postgres.
 *
 * @param presetIds - Preset ids to verify.
 * @param databaseUrl - Database connection URL.
 * @returns An Effect with verification details or a stable failure.
 * @example
 * const result = await Effect.runPromise(verifyPresets(['orders'], databaseUrl));
 */
export const verifyPresets = (
  presetIds: readonly string[],
  databaseUrl: string,
): Effect.Effect<PresetVerificationResult, DbError> =>
  Effect.tryPromise({
    try: async () => {
      const sql = neon(databaseUrl);
      const tables = (await sql`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
      `) as TableRow[];
      const tableSet = new Set(tables.map((row) => row.table_name));

      const indexes = (await sql`
        select indexname, tablename
        from pg_indexes
        where schemaname = 'public'
      `) as IndexRow[];
      const indexSet = new Set(indexes.map((row) => `${row.tablename}:${row.indexname}`));

      const issues: PresetVerificationIssue[] = [];
      const applied: string[] = [];

      for (const presetId of presetIds) {
        const manifest = getPreset(presetId);
        if (manifest !== undefined) {
          let presetOk = true;
          for (const entity of manifest.entities) {
            if (!tableSet.has(entity.name)) {
              presetOk = false;
              issues.push({
                presetId,
                table: entity.name,
                issue: 'missing_table',
                detail: `Table public.${entity.name} is missing.`,
              });
            }
          }

          for (const index of manifest.indexes) {
            const expectedName = `${index.table}_${index.columns.join('_')}_idx`;
            const found = [...indexSet].some(
              (entry) => entry.startsWith(`${index.table}:`) && entry.includes(expectedName),
            );
            if (!found && tableSet.has(index.table)) {
              issues.push({
                presetId,
                table: index.table,
                issue: 'missing_index',
                detail: `Index ${expectedName} missing — ${index.reason}`,
              });
            }
          }

          if (presetOk && manifest.entities.length > 0) {
            applied.push(presetId);
          }
          if (manifest.entities.length === 0 && presetId === 'realtime_publications') {
            applied.push(presetId);
          }
        }
      }

      return {
        ok: issues.length === 0,
        issues,
        applied,
      };
    },
    catch: (error) => new DbError({ code: 'verify_failed', message: errorMessage(error) }),
  });

/**
 * Verify every catalog preset against a Postgres database.
 *
 * @param databaseUrl - Database connection URL.
 * @returns An Effect with verification details or a stable failure.
 * @example
 * const result = await Effect.runPromise(verifyAllPresets(databaseUrl));
 */
export const verifyAllPresets = (
  databaseUrl: string,
): Effect.Effect<PresetVerificationResult, DbError> =>
  verifyPresets(
    ALL_PRESETS.map((preset) => preset.id),
    databaseUrl,
  );

/**
 * Map `DATA_PROVIDER` to a Postgres provider for verify/apply.
 *
 * @param env - Process environment to inspect.
 * @returns The Postgres provider, or `null` for non-Postgres providers.
 * @example
 * const provider = postgresProviderFromEnv(process.env);
 */
export const postgresProviderFromEnv = (env: NodeJS.ProcessEnv): PostgresProviderName | null => {
  const provider = env.DATA_PROVIDER === undefined ? 'supabase' : env.DATA_PROVIDER;
  if (provider === 'supabase' || provider === 'neon' || provider === 'railway') {
    return provider;
  }
  return null;
};
