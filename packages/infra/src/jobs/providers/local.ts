import type { JobPayload, JobsProvider } from '@vybekiit/infra/jobs/types';
import { Effect } from 'effect';

const queue: JobPayload[] = [];

/**
 * Build the in-memory jobs provider for local development and unshipped adapters.
 *
 * @returns Jobs provider backed by process memory.
 * @example
 * const jobs = createLocalJobs();
 */
export const createLocalJobs = (): JobsProvider => ({
  name: 'local',
  enqueue: (job: JobPayload) =>
    Effect.sync(() => {
      queue.push(job);
      return { id: `local-${queue.length}` };
    }),
  schedule: (job: JobPayload, _runAt: Date) =>
    Effect.sync(() => {
      queue.push(job);
      return { id: `local-scheduled-${queue.length}` };
    }),
  verifyDelivery: () => Effect.succeed(true as const),
});
