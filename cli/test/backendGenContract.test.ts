import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runBackendGenContract } from '../src/commands/backendCli';

/** Create a temp project with a minimal scaffolded backend. */
const makeBackend = async (): Promise<string> => {
  const cwd = await mkdtemp(join(tmpdir(), 'vyb-genc-'));
  await mkdir(join(cwd, 'backend', 'src'), { recursive: true });
  await writeFile(join(cwd, 'backend', 'src', 'app.ts'), 'export const createApp = () => {};');
  return cwd;
};

describe('runBackendGenContract', () => {
  it('runs the backend gen:contract script when a backend exists', async () => {
    const cwd = await makeBackend();
    const runner = vi.fn((): Promise<void> => Promise.resolve());

    const result = await runBackendGenContract(cwd, runner);

    expect(result.exitCode).toBe(0);
    expect(runner).toHaveBeenCalledWith('npm', ['run', 'gen:contract'], join(cwd, 'backend'));
  });

  it('fails clearly when no backend has been scaffolded', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'vyb-genc-'));
    const runner = vi.fn((): Promise<void> => Promise.resolve());

    const result = await runBackendGenContract(cwd, runner);

    expect(result.exitCode).toBe(1);
    expect(result.message).toContain('No backend/');
    expect(runner).not.toHaveBeenCalled();
  });

  it('reports a helpful message when the script fails', async () => {
    const cwd = await makeBackend();
    const runner = vi.fn((): Promise<void> => Promise.reject(new Error('tsx not found')));

    const result = await runBackendGenContract(cwd, runner);

    expect(result.exitCode).toBe(1);
    expect(result.message).toContain('tsx not found');
  });
});
