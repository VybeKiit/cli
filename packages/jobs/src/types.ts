import type { Result } from '@vybekiit/core';

export type JobsProviderName = 'cloudflare' | 'trigger' | 'qstash' | 'local';

export interface JobPayload {
  readonly name: string;
  readonly data?: Record<string, unknown> | undefined;
}

export interface JobsProvider {
  readonly name: JobsProviderName;
  enqueue(job: JobPayload): Promise<Result<{ id: string }>>;
  schedule(job: JobPayload, runAt: Date): Promise<Result<{ id: string }>>;
  verifyDelivery(): Promise<Result<true>>;
}
