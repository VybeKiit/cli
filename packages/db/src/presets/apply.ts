import { neon } from '@neondatabase/serverless';
import { fail, ok, type Result } from '@vybekiit/core';
import type { SqlClient } from '@vybekiit/db/providers/postgres/hybridProvider';
import { getPreset } from './catalog';
import { renderPreset } from './render';
import type { PostgresProviderName, PresetManifest } from './types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type MigrationSqlClient = SqlClient;

async function executeMigration(sql: MigrationSqlClient, migrationSql: string): Promise<void> {
  // split into statements on one-or-more blank lines: "a;\n\nb;" → ["a;", "b;"]
  const blocks = migrationSql
    .split(/\n\n+/)
    .map((block) => block.trim())
    // drop blanks and lone SQL comment lines: keeps "select 1", removes "-- note"
    .filter((block) => block.length > 0 && !block.match(/^--[^\n]*$/));
  for (const block of blocks) {
    await sql(block);
  }
}

export type ApplyPresetOptions = {
  readonly presetId: string;
  readonly provider: PostgresProviderName;
  readonly databaseUrl: string;
  readonly dryRun?: boolean;
};

export type ApplyPresetResult = {
  readonly presetId: string;
  readonly provider: PostgresProviderName;
  readonly sql: string;
  readonly applied: boolean;
};

/** Apply a preset migration to a Postgres database via DATABASE_URL. */
export async function applyPreset(options: ApplyPresetOptions): Promise<Result<ApplyPresetResult>> {
  const manifest = getPreset(options.presetId);
  if (!manifest) {
    return fail('not_found', `Unknown preset "${options.presetId}".`);
  }

  const rendered = renderPreset(manifest, options.provider);
  const sql = rendered.sql;
  if (!sql) {
    return fail('unsupported', `Preset "${options.presetId}" has no SQL for ${options.provider}.`);
  }

  if (options.dryRun) {
    return ok({
      presetId: options.presetId,
      provider: options.provider,
      sql,
      applied: false,
    });
  }

  try {
    const sqlClient = neon(options.databaseUrl) as SqlClient;
    await executeMigration(sqlClient, sql);
    return ok({
      presetId: options.presetId,
      provider: options.provider,
      sql,
      applied: true,
    });
  } catch (error) {
    return fail('apply_failed', errorMessage(error));
  }
}

/** Apply multiple presets in catalog order. */
export async function applyPresets(
  presetIds: readonly string[],
  provider: PostgresProviderName,
  databaseUrl: string,
  dryRun = false,
): Promise<Result<readonly ApplyPresetResult[]>> {
  const results: ApplyPresetResult[] = [];
  for (const presetId of presetIds) {
    const result = await applyPreset({ presetId, provider, databaseUrl, dryRun });
    if (!result.ok) return result;
    results.push(result.value);
  }
  return ok(results);
}

/** Resolve Postgres provider from DATA_PROVIDER env. */
export function resolvePostgresProvider(
  dataProvider: string | undefined,
): PostgresProviderName | null {
  if (dataProvider === 'supabase' || dataProvider === 'neon' || dataProvider === 'railway') {
    return dataProvider;
  }
  return null;
}

/** Write rendered SQL to infra path (maintainer sync). */
export function renderedMigrationPath(presetId: string, provider: PostgresProviderName): string {
  return `presets/${presetId}/rendered/${provider}.sql`;
}

export function renderPresetSql(manifest: PresetManifest, provider: PostgresProviderName): string {
  return renderPreset(manifest, provider).sql ?? '';
}
