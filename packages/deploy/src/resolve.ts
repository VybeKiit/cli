import {
  awsConfigSchema,
  awsHostingConfigSchema,
  cloudflareConfigSchema,
  type EnvSource,
  hostingConfigSchema,
  parseEnv,
  railwayHostingConfigSchema,
  vercelConfigSchema,
} from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import { caughtMessage, deployError, failDeploy } from './deployEffect';
import { type AmplifyRunner, createAwsHosting } from './providers/aws';
import { type CloudflareRunner, createCloudflareHosting } from './providers/cloudflare';
import { createRailwayHosting, type RailwayRunner } from './providers/railway';
import { createVercelHosting, type VercelRunner } from './providers/vercel';
import type { DeployError, Hosting, HostingProviderName } from './types';

/**
 * Injectable deploy executors, one per host, threaded through {@link resolveHosting} so
 * the caller can supply a real deploy boundary while tests pass fakes that touch no
 * network. Each is optional; omit one and that adapter builds its own default (a live
 * `wrangler` runner for Cloudflare, a real {@link AmplifyClient} for AWS).
 */
export type HostingRunners = {
  /** Cloudflare deploy executor (`wrangler` action runner). */
  readonly cloudflare?: CloudflareRunner;
  /** Vercel deploy executor (`vercel` action runner). */
  readonly vercel?: VercelRunner;
  /** Railway deploy executor (`railway` action runner). */
  readonly railway?: RailwayRunner;
  /** AWS Amplify client used to start/inspect deploy jobs. */
  readonly aws?: AmplifyRunner;
};

type HostingFactory = (source: EnvSource) => Effect.Effect<Hosting, DeployError>;

/**
 * Decode one deploy config slice into a typed Effect error.
 *
 * @param schema - Config schema for the selected deploy concern.
 * @param source - Environment source to decode.
 * @returns An Effect containing decoded config or a DeployError.
 * @example
 * const config = await Effect.runPromise(parseDeployConfigSlice(hostingConfigSchema, process.env));
 */
const parseDeployConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, DeployError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      deployError('config_invalid', caughtMessage(caught, 'Invalid deploy config')),
  });

/**
 * Build the provider factory table from injectable host runners.
 *
 * @param runners - Optional per-host executors supplied by tests or composition roots.
 * @returns Provider factory table keyed by hosting provider name.
 * @example
 * const factories = makeHostingFactories({ cloudflare: runner });
 */
const makeHostingFactories = (
  runners: HostingRunners,
): Partial<Record<HostingProviderName, HostingFactory>> => ({
  aws: (source) =>
    Effect.gen(function* () {
      const config = yield* parseDeployConfigSlice(awsConfigSchema, source);
      const hosting = yield* parseDeployConfigSlice(awsHostingConfigSchema, source);
      return createAwsHosting(config, hosting, runners.aws);
    }),
  vercel: (source) =>
    parseDeployConfigSlice(vercelConfigSchema, source).pipe(
      Effect.map((config) => createVercelHosting(config, runners.vercel)),
    ),
  railway: (source) =>
    parseDeployConfigSlice(railwayHostingConfigSchema, source).pipe(
      Effect.map((config) => createRailwayHosting(config, runners.railway)),
    ),
  cloudflare: (source) =>
    parseDeployConfigSlice(cloudflareConfigSchema, source).pipe(
      Effect.map((config) => createCloudflareHosting(config, runners.cloudflare)),
    ),
});

/**
 * Resolve a provider factory without falling back to another host.
 *
 * @param provider - Parsed hosting provider name.
 * @param factories - Registered hosting provider factories.
 * @returns An Effect containing the matching factory or a DeployError.
 * @example
 * const factory = await Effect.runPromise(findHostingFactory('cloudflare', factories));
 */
const findHostingFactory = (
  provider: HostingProviderName,
  factories: Partial<Record<HostingProviderName, HostingFactory>>,
): Effect.Effect<HostingFactory, DeployError> => {
  const createHosting = factories[provider];
  if (createHosting === undefined) {
    return failDeploy(
      'hosting_provider_unsupported',
      `No hosting adapter is registered for provider ${provider}.`,
    );
  }

  return Effect.succeed(createHosting);
};

/**
 * Construct the configured hosting provider from the environment — the single call
 * site the go-live skill uses, so it never names a host. Reads `HOSTING_PROVIDER`
 * (defaults to `cloudflare`) and parses only that adapter's credentials. The agent
 * swaps hosts by changing one env value.
 *
 * @param env - Environment source to decode.
 * @param runners - per-host injectable executors so the caller can supply a real
 *   deploy boundary; omit in tests to keep the result network-free.
 * @returns An Effect containing the configured hosting provider.
 * @example
 * const hosting = await Effect.runPromise(resolveHosting(process.env));
 */
export const resolveHosting = (
  env: EnvSource = process.env,
  runners: HostingRunners = {},
): Effect.Effect<Hosting, DeployError> =>
  parseDeployConfigSlice(hostingConfigSchema, env).pipe(
    Effect.flatMap(({ HOSTING_PROVIDER }) =>
      findHostingFactory(HOSTING_PROVIDER, makeHostingFactories(runners)).pipe(
        Effect.flatMap((createHosting) => createHosting(env)),
      ),
    ),
  );

/** Injectable hosting service used by deploy composition roots. */
export class HostingService extends Context.Tag('@vybekiit/deploy/Hosting')<
  HostingService,
  Hosting
>() {}

/**
 * Build the live hosting Layer from an environment source.
 *
 * @param env - Environment source used to select and configure the host.
 * @param runners - Optional per-host executors supplied by composition roots.
 * @returns A Layer that provides HostingService or fails with DeployError.
 * @example
 * const layer = makeHostingLive(process.env);
 */
export const makeHostingLive = (
  env: EnvSource = process.env,
  runners: HostingRunners = {},
): Layer.Layer<HostingService, DeployError> =>
  Layer.effect(HostingService, resolveHosting(env, runners));
