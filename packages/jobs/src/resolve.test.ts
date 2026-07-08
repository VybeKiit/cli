import { it } from '@effect/vitest';
import { resolveJobsProvider, resolveJobsService } from '@vybekiit/jobs/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveJobsProvider', () => {
  it('uses local when cloudflare queue not configured', () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'cloudflare' });
    expect(jobs.name).toBe('local');
  });

  it('enqueues locally', async () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'local' });
    const result = await Effect.runPromise(jobs.enqueue({ name: 'test' }));
    expect(result.id).toContain('local-');
  });
});

describe('resolveJobsService', () => {
  it.effect('fails loud for the unshipped trigger adapter', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveJobsService({ JOBS_PROVIDER: 'trigger' }));
      expect(error.code).toBe('JOBS_PROVIDER_UNSUPPORTED');
      expect(error.message).toContain('trigger');
    }),
  );

  it.effect('fails loud for the unshipped qstash adapter', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveJobsService({ JOBS_PROVIDER: 'qstash' }));
      expect(error.code).toBe('JOBS_PROVIDER_UNSUPPORTED');
      expect(error.message).toContain('qstash');
    }),
  );
});
