import { resolve } from 'node:path';
import process from 'node:process';
import {
  ALL_PRESETS,
  applyPreset,
  applyPresets,
  expectedPresetsFromEnv,
  getPreset,
  postgresProviderFromEnv,
  renderPreset,
  verifyPresets,
} from '@vybekiit/db';
import { Effect, Either } from 'effect';
import { loadEnvFile, mergeEnv } from '../doctor/env';
import { hasBoolFlag, readFlagValue } from '../lib/argvFlags';

type PostgresProvider = 'supabase' | 'neon' | 'railway';
type NosqlProvider = 'mongodb' | 'firebase' | 'aws';
type PresetProvider = PostgresProvider | NosqlProvider;

const POSTGRES_PROVIDERS: readonly PostgresProvider[] = ['supabase', 'neon', 'railway'];
const NOSQL_PROVIDERS: readonly NosqlProvider[] = ['mongodb', 'firebase', 'aws'];
const PRESET_PROVIDERS: readonly PresetProvider[] = [...POSTGRES_PROVIDERS, ...NOSQL_PROVIDERS];

type PresetFailure = {
  readonly code: string;
  readonly message: string;
};

type PresetResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: PresetFailure };

/**
 * Convert a tagged preset error into stable command JSON.
 *
 * @param error - Preset failure from the db package.
 * @returns Serializable failure payload.
 * @example
 * const failure = serializePresetFailure(error);
 */
const serializePresetFailure = (error: PresetFailure): PresetFailure => ({
  code: error.code,
  message: error.message,
});

/**
 * Run a preset Effect at the CLI boundary and preserve the command result shape.
 *
 * @param effect - Preset Effect to execute.
 * @returns Result-shaped payload for existing CLI formatting.
 */
const runPresetEffect = async <T>(
  effect: Effect.Effect<T, PresetFailure>,
): Promise<PresetResult<T>> => {
  const either = await Effect.runPromise(Effect.either(effect));
  if (Either.isLeft(either)) {
    return { ok: false, error: serializePresetFailure(either.left) };
  }
  return { ok: true, value: either.right };
};

/**
 * Parse preset command flags.
 *
 * @param args - CLI arguments to scan.
 * @returns Parsed dry-run, fix, provider, and cwd flags.
 * @example
 * const flags = parseFlags(['--provider=supabase', '--dry-run', '--cwd=./app']);
 */
const parseFlags = (
  args: readonly string[],
): {
  readonly dryRun: boolean;
  readonly fix: boolean;
  readonly provider?: string;
  readonly cwd?: string;
} => {
  const provider = readFlagValue(args, 'provider');
  const cwd = readFlagValue(args, 'cwd');
  return {
    dryRun: hasBoolFlag(args, 'dry-run'),
    fix: hasBoolFlag(args, 'fix'),
    ...(provider !== undefined && provider !== '' ? { provider } : {}),
    ...(cwd !== undefined && cwd !== '' ? { cwd } : {}),
  };
};

/**
 * Build the env used for preset commands (process env + optional project `.env`).
 *
 * @param cwd - Optional project directory from `--cwd`.
 * @returns Merged environment; when cwd is set, file values win over process.env.
 * @example
 * const env = resolvePresetEnv('./my-app');
 */
const resolvePresetEnv = (cwd: string | undefined): NodeJS.ProcessEnv => {
  if (cwd === undefined || cwd === '') {
    return process.env;
  }
  const absolute = resolve(process.cwd(), cwd);
  return mergeEnv(process.env, loadEnvFile(absolute)) as NodeJS.ProcessEnv;
};

/**
 * Read the database URL from an environment object.
 *
 * @param env - Environment source to read.
 * @returns Database URL when configured.
 * @example
 * const databaseUrl = databaseUrlFromEnv(process.env);
 */
const databaseUrlFromEnv = (env: NodeJS.ProcessEnv): string | undefined => env.DATABASE_URL;

/**
 * Whether a provider is a NoSQL target.
 *
 * @param provider - Resolved preset provider.
 * @returns True for mongodb, firebase, or aws.
 * @example
 * const nosql = isNosqlProvider('mongodb');
 */
const isNosqlProvider = (provider: PresetProvider): provider is NosqlProvider =>
  provider === 'mongodb' || provider === 'firebase' || provider === 'aws';

/**
 * Resolve connection URL for apply-preset.
 *
 * Postgres uses DATABASE_URL. MongoDB accepts DATABASE_URL or MONGODB_URI.
 * Firebase/AWS dry-run does not need a URL; live apply uses SDK env credentials.
 *
 * @param provider - Resolved provider.
 * @param env - Environment source.
 * @returns Connection URL when present.
 * @example
 * const url = connectionUrlForProvider('mongodb', process.env);
 */
const connectionUrlForProvider = (
  provider: PresetProvider,
  env: NodeJS.ProcessEnv,
): string | undefined => {
  if (provider === 'mongodb') {
    const mongoUri = env.MONGODB_URI;
    const databaseUrl = env.DATABASE_URL;
    if (databaseUrl !== undefined && databaseUrl !== '') {
      return databaseUrl;
    }
    if (mongoUri !== undefined && mongoUri !== '') {
      return mongoUri;
    }
    return;
  }
  return databaseUrlFromEnv(env);
};

/**
 * Resolve the postgres provider for verify-presets (--fix still applies SQL).
 *
 * @param explicit - Optional provider flag value.
 * @param env - Environment source used when no explicit provider is passed.
 * @returns Supported postgres provider, or undefined for an unsupported explicit value.
 * @example
 * const provider = resolvePostgresProvider('supabase', process.env);
 */
const resolvePostgresProvider = (
  explicit: string | undefined,
  env: NodeJS.ProcessEnv,
): PostgresProvider | undefined => {
  if (explicit !== undefined) {
    return POSTGRES_PROVIDERS.find((provider) => provider === explicit);
  }

  const envProvider = postgresProviderFromEnv(env);
  if (envProvider !== null) {
    return envProvider;
  }

  return 'supabase';
};

/**
 * Resolve any supported preset provider (Postgres + NoSQL).
 *
 * @param explicit - Optional provider flag value.
 * @param env - Environment source used when no explicit provider is passed.
 * @returns Supported provider, or undefined for an unsupported explicit value.
 * @example
 * const provider = resolvePresetProvider('mongodb', process.env);
 */
const resolvePresetProvider = (
  explicit: string | undefined,
  env: NodeJS.ProcessEnv,
): PresetProvider | undefined => {
  if (explicit !== undefined) {
    return PRESET_PROVIDERS.find((provider) => provider === explicit);
  }

  const envProvider = postgresProviderFromEnv(env);
  if (envProvider !== null) {
    return envProvider;
  }

  const dataProvider = env.DATA_PROVIDER;
  if (
    dataProvider === 'mongodb' ||
    dataProvider === 'firebase' ||
    dataProvider === 'aws' ||
    dataProvider === 'supabase' ||
    dataProvider === 'neon' ||
    dataProvider === 'railway'
  ) {
    return dataProvider;
  }

  return 'supabase';
};

/**
 * Apply one database preset.
 *
 * @param args - CLI arguments after `apply-preset`.
 * @returns JSON apply report plus the process exit code.
 */
export const runApplyPreset = async (
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  // Allow `apply-preset --cwd=./app orders` or `apply-preset orders --cwd=./app`.
  const flags = parseFlags(args);
  const presetId = args.find((arg) => !arg.startsWith('--') && arg !== flags.cwd);

  if (presetId === undefined || presetId === '') {
    return {
      json: JSON.stringify({ ok: false, error: 'Pass a preset id (e.g. orders, organizations).' }),
      exitCode: 1,
    };
  }

  const manifest = getPreset(presetId);
  if (!manifest) {
    return {
      json: JSON.stringify({ ok: false, error: `Unknown preset "${presetId}".` }),
      exitCode: 1,
    };
  }

  const env = resolvePresetEnv(flags.cwd);
  const provider = resolvePresetProvider(flags.provider, env);
  if (provider === undefined) {
    return {
      json: JSON.stringify({
        ok: false,
        error: `Unsupported preset provider: ${flags.provider}. Use supabase|neon|railway|mongodb|firebase|aws.`,
      }),
      exitCode: 1,
    };
  }

  const dryRun = flags.dryRun === true;
  const databaseUrl = connectionUrlForProvider(provider, env);
  const missingUrl = databaseUrl === undefined || databaseUrl === '';

  // Dry-run never needs a live connection. Postgres live apply always needs DATABASE_URL.
  // MongoDB live apply needs DATABASE_URL or MONGODB_URI. Firebase/AWS live use SDK env.
  if (missingUrl && !dryRun && !isNosqlProvider(provider)) {
    return {
      json: JSON.stringify({
        ok: false,
        error:
          'DATABASE_URL is required to apply presets. Pass --cwd=./your-app if .env lives there, or --dry-run to preview.',
      }),
      exitCode: 1,
    };
  }
  if (missingUrl && provider === 'mongodb' && !dryRun) {
    return {
      json: JSON.stringify({
        ok: false,
        error:
          'DATABASE_URL or MONGODB_URI is required to apply MongoDB presets. Pass --cwd=./your-app if .env lives there, or --dry-run to preview.',
      }),
      exitCode: 1,
    };
  }

  // Dry-run may run offline with no URL; live paths already rejected missingUrl above.
  const connectionUrl = databaseUrl === undefined ? '' : databaseUrl;

  const result = await runPresetEffect(
    applyPreset({
      presetId,
      provider,
      databaseUrl: connectionUrl,
      dryRun,
    }),
  );

  return {
    json: JSON.stringify(
      result.ok
        ? {
            ok: true,
            ...result.value,
            ...(flags.cwd === undefined ? {} : { cwd: resolve(process.cwd(), flags.cwd) }),
          }
        : result,
      null,
      2,
    ),
    exitCode: result.ok ? 0 : 1,
  };
};

/**
 * Verify configured database presets and optionally apply missing ones.
 *
 * @param args - CLI arguments after `verify-presets`.
 * @returns JSON verification report plus the process exit code.
 */
export const runVerifyPresets = async (
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  const flags = parseFlags(args);
  const env = resolvePresetEnv(flags.cwd);
  const databaseUrl = databaseUrlFromEnv(env);
  if (databaseUrl === undefined || databaseUrl === '') {
    return {
      json: JSON.stringify({
        ok: false,
        error:
          'DATABASE_URL is required to verify presets. Pass --cwd=./your-app if .env lives there.',
      }),
      exitCode: 1,
    };
  }

  const presetIds = flags.fix
    ? expectedPresetsFromEnv(env).map((preset) => preset.id)
    : args.filter((arg) => !arg.startsWith('--') && arg !== flags.cwd);

  const ids =
    presetIds.length > 0 ? presetIds : expectedPresetsFromEnv(env).map((preset) => preset.id);

  if (flags.fix && ids.length > 0) {
    const provider = resolvePostgresProvider(flags.provider, env);
    if (provider === undefined) {
      return {
        json: JSON.stringify({
          ok: false,
          error: `Unsupported preset provider: ${flags.provider}`,
        }),
        exitCode: 1,
      };
    }

    const applied = await runPresetEffect(applyPresets(ids, provider, databaseUrl));
    if (!applied.ok) {
      return { json: JSON.stringify(applied, null, 2), exitCode: 1 };
    }
  }

  const verification = await runPresetEffect(verifyPresets(ids, databaseUrl));
  return {
    json: JSON.stringify(verification.ok ? { ...verification.value } : verification, null, 2),
    exitCode: verification.ok && verification.value.ok ? 0 : 1,
  };
};

/**
 * List available database presets.
 *
 * @returns JSON preset list plus a successful process exit code.
 */
export const runListPresets = (): { readonly json: string; readonly exitCode: number } => {
  const presets = ALL_PRESETS.map((preset) => ({
    id: preset.id,
    description: preset.description,
    skills: preset.skills,
    packages: preset.packages,
    capabilities: preset.capabilities,
    providers: preset.providers,
  }));
  return {
    json: JSON.stringify({ ok: true, presets }, null, 2),
    exitCode: 0,
  };
};

/**
 * Render SQL preview text for one preset/provider pair.
 *
 * @param presetId - Preset id to preview.
 * @param provider - Postgres provider to render for.
 * @returns SQL preview, or undefined when the preset id is unknown or has no SQL preview.
 * @example
 * const sql = renderPresetPreview('orders', 'supabase');
 */
export const renderPresetPreview = (
  presetId: string,
  provider: PostgresProvider = 'supabase',
): string | undefined => {
  const manifest = getPreset(presetId);
  if (manifest === undefined) {
    return;
  }
  return renderPreset(manifest, provider).sql;
};
