import { type Result, ok } from '@vybekiit/core';
import type { JobPayload, JobsProvider } from '../types';

const queue: JobPayload[] = [];

export function createLocalJobs(): JobsProvider {
  return {
    name: 'local',
    async enqueue(job: JobPayload): Promise<Result<{ id: string }>> {
      queue.push(job);
      return ok({ id: `local-${queue.length}` });
    },
    async schedule(job: JobPayload, _runAt: Date): Promise<Result<{ id: string }>> {
      queue.push(job);
      return ok({ id: `local-scheduled-${queue.length}` });
    },
    async verifyDelivery() {
      return ok(true);
    },
  };
}
