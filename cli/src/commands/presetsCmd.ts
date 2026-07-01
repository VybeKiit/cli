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

function parseFlags(args: readonly string[]): {
  readonly dryRun: boolean;
  readonly fix: boolean;
  readonly provider?: string;
} {
  let dryRun = false;
  let fix = false;
  let provider: string | undefined;
  for (const arg of args) {
    if (arg === '--dry-run') dryRun = true;
    if (arg === '--fix') fix = true;
    if (arg.startsWith('--provider=')) provider = arg.slice('--provider='.length);
  }
  return { dryRun, fix, ...(provider ? { provider } : {}) };
}

function databaseUrlFromEnv(env: NodeJS.ProcessEnv): string | undefined {
  return env.DATABASE_URL;
}

export async function runApplyPreset(
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> {
  const presetId = args[0];
  const flags = parseFlags(args.slice(1));

  if (!presetId) {
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

  const provider =
    (flags.provider as 'supabase' | 'neon' | 'railway' | undefined) ??
    postgresProviderFromEnv(process.env) ??
    'supabase';
  const databaseUrl = databaseUrlFromEnv(process.env);
  if (!databaseUrl) {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'DATABASE_URL is required to apply presets.',
      }),
      exitCode: 1,
    };
  }

  const result = await applyPreset({
    presetId,
    provider,
    databaseUrl,
    dryRun: flags.dryRun,
  });

  return {
    json: JSON.stringify(result.ok ? { ok: true, ...result.value } : result, null, 2),
    exitCode: result.ok ? 0 : 1,
  };
}

export async function runVerifyPresets(
  args: string[],
): Promise<{ readonly json: string; readonly exitCode: number }> {
  const flags = parseFlags(args);
  const databaseUrl = databaseUrlFromEnv(process.env);
  if (!databaseUrl) {
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
    presetIds.length > 0 ? presetIds : expectedPresetsFromEnv(process.env).map((p) => p.id);

  if (flags.fix && ids.length > 0) {
    const provider = postgresProviderFromEnv(process.env) ?? 'supabase';
    const applied = await applyPresets(ids, provider, databaseUrl);
    if (!applied.ok) {
      return { json: JSON.stringify(applied, null, 2), exitCode: 1 };
    }
  }

  const verification = await verifyPresets(ids, databaseUrl);
  return {
    json: JSON.stringify(verification.ok ? { ...verification.value } : verification, null, 2),
    exitCode: verification.ok && verification.value.ok ? 0 : 1,
  };
}

export function runListPresets(): { readonly json: string; readonly exitCode: number } {
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
}

export function renderPresetPreview(
  presetId: string,
  provider: 'supabase' | 'neon' | 'railway' = 'supabase',
): string {
  const manifest = getPreset(presetId);
  if (!manifest) return '';
  return renderPreset(manifest, provider).sql ?? '';
}
