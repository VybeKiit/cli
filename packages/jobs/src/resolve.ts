import {
  cloudflareJobsConfigSchema,
  jobsConfigSchema,
  parseEnv,
  resolveEnvProvider,
  type EnvSource,
} from '@vybekiit/core';
import { createCloudflareJobs } from './providers/cloudflare';
import { createLocalJobs } from './providers/local';
import type { JobsProvider } from './types';

export function resolveJobsProvider(env: EnvSource = process.env): JobsProvider {
  const { JOBS_PROVIDER } = parseEnv(jobsConfigSchema, env);
  return resolveEnvProvider(
    JOBS_PROVIDER,
    {
      trigger: () => {
        throw new Error('trigger jobs adapter ships in a later step');
      },
      qstash: () => {
        throw new Error('qstash jobs adapter ships in a later step');
      },
      local: () => createLocalJobs(),
      cloudflare: (source) => {
        const cfJobs = parseEnv(cloudflareJobsConfigSchema, source);
        if (!cfJobs.CLOUDFLARE_QUEUE_NAME) return createLocalJobs();
        return createCloudflareJobs(cfJobs);
      },
    },
    env,
    'cloudflare',
  );
}
