import { expectedPresetsFromEnv, postgresProviderFromEnv, verifyPresets } from '@vybekiit/db';
import { Effect, Either } from 'effect';

export type PresetDoctorReport = {
  readonly checked: boolean;
  readonly ok: boolean;
  readonly lines: readonly string[];
};

type PresetFailure = {
  readonly message: string;
};

/**
 * Verify expected DB presets when DATABASE_URL is configured.
 *
 * @param env - Process environment to inspect.
 * @returns Doctor report for database feature presets.
 * @example
 * const report = await verifyPresetsDoctor(process.env);
 */
export const verifyPresetsDoctor = async (env: NodeJS.ProcessEnv): Promise<PresetDoctorReport> => {
  const databaseUrl = env.DATABASE_URL;
  const postgres = postgresProviderFromEnv(env);
  if (!(databaseUrl && postgres)) {
    return { checked: false, ok: true, lines: [] };
  }

  const expected = expectedPresetsFromEnv(env);
  if (expected.length === 0) {
    return {
      checked: true,
      ok: true,
      lines: ['✓ DB presets - no feature-specific presets expected yet.'],
    };
  }

  const result = await Effect.runPromise(
    Effect.either(
      verifyPresets(
        expected.map((preset) => preset.id),
        databaseUrl,
      ),
    ),
  );
  if (Either.isLeft(result)) {
    const error: PresetFailure = result.left;
    return {
      checked: true,
      ok: false,
      lines: [`✗ DB presets - verification failed: ${error.message}`],
    };
  }

  const lines: string[] = [];
  if (result.right.ok) {
    lines.push(`✓ DB presets - ${result.right.applied.length} feature preset(s) present.`);
  } else {
    lines.push('⚠ DB presets - some feature tables are missing:');
    for (const issue of result.right.issues) {
      lines.push(`  · ${issue.presetId}: ${issue.detail}`);
    }
    lines.push('  Run `vybekiit verify-presets --fix` to apply missing presets.');
  }

  return { checked: true, ok: result.right.ok, lines };
};
