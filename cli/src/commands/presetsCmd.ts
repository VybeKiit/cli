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

type PostgresProvider = 'supabase' | 'neon' | 'railway';

const POSTGRES_PROVIDERS: readonly PostgresProvider[] = ['supabase', 'neon', 'railway'];

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
 * @example
 * const result = await runPresetEffect(applyPreset(options));
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
 * @returns Parsed dry-run, fix, and provider flags.
 * @example
 * const flags = parseFlags(['--provider=supabase', '--dry-run']);
 */
const parseFlags = (
  args: readonly string[],
): {
  readonly dryRun: boolean;
  readonly fix: boolean;
  readonly provider?: string;
} => {
  let dryRun = false;
  let fix = false;
  let provider: string | undefined;
  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    }
    if (arg === '--fix') {
      fix = true;
    }
    if (arg.startsWith('--provider=')) {
      provider = arg.slice('--provider='.length);
    }
  }
  return { dryRun, fix, ...(provider !== undefined && provider !== '' ? { provider } : {}) };
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
 * Resolve the postgres provider for preset commands.
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
 * Apply one database preset.
 *
 * @param args - CLI arguments after `apply-preset`.
 * @returns JSON apply report plus the process exit code.
 * @example
 * const result = await runApplyPreset(['orders', '--provider=supabase']);
 */
export const runApplyPreset = async (
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  const [presetId] = args;
  const flags = parseFlags(args.slice(1));

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

  const provider = resolvePostgresProvider(flags.provider, process.env);
  if (provider === undefined) {
    return {
      json: JSON.stringify({ ok: false, error: `Unsupported preset provider: ${flags.provider}` }),
      exitCode: 1,
    };
  }

  const databaseUrl = databaseUrlFromEnv(process.env);
  if (databaseUrl === undefined || databaseUrl === '') {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'DATABASE_URL is required to apply presets.',
      }),
      exitCode: 1,
    };
  }

  const result = await runPresetEffect(
    applyPreset({
      presetId,
      provider,
      databaseUrl,
      dryRun: flags.dryRun,
    }),
  );

  return {
    json: JSON.stringify(result.ok ? { ok: true, ...result.value } : result, null, 2),
    exitCode: result.ok ? 0 : 1,
  };
};

/**
 * Verify configured database presets and optionally apply missing ones.
 *
 * @param args - CLI arguments after `verify-presets`.
 * @returns JSON verification report plus the process exit code.
 * @example
 * const result = await runVerifyPresets(['--fix']);
 */
export const runVerifyPresets = async (
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  const flags = parseFlags(args);
  const databaseUrl = databaseUrlFromEnv(process.env);
  if (databaseUrl === undefined || databaseUrl === '') {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'DATABASE_URL is required to verify presets.',
      }),
      exitCode: 1,
    };
  }

  const presetIds = flags.fix
    ? expectedPresetsFromEnv(process.env).map((preset) => preset.id)
    : args.filter((arg) => !arg.startsWith('--'));

  const ids =
    presetIds.length > 0
      ? presetIds
      : expectedPresetsFromEnv(process.env).map((preset) => preset.id);

  if (flags.fix && ids.length > 0) {
    const provider = resolvePostgresProvider(flags.provider, process.env);
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
 * @example
 * const result = runListPresets();
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
