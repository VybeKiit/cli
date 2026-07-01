import { describe, expect, it, vi } from 'vitest';
import { createRailwayHosting } from '../src/providers/railway';

describe('createRailwayHosting', () => {
  it('builds a railway up action and returns the runner URL', async () => {
    const runner = vi.fn(async () => ({ url: 'https://demo.up.railway.app' }));
    const hosting = createRailwayHosting({}, runner);
    const result = await hosting.deploy({ projectName: 'demo', buildDir: '.' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.url).toBe('https://demo.up.railway.app');
    expect(runner).toHaveBeenCalledWith({
      command: 'railway',
      args: ['up', '--detach', '.'],
    });
  });

  it('passes --service when RAILWAY_SERVICE_ID is set', async () => {
    const runner = vi.fn(async () => ({ url: 'https://demo.up.railway.app' }));
    const hosting = createRailwayHosting({ RAILWAY_SERVICE_ID: 'svc-1' }, runner);
    await hosting.deploy({ projectName: 'demo', buildDir: 'dist' });
    expect(runner).toHaveBeenCalledWith({
      command: 'railway',
      args: ['up', '--detach', '--service', 'svc-1', 'dist'],
    });
  });

  it('fails loud without a runner', async () => {
    const hosting = createRailwayHosting({});
    const result = await hosting.deploy({ projectName: 'demo', buildDir: 'out' });
    expect(result.ok).toBe(false);
  });
});
