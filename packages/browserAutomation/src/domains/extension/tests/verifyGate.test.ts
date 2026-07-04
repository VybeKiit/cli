import { EventEmitter } from 'node:events';
import type { VerbContext } from '@vybekiit/browserAutomation/domains/extension/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

import { runVerifyGate } from '@vybekiit/browserAutomation/domains/extension/verifyGate';

beforeEach(() => {
  spawnMock.mockReset();
  spawnMock.mockImplementation(() => {
    const child = new EventEmitter();
    queueMicrotask(() => child.emit('close', 0));
    return child;
  });
});

describe('runVerifyGate', () => {
  it('forces the package test step into test mode even when the parent CLI loaded production env', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await runVerifyGate(createContext());
    } finally {
      if (originalNodeEnv === undefined) {
        process.env.NODE_ENV = undefined;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
    }

    expect(spawnMock).toHaveBeenCalledWith(
      'pnpm',
      ['--filter', './extensions/batchbeam-prompt-queue', 'test'],
      expect.objectContaining({
        env: expect.objectContaining({ NODE_ENV: 'test' }),
      }),
    );
  });
});

function createContext(): VerbContext {
  return {
    extension: {
      chromeWebStoreId: 'lidnnjbepijjbbphbdhcchgpckpcbgfm',
      dir: '/repo/extensions/batchbeam-prompt-queue',
      key: 'batchbeam-prompt-queue',
      name: 'BatchBeam Prompt Queue',
    },
    log: {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
    },
    repoRoot: '/repo',
  };
}
