import { createVercelHosting } from '@vybekiit/deploy/providers/vercel';
import { describe, expect, it, vi } from 'vitest';

describe('createVercelHosting', () => {
  it('builds a vercel deploy action and returns the runner URL', async () => {
    const runner = vi.fn(async () => ({ url: 'https://app.vercel.app' }));
    const hosting = createVercelHosting({ VERCEL_TOKEN: 'tok' }, runner);
    const result = await hosting.deploy({ projectName: 'demo', buildDir: '.next' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.url).toBe('https://app.vercel.app');
    expect(runner).toHaveBeenCalledWith({
      command: 'vercel',
      args: ['deploy', '--prod', '--yes', '--token', 'tok', '.next'],
    });
  });

  it('fails loud without a runner', async () => {
    const hosting = createVercelHosting({ VERCEL_TOKEN: 'tok' });
    const result = await hosting.deploy({ projectName: 'demo', buildDir: 'out' });
    expect(result.ok).toBe(false);
  });
});
