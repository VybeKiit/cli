import { type CloudflareJobsConfig, fail, ok, type Result } from '@vybekiit/core';
import type { JobPayload, JobsProvider } from '@vybekiit/jobs/types';

export function createCloudflareJobs(config: CloudflareJobsConfig): JobsProvider {
  return {
    name: 'cloudflare',
    async enqueue(job: JobPayload): Promise<Result<{ id: string }>> {
      if (!config.CLOUDFLARE_QUEUE_NAME) {
        return fail('jobs_not_configured', 'CLOUDFLARE_QUEUE_NAME is required');
      }
      return ok({ id: `cf-queue-${job.name}` });
    },
    async schedule(job: JobPayload, runAt: Date): Promise<Result<{ id: string }>> {
      if (!config.CLOUDFLARE_CRON_SECRET) {
        return fail('jobs_not_configured', 'CLOUDFLARE_CRON_SECRET is required');
      }
      return ok({ id: `cf-cron-${job.name}-${runAt.toISOString()}` });
    },
    async verifyDelivery() {
      if (!config.CLOUDFLARE_QUEUE_NAME) {
        return fail('jobs_not_configured', 'CLOUDFLARE_QUEUE_NAME is required');
      }
      return ok(true);
    },
  };
}
