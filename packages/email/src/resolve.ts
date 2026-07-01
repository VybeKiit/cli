import {
  awsConfigSchema,
  cloudflareEmailConfigSchema,
  emailConfigSchema,
  parseEnv,
  resendConfigSchema,
  resolveEnvProvider,
  type EnvSource,
} from '@vybekiit/core';
import { type FetchLike, createCloudflareEmail } from './providers/cloudflare';
import { createSesEmail } from './providers/ses';
import { createResendEmail } from './providers/resend';
import type { EmailProvider } from './types';

/**
 * Construct the configured email provider from the environment — the single call
 * site senders use, so they never name a vendor. Reads `EMAIL_PROVIDER` (defaults to
 * `cloudflare`) and parses only that adapter's credentials. The agent swaps senders
 * by changing one env value.
 *
 * @param env - environment source (defaults to `process.env`)
 * @param fetchImpl - passed through to the Cloudflare adapter so tests can inject a
 *   transport; omit to use `globalThis.fetch`
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}),
 *   or, for `resend`, a not-implemented error until that adapter ships.
 */
export function resolveEmailProvider(
  env: EnvSource = process.env,
  fetchImpl?: FetchLike,
): EmailProvider {
  const { EMAIL_PROVIDER } = parseEnv(emailConfigSchema, env);
  return resolveEnvProvider(
    EMAIL_PROVIDER,
    {
      ses: (source) => createSesEmail(parseEnv(awsConfigSchema, source)),
      resend: (source) => createResendEmail(parseEnv(resendConfigSchema, source)),
      cloudflare: (source) =>
        createCloudflareEmail(parseEnv(cloudflareEmailConfigSchema, source), fetchImpl),
    },
    env,
    'cloudflare',
  );
}
