import { resolveJobsProvider } from '@vybekiit/jobs/resolve';
import { describe, expect, it } from 'vitest';

describe('resolveJobsProvider', () => {
  it('uses local when cloudflare queue not configured', () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'cloudflare' });
    expect(jobs.name).toBe('local');
  });

  it('falls back to local for unshipped trigger provider', () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'trigger' });
    expect(jobs.name).toBe('local');
  });

  it('falls back to local for unshipped qstash provider', () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'qstash' });
    expect(jobs.name).toBe('local');
  });

  it('enqueues locally', async () => {
    const jobs = resolveJobsProvider({ JOBS_PROVIDER: 'local' });
    const result = await jobs.enqueue({ name: 'test' });
    expect(result.ok).toBe(true);
  });
});
