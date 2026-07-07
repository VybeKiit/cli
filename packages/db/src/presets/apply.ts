import { neon } from '@neondatabase/serverless';
import type { SqlClient } from '@vybekiit/db/providers/postgres/hybridProvider';
import { DbError } from '@vybekiit/db/types';
import { Effect } from 'effect';
import { getPreset } from './catalog';
import { renderPreset } from './render';
import type { PostgresProviderName, PresetManifest } from './types';

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

/**
 * Build a stable preset failure for agents and CLI output.
 *
 * @param code - Stable preset failure code.
 * @param message - Developer-facing failure message.
 * @returns Effect that fails with DbError.
 * @example
 * const effect = failPreset('not_found', 'Unknown preset.');
 */
const failPreset = (code: string, message: string): Effect.Effect<never, DbError> =>
  Effect.fail(new DbError({ code, message }));

type MigrationSqlClient = SqlClient;

// "a;\n\nb;" -> ["a;", "b;"]
const SQL_BLOCK_SEPARATOR = /\n\n+/;

// "-- note" -> match, "select 1" -> no match
const SQL_COMMENT_ONLY_BLOCK = /^--[^\n]*$/;

/**
 * Execute a rendered SQL migration as blank-line-delimited blocks.
 *
 * @param sql - SQL client capable of executing a string statement.
 * @param migrationSql - Rendered migration SQL.
 * @returns A Promise that resolves after all blocks execute.
 * @example
 * await executeMigration(sql, renderPresetSql(manifest, 'supabase'));
 */
const executeMigration = async (sql: MigrationSqlClient, migrationSql: string): Promise<void> => {
  const blocks = migrationSql
    .split(SQL_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !block.match(SQL_COMMENT_ONLY_BLOCK));
  for (const block of blocks) {
    // biome-ignore lint/performance/noAwaitInLoops: Migration statements must run in rendered order.
    await sql(block);
  }
};

/** Options for applying one preset migration. */
export type ApplyPresetOptions = {
  readonly presetId: string;
  readonly provider: PostgresProviderName;
  readonly databaseUrl: string;
  readonly dryRun?: boolean;
};

/** Result payload for an applied or dry-run preset migration. */
export type ApplyPresetResult = {
  readonly presetId: string;
  readonly provider: PostgresProviderName;
  readonly sql: string;
  readonly applied: boolean;
};

/**
 * Apply a preset migration to a Postgres database via DATABASE_URL.
 *
 * @param options - Preset id, provider, database URL, and optional dry-run flag.
 * @returns An Effect containing the applied SQL metadata or a stable failure.
 * @example
 * const result = await Effect.runPromise(applyPreset({ presetId: 'orders', provider: 'supabase', databaseUrl }));
 */
export const applyPreset = (
  options: ApplyPresetOptions,
): Effect.Effect<ApplyPresetResult, DbError> => {
  const manifest = getPreset(options.presetId);
  if (manifest === undefined) {
    return failPreset('not_found', `Unknown preset "${options.presetId}".`);
  }

  const { sql } = renderPreset(manifest, options.provider);
  if (sql === undefined) {
    return failPreset(
      'unsupported',
      `Preset "${options.presetId}" has no SQL for ${options.provider}.`,
    );
  }

  if (options.dryRun === true) {
    return Effect.succeed({
      presetId: options.presetId,
      provider: options.provider,
      sql,
      applied: false,
    });
  }

  return Effect.tryPromise({
    try: async () => {
      const sqlClient = neon(options.databaseUrl) as SqlClient;
      await executeMigration(sqlClient, sql);
      return {
        presetId: options.presetId,
        provider: options.provider,
        sql,
        applied: true,
      };
    },
    catch: (error) => new DbError({ code: 'apply_failed', message: errorMessage(error) }),
  });
};

/**
 * Apply one preset and append the result to the collected migration list.
 *
 * @param results - Mutable result collector owned by applyPresets.
 * @param presetId - Preset id to apply.
 * @param provider - Postgres provider target.
 * @param databaseUrl - Database connection URL.
 * @param dryRun - Whether to render without executing.
 * @returns Effect that appends one applied preset result.
 * @example
 * const effect = appendAppliedPreset(results, 'orders', 'supabase', databaseUrl, true);
 */
const appendAppliedPreset = (
  results: ApplyPresetResult[],
  presetId: string,
  provider: PostgresProviderName,
  databaseUrl: string,
  dryRun: boolean,
): Effect.Effect<void, DbError> =>
  applyPreset({ presetId, provider, databaseUrl, dryRun }).pipe(
    Effect.map((result) => {
      results.push(result);
    }),
  );

/**
 * Apply multiple presets in the supplied order.
 *
 * @param presetIds - Preset ids to apply.
 * @param provider - Postgres provider target.
 * @param databaseUrl - Database connection URL.
 * @param dryRun - Whether to render without executing.
 * @returns An Effect containing every applied preset, or the first failure.
 * @example
 * const result = await Effect.runPromise(applyPresets(['orders'], 'supabase', databaseUrl, true));
 */
export const applyPresets = (
  presetIds: readonly string[],
  provider: PostgresProviderName,
  databaseUrl: string,
  dryRun = false,
): Effect.Effect<readonly ApplyPresetResult[], DbError> =>
  Effect.gen(function* () {
    const results: ApplyPresetResult[] = [];
    for (const presetId of presetIds) {
      yield* appendAppliedPreset(results, presetId, provider, databaseUrl, dryRun);
    }
    return results;
  });

/**
 * Resolve a Postgres provider from `DATA_PROVIDER`.
 *
 * @param dataProvider - Raw provider value from env.
 * @returns A Postgres provider name, or `null` for non-Postgres providers.
 * @example
 * const provider = resolvePostgresProvider(process.env.DATA_PROVIDER);
 */
export const resolvePostgresProvider = (
  dataProvider: string | undefined,
): PostgresProviderName | null => {
  if (dataProvider === 'supabase' || dataProvider === 'neon' || dataProvider === 'railway') {
    return dataProvider;
  }
  return null;
};

/**
 * Resolve the maintainer path for rendered preset SQL.
 *
 * @param presetId - Preset id being rendered.
 * @param provider - Postgres provider target.
 * @returns Relative path for generated SQL.
 * @example
 * const path = renderedMigrationPath('orders', 'supabase');
 */
export const renderedMigrationPath = (presetId: string, provider: PostgresProviderName): string =>
  `presets/${presetId}/rendered/${provider}.sql`;

/**
 * Render SQL for a Postgres preset.
 *
 * @param manifest - Preset manifest to render.
 * @param provider - Postgres provider target.
 * @returns Rendered SQL.
 * @throws When the renderer does not produce SQL for a Postgres provider.
 * @example
 * const sql = renderPresetSql(manifest, 'supabase');
 */
export const renderPresetSql = (
  manifest: PresetManifest,
  provider: PostgresProviderName,
): string => {
  const rendered = renderPreset(manifest, provider);
  if (rendered.sql === undefined) {
    throw new Error(`Preset "${manifest.id}" did not render SQL for ${provider}.`);
  }
  return rendered.sql;
};
