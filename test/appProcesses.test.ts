import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecResult } from '../src/global/exec';

const exitWith = (code: number): ExecResult => ({ code, stdout: '', stderr: '' });

const processRunners = vi.hoisted(() => ({
  runProcess: vi.fn(async (_command: string, _commandArguments: readonly string[]) => ({
    code: 0,
    stdout: '',
    stderr: '',
  })),
  runLoggedProcess: vi.fn(async (_command: string, _commandArguments: readonly string[]) => ({
    code: 0,
    stdout: '',
    stderr: '',
  })),
}));

vi.mock('../src/global/exec', () => ({ runProcess: processRunners.runProcess }));
vi.mock('../src/lib/setupLog', () => ({ runLoggedProcess: processRunners.runLoggedProcess }));

const { findPnpmCommand } = await import('../src/lib/appProcesses');

beforeEach(() => {
  processRunners.runProcess.mockReset();
  processRunners.runLoggedProcess.mockReset();
  processRunners.runLoggedProcess.mockResolvedValue(exitWith(0));
});

describe('findPnpmCommand', () => {
  it('uses pnpm when it is already installed', async () => {
    processRunners.runProcess.mockResolvedValue(exitWith(0));

    await expect(findPnpmCommand()).resolves.toEqual(['pnpm']);
    expect(processRunners.runLoggedProcess).not.toHaveBeenCalled();
  });

  it('installs pnpm into the user npm prefix when it is missing', async () => {
    processRunners.runProcess.mockResolvedValueOnce(exitWith(127)).mockResolvedValue(exitWith(0));

    await expect(findPnpmCommand()).resolves.toEqual(['pnpm']);
    const [npmCommand, npmArguments] = processRunners.runLoggedProcess.mock.calls[0] || [];
    expect(npmCommand).toBe('npm');
    expect(npmArguments).toEqual(expect.arrayContaining(['--global', '--prefix', 'pnpm@10.33.2']));
  });

  it('falls back to npx when the user install does not work', async () => {
    processRunners.runProcess.mockResolvedValueOnce(exitWith(127)).mockResolvedValue(exitWith(0));
    processRunners.runLoggedProcess.mockResolvedValue(exitWith(1));

    await expect(findPnpmCommand()).resolves.toEqual(['npx', '-y', 'pnpm@10.33.2']);
  });

  it('reports no pnpm when nothing works', async () => {
    processRunners.runProcess.mockResolvedValue(exitWith(1));
    processRunners.runLoggedProcess.mockResolvedValue(exitWith(1));

    await expect(findPnpmCommand()).resolves.toBeNull();
  });
});
