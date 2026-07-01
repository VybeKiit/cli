import {
  type CloudflareEmailConfig,
  parseEnv,
  cloudflareEmailConfigSchema,
  emailConfigSchema,
} from '@vybekiit/core';

export type EmailWorkerDoctorReport = {
  readonly checked: boolean;
  readonly ok: boolean;
  readonly lines: readonly string[];
};

function healthUrl(endpoint: string): string {
  const url = new URL(endpoint);
  url.pathname = url.pathname.replace(/\/send\/?$/, '/health');
  if (!url.pathname.endsWith('/health')) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/health`;
  }
  return url.toString();
}

/** Probe the Cloudflare email worker when cloudflare email is configured. */
export async function verifyEmailWorkerDoctor(
  env: NodeJS.ProcessEnv,
): Promise<EmailWorkerDoctorReport> {
  const { EMAIL_PROVIDER } = parseEnv(emailConfigSchema, env);
  if (EMAIL_PROVIDER !== 'cloudflare') {
    return { checked: false, ok: true, lines: [] };
  }

  if (!env.CLOUDFLARE_EMAIL_ENDPOINT) {
    return {
      checked: true,
      ok: false,
      lines: [
        '⚠ Email worker — set CLOUDFLARE_EMAIL_ENDPOINT after deploying packages/email/worker.',
      ],
    };
  }

  let config: CloudflareEmailConfig;
  try {
    config = parseEnv(cloudflareEmailConfigSchema, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid email configuration';
    return {
      checked: true,
      ok: false,
      lines: [`✗ Email worker — ${message.split('\n')[0]}`],
    };
  }

  try {
    const response = await fetch(healthUrl(config.CLOUDFLARE_EMAIL_ENDPOINT));
    if (!response.ok) {
      return {
        checked: true,
        ok: false,
        lines: [`✗ Email worker — health check returned ${response.status}.`],
      };
    }
    const body = (await response.json()) as { ok?: boolean };
    if (!body.ok) {
      return {
        checked: true,
        ok: false,
        lines: ['✗ Email worker — health check did not return ok.'],
      };
    }
    return {
      checked: true,
      ok: true,
      lines: ['✓ Email worker — health check passed.'],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email worker unreachable';
    return {
      checked: true,
      ok: false,
      lines: [`✗ Email worker — ${message}`],
    };
  }
}
