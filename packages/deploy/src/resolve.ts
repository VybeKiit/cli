import {
  awsConfigSchema,
  awsHostingConfigSchema,
  cloudflareConfigSchema,
  hostingConfigSchema,
  parseEnv,
} from '@vybekiit/core';
import { type AmplifyRunner, createAwsHosting } from './providers/aws';
import { type CloudflareRunner, createCloudflareHosting } from './providers/cloudflare';
import type { Hosting } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/**
 * Injectable deploy executors, one per host, threaded through {@link resolveHosting} so
 * the caller can supply a real deploy boundary while tests pass fakes that touch no
 * network. Each is optional; omit one and that adapter builds its own default (a live
 * `wrangler` runner for Cloudflare, a real {@link AmplifyClient} for AWS).
 */
export interface HostingRunners {
  /** Cloudflare deploy executor (`wrangler` action runner). */
  readonly cloudflare?: CloudflareRunner;
  /** AWS Amplify client used to start/inspect deploy jobs. */
  readonly aws?: AmplifyRunner;
}

/**
 * Construct the configured hosting provider from the environment — the single call
 * site the go-live skill uses, so it never names a host. Reads `HOSTING_PROVIDER`
 * (defaults to `cloudflare`) and parses only that adapter's credentials. The agent
 * swaps hosts by changing one env value.
 *
 * @param env - environment source (defaults to `process.env`)
 * @param runners - per-host injectable executors so the caller can supply a real
 *   deploy boundary; omit in tests to keep the result network-free
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}).
 */
export function resolveHosting(
  env: EnvSource = process.env,
  runners: HostingRunners = {},
): Hosting {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  switch (HOSTING_PROVIDER) {
    case 'aws':
      return createAwsHosting(
        parseEnv(awsConfigSchema, env),
        parseEnv(awsHostingConfigSchema, env),
        runners.aws,
      );
    default:
      return createCloudflareHosting(parseEnv(cloudflareConfigSchema, env), runners.cloudflare);
  }
}
