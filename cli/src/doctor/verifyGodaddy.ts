import { type GodaddyConfig, godaddyConfigSchema, parseEnv } from '@vybekiit/core';
import { verifyGodaddyCredentials } from '@vybekiit/deploy';
import { Effect } from 'effect';

export type GodaddyDoctorReport = {
  readonly checked: boolean;
  readonly ok: boolean;
  readonly lines: readonly string[];
};

/**
 * Probe GoDaddy API when all registrar env vars are configured.
 *
 * @param env - Process environment to inspect.
 * @returns Doctor report for GoDaddy credentials.
 * @example
 * const report = await verifyGodaddyDoctor(process.env);
 */
export const verifyGodaddyDoctor = async (env: NodeJS.ProcessEnv): Promise<GodaddyDoctorReport> => {
  const hasAny = ['GODADDY_API_KEY', 'GODADDY_API_SECRET'].some((key) => Boolean(env[key]));
  if (!hasAny) {
    return { checked: false, ok: true, lines: [] };
  }

  let config: GodaddyConfig;
  try {
    config = parseEnv(godaddyConfigSchema, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid GoDaddy configuration';
    return {
      checked: true,
      ok: false,
      lines: [`✗ GoDaddy - ${message.split('\n')[0]}`],
    };
  }

  if (!(config.GODADDY_API_KEY && config.GODADDY_API_SECRET)) {
    return { checked: false, ok: true, lines: [] };
  }

  try {
    await Effect.runPromise(verifyGodaddyCredentials(config));
    return {
      checked: true,
      ok: true,
      lines: ['✓ GoDaddy - API credentials verified.'],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GoDaddy probe failed';
    return {
      checked: true,
      ok: false,
      lines: [`✗ GoDaddy - ${message}`],
    };
  }
};
