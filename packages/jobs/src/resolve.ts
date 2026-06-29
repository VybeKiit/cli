import { cloudflareJobsConfigSchema, jobsConfigSchema, parseEnv } from '@vybekiit/core';
import { createCloudflareJobs } from './providers/cloudflare';
import { createLocalJobs } from './providers/local';
import type { JobsProvider } from './types';

type EnvSource = Record<string, string | undefined>;

export function resolveJobsProvider(env: EnvSource = process.env): JobsProvider {
  const { JOBS_PROVIDER } = parseEnv(jobsConfigSchema, env);
  switch (JOBS_PROVIDER) {
    case 'trigger':
    case 'qstash':
      throw new Error(`${JOBS_PROVIDER} jobs adapter ships in a later step`);
    case 'local':
      return createLocalJobs();
    default: {
      const cfJobs = parseEnv(cloudflareJobsConfigSchema, env);
      if (!cfJobs.CLOUDFLARE_QUEUE_NAME) return createLocalJobs();
      return createCloudflareJobs(cfJobs);
    }
  }
}
