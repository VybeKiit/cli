import { cloudflareConfigSchema, hostingConfigSchema, parseEnv } from '@vybekiit/core';
import { type CloudflareRunner, createCloudflareHosting } from './providers/cloudflare';
import type { Hosting } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/**
 * Construct the configured hosting provider from the environment — the single call
 * site the go-live skill uses, so it never names a host. Reads `HOSTING_PROVIDER`
 * (defaults to `cloudflare`) and parses only that adapter's credentials. The agent
 * swaps hosts by changing one env value.
 *
 * @param env - environment source (defaults to `process.env`)
 * @param runner - passed through to the Cloudflare adapter so the caller can supply
 *   a real deploy executor; omit in tests to keep the result network-free
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}),
 *   or, for `aws`, a not-implemented error until that adapter ships.
 */
export function resolveHosting(env: EnvSource = process.env, runner?: CloudflareRunner): Hosting {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  switch (HOSTING_PROVIDER) {
    case 'aws':
      throw new Error('aws hosting adapter ships in a later step'); // TODO(step-5)
    default:
      return createCloudflareHosting(parseEnv(cloudflareConfigSchema, env), runner);
  }
}
