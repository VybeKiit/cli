import { createRailwayHosting } from '@vybekiit/deploy/providers/railway';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

describe('createRailwayHosting', () => {
  it('builds a railway up action and returns the runner URL', async () => {
    const runner = vi.fn(() => Promise.resolve({ url: 'https://demo.up.railway.app' }));
    const hosting = createRailwayHosting({}, runner);
    const result = await Effect.runPromise(hosting.deploy({ projectName: 'demo', buildDir: '.' }));

    expect(result.url).toBe('https://demo.up.railway.app');
    expect(runner).toHaveBeenCalledWith({
      command: 'railway',
      args: ['up', '--detach', '.'],
    });
  });

  it('passes --service when RAILWAY_SERVICE_ID is set', async () => {
    const runner = vi.fn(() => Promise.resolve({ url: 'https://demo.up.railway.app' }));
    const hosting = createRailwayHosting({ RAILWAY_SERVICE_ID: 'svc-1' }, runner);
    await Effect.runPromise(hosting.deploy({ projectName: 'demo', buildDir: 'dist' }));
    expect(runner).toHaveBeenCalledWith({
      command: 'railway',
      args: ['up', '--detach', '--service', 'svc-1', 'dist'],
    });
  });

  it('fails loud without a runner', async () => {
    const hosting = createRailwayHosting({});
    const error = await Effect.runPromise(
      Effect.flip(hosting.deploy({ projectName: 'demo', buildDir: 'out' })),
    );

    expect(error.code).toBe('no_runner');
  });
});
