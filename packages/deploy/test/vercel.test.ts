import { createVercelHosting } from '@vybekiit/deploy/providers/vercel';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

describe('createVercelHosting', () => {
  it('builds a vercel deploy action and returns the runner URL', async () => {
    const runner = vi.fn(() => Promise.resolve({ url: 'https://app.vercel.app' }));
    const hosting = createVercelHosting({ VERCEL_TOKEN: 'tok' }, runner);
    const result = await Effect.runPromise(
      hosting.deploy({ projectName: 'demo', buildDir: '.next' }),
    );

    expect(result.url).toBe('https://app.vercel.app');
    expect(runner).toHaveBeenCalledWith({
      command: 'vercel',
      args: ['deploy', '--prod', '--yes', '--token', 'tok', '.next'],
    });
  });

  it('fails loud without a runner', async () => {
    const hosting = createVercelHosting({ VERCEL_TOKEN: 'tok' });
    const error = await Effect.runPromise(
      Effect.flip(hosting.deploy({ projectName: 'demo', buildDir: 'out' })),
    );

    expect(error.code).toBe('no_runner');
  });
});
