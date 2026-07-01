import { expectedPresetsFromEnv, postgresProviderFromEnv, verifyPresets } from '@vybekiit/db';

export type PresetDoctorReport = {
  readonly checked: boolean;
  readonly ok: boolean;
  readonly lines: readonly string[];
};

/** Verify expected DB presets when DATABASE_URL is configured. */
export async function verifyPresetsDoctor(env: NodeJS.ProcessEnv): Promise<PresetDoctorReport> {
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
      lines: ['✓ DB presets — no feature-specific presets expected yet.'],
    };
  }

  const result = await verifyPresets(
    expected.map((preset) => preset.id),
    databaseUrl,
  );
  if (!result.ok) {
    return {
      checked: true,
      ok: false,
      lines: [`✗ DB presets — verification failed: ${result.error.message}`],
    };
  }

  const lines: string[] = [];
  if (result.value.ok) {
    lines.push(`✓ DB presets — ${result.value.applied.length} feature preset(s) present.`);
  } else {
    lines.push('⚠ DB presets — some feature tables are missing:');
    for (const issue of result.value.issues) {
      lines.push(`  · ${issue.presetId}: ${issue.detail}`);
    }
    lines.push('  Run `vybekiit verify-presets --fix` to apply missing presets.');
  }

  return { checked: true, ok: result.value.ok, lines };
}
