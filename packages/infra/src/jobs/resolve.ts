import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  CloudflareJobsConfigSchema,
  JobsConfigSchema,
  type JobsConfigType,
  type JobsProviderNameType,
} from './config';
import { createCloudflareJobs } from './providers/cloudflare';
import { createLocalJobs } from './providers/local';
import { JobsError, type JobsProvider, type JobsService } from './types';

/** Injectable jobs service tag used by composition roots and tests. */
export class Jobs extends Context.Tag('@vybekiit/infra/jobs/Jobs')<Jobs, JobsService>() {}

type JobsFactory = (source: EnvSource) => Effect.Effect<JobsService, JobsError>;

const jobsFactories: Partial<Record<JobsProviderNameType, JobsFactory>> = {
  cloudflare: (source) =>
    parseJobsConfigSlice(CloudflareJobsConfigSchema, source).pipe(
      Effect.map((config) => {
        if (config.CLOUDFLARE_QUEUE_NAME === undefined) {
          return createLocalJobs();
        }
        return createCloudflareJobs(config);
      }),
    ),
  local: () => Effect.succeed(createLocalJobs()),
};

const jobsErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseJobsConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, JobsError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new JobsError({
        code: 'JOBS_CONFIG_INVALID',
        message: jobsErrorMessage(caught),
      }),
  });

const findJobsFactory = (provider: JobsProviderNameType): Effect.Effect<JobsFactory, JobsError> => {
  const createProvider = jobsFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new JobsError({
        code: 'JOBS_PROVIDER_UNSUPPORTED',
        message: `No jobs provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured jobs service from environment config.
 *
 * @param source - Raw environment source to decode.
 * @returns An Effect that succeeds with the configured jobs service or fails with JobsError.
 * @example
 * const jobs = await Effect.runPromise(resolveJobsService({ JOBS_PROVIDER: 'local' }));
 */
export const resolveJobsService = (
  source: EnvSource = process.env,
): Effect.Effect<JobsService, JobsError> =>
  parseJobsConfigSlice(JobsConfigSchema, source).pipe(
    Effect.flatMap(({ JOBS_PROVIDER }: JobsConfigType) =>
      findJobsFactory(JOBS_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source)),
      ),
    ),
  );

/**
 * Build the configured jobs Layer from environment values.
 *
 * @param source - Raw environment source to decode.
 * @returns A Layer that provides Jobs or fails with JobsError during construction.
 * @example
 * const layer = makeJobsLive({ JOBS_PROVIDER: 'local' });
 */
export const makeJobsLive = (source: EnvSource = process.env): Layer.Layer<Jobs, JobsError> =>
  Layer.effect(Jobs, resolveJobsService(source));

/**
 * Resolve the configured jobs provider from environment config.
 *
 * @param source - Raw environment source to decode.
 * @returns Configured jobs provider.
 * @example
 * const jobs = resolveJobsProvider(process.env);
 */
export const resolveJobsProvider = (source: EnvSource = process.env): JobsProvider =>
  Effect.runSync(resolveJobsService(source));
