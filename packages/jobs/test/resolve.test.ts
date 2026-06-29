import { describe, expect, it } from 'vitest';
import { resolveJobsProvider } from '../src/resolve';

describe('resolveJobsProvider', () => {
  it('uses local when cloudflare queue not configured', () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'cloudflare' });
    expect(jobs.name).toBe('local');
  });

  it('enqueues locally', async () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'local' });
    const result = await jobs.enqueue({ name: 'test' });
    expect(result.ok).toBe(true);
  });
});
