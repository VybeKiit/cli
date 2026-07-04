import { neon } from '@neondatabase/serverless';
import { fail, ok, type Result } from '@vybekiit/core';
import { ALL_PRESETS, getPreset } from './catalog';
import type {
  PostgresProviderName,
  PresetVerificationIssue,
  PresetVerificationResult,
} from './types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type TableRow = { table_name: string };
type IndexRow = { indexname: string; tablename: string };

/** Verify preset tables and indexes exist in Postgres. */
export async function verifyPresets(
  presetIds: readonly string[],
  databaseUrl: string,
): Promise<Result<PresetVerificationResult>> {
  try {
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
      if (!manifest) continue;

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

    return ok({
      ok: issues.length === 0,
      issues,
      applied,
    });
  } catch (error) {
    return fail('verify_failed', errorMessage(error));
  }
}

/** Verify all catalog presets. */
export async function verifyAllPresets(
  databaseUrl: string,
): Promise<Result<PresetVerificationResult>> {
  return verifyPresets(
    ALL_PRESETS.map((preset) => preset.id),
    databaseUrl,
  );
}

/** Map DATA_PROVIDER to postgres provider for verify/apply. */
export function postgresProviderFromEnv(env: NodeJS.ProcessEnv): PostgresProviderName | null {
  const provider = env.DATA_PROVIDER ?? 'supabase';
  if (provider === 'supabase' || provider === 'neon' || provider === 'railway') {
    return provider;
  }
  return null;
}
