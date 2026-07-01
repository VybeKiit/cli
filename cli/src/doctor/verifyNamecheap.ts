import { type NamecheapConfig, parseEnv, namecheapConfigSchema } from '@vybekiit/core';
import { verifyNamecheapCredentials } from '@vybekiit/deploy';

export type NamecheapDoctorReport = {
  readonly checked: boolean;
  readonly ok: boolean;
  readonly lines: readonly string[];
};

/** Probe Namecheap API when all registrar env vars are configured. */
export async function verifyNamecheapDoctor(
  env: NodeJS.ProcessEnv,
): Promise<NamecheapDoctorReport> {
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
      lines: [`✗ Namecheap — ${message.split('\n')[0]}`],
    };
  }

  if (!(config.NAMECHEAP_API_USER && config.NAMECHEAP_API_KEY && config.NAMECHEAP_CLIENT_IP)) {
    return { checked: false, ok: true, lines: [] };
  }

  try {
    await verifyNamecheapCredentials(config);
    return {
      checked: true,
      ok: true,
      lines: ['✓ Namecheap — API credentials verified.'],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Namecheap probe failed';
    return {
      checked: true,
      ok: false,
      lines: [`✗ Namecheap — ${message}`],
    };
  }
}
