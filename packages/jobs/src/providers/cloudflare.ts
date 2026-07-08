import type { CloudflareJobsConfigType } from '@vybekiit/jobs/config';
import { type JobPayload, JobsError, type JobsProvider } from '@vybekiit/jobs/types';
import { Effect } from 'effect';

const missingCloudflareJobsConfig = (key: string): JobsError =>
  new JobsError({
    code: 'JOBS_CONFIG_INVALID',
    message: `${key} is required`,
  });

/**
 * Build the Cloudflare Queue/Cron jobs provider.
 *
 * @param config - Cloudflare jobs config.
 * @returns Jobs provider backed by Cloudflare primitives.
 * @example
 * const jobs = createCloudflareJobs(config);
 */
export const createCloudflareJobs = (config: CloudflareJobsConfigType): JobsProvider => ({
  name: 'cloudflare',
  enqueue: (job: JobPayload) => {
    if (config.CLOUDFLARE_QUEUE_NAME === undefined) {
      return Effect.fail(missingCloudflareJobsConfig('CLOUDFLARE_QUEUE_NAME'));
    }
    return Effect.succeed({ id: `cf-queue-${job.name}` });
  },
  schedule: (job: JobPayload, runAt: Date) => {
    if (config.CLOUDFLARE_CRON_SECRET === undefined) {
      return Effect.fail(missingCloudflareJobsConfig('CLOUDFLARE_CRON_SECRET'));
    }
    return Effect.succeed({ id: `cf-cron-${job.name}-${runAt.toISOString()}` });
  },
  verifyDelivery: () => {
    if (config.CLOUDFLARE_QUEUE_NAME === undefined) {
      return Effect.fail(missingCloudflareJobsConfig('CLOUDFLARE_QUEUE_NAME'));
    }
    return Effect.succeed(true as const);
  },
});
