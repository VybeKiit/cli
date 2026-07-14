import { type NamecheapConfig, namecheapConfigSchema, parseEnv } from '@vybekiit/core';
import { verifyNamecheapCredentials } from '@vybekiit/deploy';
import { Effect } from 'effect';

export type NamecheapDoctorReport = {
  readonly checked: boolean;
  readonly ok: boolean;
  readonly lines: readonly string[];
};

/**
 * Probe Namecheap API when all registrar env vars are configured.
 *
 * @param env - Process environment to inspect.
 * @returns Doctor report for Namecheap credentials.
 * @example
 * const report = await verifyNamecheapDoctor(process.env);
 */
export const verifyNamecheapDoctor = async (
  env: NodeJS.ProcessEnv,
): Promise<NamecheapDoctorReport> => {
  const hasAny = ['NAMECHEAP_API_USER', 'NAMECHEAP_API_KEY', 'NAMECHEAP_CLIENT_IP'].some((key) =>
    Boolean(env[key]),
  );
  if (!hasAny) {
    return { checked: false, ok: true, lines: [] };
  }

  let config: NamecheapConfig;
  try {
    config = parseEnv(namecheapConfigSchema, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Namecheap configuration';
    return {
      checked: true,
      ok: false,
      lines: [`✗ Namecheap - ${message.split('\n')[0]}`],
    };
  }

  if (!(config.NAMECHEAP_API_USER && config.NAMECHEAP_API_KEY && config.NAMECHEAP_CLIENT_IP)) {
    return { checked: false, ok: true, lines: [] };
  }

  try {
    await Effect.runPromise(verifyNamecheapCredentials(config));
    return {
      checked: true,
      ok: true,
      lines: ['✓ Namecheap - API credentials verified.'],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Namecheap probe failed';
    return {
      checked: true,
      ok: false,
      lines: [`✗ Namecheap - ${message}`],
    };
  }
};
