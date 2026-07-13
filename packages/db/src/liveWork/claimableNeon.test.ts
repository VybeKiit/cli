import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sqlMock = vi.fn(async () => [{ ok: 1 }]);

vi.mock('@neondatabase/serverless', () => ({
  neon: () => sqlMock,
}));

import { createClaimableNeon, verifyDatabaseUrl } from './claimableNeon';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

// "quota_exceeded|rate limit" -> match hop-classed failure
const QUOTA_FAILURE_PATTERN = /quota_exceeded|rate limit/i;

describe('createClaimableNeon', () => {
  it('maps a successful neon.new response', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        id: 'db-1',
        connection_string: 'postgresql://claimable/db',
        claim_url: 'https://neon.new/claim/db-1',
      }),
    );

    const provisioned = await run(
      createClaimableNeon({ ref: 'vybekiit-test', fetchImpl: fetchImpl as typeof fetch }),
    );

    expect(provisioned).toEqual({
      provider: 'neon',
      databaseUrl: 'postgresql://claimable/db',
      claimUrl: 'https://neon.new/claim/db-1',
      claimableId: 'db-1',
      ephemeral: true,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://neon.new/api/v1/database',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('classifies 429 as quota hop', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ message: 'rate limit' }, { status: 429 }));

    const exit = await runExit(
      createClaimableNeon({ ref: 'vybekiit-test', fetchImpl: fetchImpl as typeof fetch }),
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      expect(String(exit.cause)).toMatch(QUOTA_FAILURE_PATTERN);
    }
  });
});

describe('verifyDatabaseUrl', () => {
  beforeEach(() => {
    sqlMock.mockReset();
    sqlMock.mockResolvedValue([{ ok: 1 }]);
  });

  it('succeeds when SELECT 1 works (Neon host → serverless driver)', async () => {
    await expect(
      run(verifyDatabaseUrl('postgresql://user:pass@ep-test.us-east-1.aws.neon.tech/db')),
    ).resolves.toBe(true);
  });

  it('fails hard_stop when the Neon driver errors', async () => {
    sqlMock.mockRejectedValueOnce(new Error('connection refused'));
    const exit = await runExit(
      verifyDatabaseUrl('postgresql://user:pass@ep-bad.us-east-1.aws.neon.tech/db'),
    );
    expect(exit._tag).toBe('Failure');
  });
});
