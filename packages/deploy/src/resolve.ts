import {
  awsConfigSchema,
  awsHostingConfigSchema,
  cloudflareConfigSchema,
  type EnvSource,
  hostingConfigSchema,
  parseEnv,
  railwayHostingConfigSchema,
  resolveEnvProvider,
  vercelConfigSchema,
} from '@vybekiit/core';
import { type AmplifyRunner, createAwsHosting } from './providers/aws';
import { type CloudflareRunner, createCloudflareHosting } from './providers/cloudflare';
import { createRailwayHosting, type RailwayRunner } from './providers/railway';
import { createVercelHosting, type VercelRunner } from './providers/vercel';
import type { Hosting } from './types';

/**
 * Injectable deploy executors, one per host, threaded through {@link resolveHosting} so
 * the caller can supply a real deploy boundary while tests pass fakes that touch no
 * network. Each is optional; omit one and that adapter builds its own default (a live
 * `wrangler` runner for Cloudflare, a real {@link AmplifyClient} for AWS).
 */
export interface HostingRunners {
  /** Cloudflare deploy executor (`wrangler` action runner). */
  readonly cloudflare?: CloudflareRunner;
  /** Vercel deploy executor (`vercel` action runner). */
  readonly vercel?: VercelRunner;
  /** Railway deploy executor (`railway` action runner). */
  readonly railway?: RailwayRunner;
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
  return resolveEnvProvider(
    HOSTING_PROVIDER,
    {
      aws: (source) =>
        createAwsHosting(
          parseEnv(awsConfigSchema, source),
          parseEnv(awsHostingConfigSchema, source),
          runners.aws,
        ),
      vercel: (source) => createVercelHosting(parseEnv(vercelConfigSchema, source), runners.vercel),
      railway: (source) =>
        createRailwayHosting(parseEnv(railwayHostingConfigSchema, source), runners.railway),
      cloudflare: (source) =>
        createCloudflareHosting(parseEnv(cloudflareConfigSchema, source), runners.cloudflare),
    },
    env,
    'cloudflare',
  );
}
