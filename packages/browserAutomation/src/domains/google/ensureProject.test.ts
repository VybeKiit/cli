import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

import { ensureProject } from '@vybekiit/browser-automation/domains/google/ensureProject';

const silentLog = { log: vi.fn(), warn: vi.fn() };

/** Queue of exit codes, one per spawn call in order (describe, then create). */
const mockExitCodes = (codes: number[]): void => {
  let call = 0;
  spawnMock.mockImplementation(() => {
    const next = codes[call++];
    const code = next === undefined ? 0 : next;
    const child = new EventEmitter();
    queueMicrotask(() => child.emit('close', code));
    return child;
  });
};

beforeEach(() => {
  spawnMock.mockReset();
  silentLog.log.mockReset();
  silentLog.warn.mockReset();
});

describe('ensureProject', () => {
  it('reuses an existing project (describe exits 0, no create)', async () => {
    mockExitCodes([0]);
    const result = await ensureProject('il-alg', silentLog);
    expect(result).toEqual({ projectId: 'il-alg', created: false });
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith(
      'gcloud',
      ['projects', 'describe', 'il-alg', '--quiet'],
      expect.anything(),
    );
  });

  it('creates the project when describe fails', async () => {
    mockExitCodes([1, 0]);
    const result = await ensureProject('new-proj', silentLog);
    expect(result).toEqual({ projectId: 'new-proj', created: true });
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'gcloud',
      ['projects', 'create', 'new-proj', '--quiet'],
      expect.anything(),
    );
  });

  it('throws a plain-language error when create fails', async () => {
    mockExitCodes([1, 1]);
    await expect(ensureProject('taken-id', silentLog)).rejects.toThrow(
      /Could not create GCP project/,
    );
  });
});
