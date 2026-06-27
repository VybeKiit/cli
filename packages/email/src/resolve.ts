import {
  awsConfigSchema,
  cloudflareConfigSchema,
  emailConfigSchema,
  parseEnv,
} from '@vybekiit/core';
import { type FetchLike, createCloudflareEmail } from './providers/cloudflare';
import { createSesEmail } from './providers/ses';
import type { EmailProvider } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

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
  switch (EMAIL_PROVIDER) {
    case 'ses':
      return createSesEmail(parseEnv(awsConfigSchema, env));
    case 'resend':
      throw new Error('resend email adapter ships in a later step'); // TODO(later)
    default:
      return createCloudflareEmail(parseEnv(cloudflareConfigSchema, env), fetchImpl);
  }
}
