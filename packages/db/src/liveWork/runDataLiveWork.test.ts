import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import type { DataLadderStep } from './defaultSteps';
import { runDataLiveWork } from './runDataLiveWork';
import { LiveWorkError } from './types';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);

const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

// "Data preference ladder exhausted" -> match end-of-ladder failure
const LADDER_EXHAUSTED_PATTERN = /Data preference ladder exhausted/;

const failStep = (
  provider: 'supabase' | 'neon' | 'railway',
  code: string,
  hopClass: 'quota' | 'onboarding_blocked' | 'missing_credentials' | 'hard_stop',
  message = code,
): DataLadderStep => ({
  provider,
  tryProvision: () =>
    Effect.fail(
      new LiveWorkError({
        code,
        message,
        hopClass,
        provider,
      }),
    ),
});

const okStep = (
  provider: 'supabase' | 'neon' | 'railway',
  databaseUrl = 'postgresql://test/db',
): DataLadderStep => ({
  provider,
  tryProvision: () =>
    Effect.succeed({
      provider,
      databaseUrl,
      ephemeral: provider === 'neon',
    }),
});

vi.mock('@neondatabase/serverless', () => ({
  neon: () => async () => [{ ok: 1 }],
}));

describe('runDataLiveWork existing primary', () => {
  it('uses existing healthy DATABASE_URL without re-provisioning', async () => {
    const steps = [failStep('supabase', 'should_not_run', 'hard_stop')];
    const writePin = vi.fn(() => Effect.void);

    const result = await run(
      runDataLiveWork({
        mode: 'demo',
        env: { DATA_PROVIDER: 'neon', DATABASE_URL: 'postgresql://existing/db' },
        steps,
        writePin,
      }),
    );

    expect(result.provider).toBe('neon');
    expect(result.databaseUrl).toBe('postgresql://existing/db');
    expect(result.hopped).toBe(false);
    expect(result.verified).toBe(true);
    expect(result.pin.DATA_PROVIDER).toBe('neon');
    expect(writePin).toHaveBeenCalledOnce();
  });
});

describe('runDataLiveWork ladder hop', () => {
  it('hops supabase missing_credentials → neon success', async () => {
    const steps = [
      failStep('supabase', 'missing_credentials', 'missing_credentials'),
      okStep('neon'),
      failStep('railway', 'should_not_run', 'hard_stop'),
    ];

    const result = await run(
      runDataLiveWork({
        mode: 'demo',
        env: {},
        steps,
        preferExisting: false,
      }),
    );

    expect(result.provider).toBe('neon');
    // missing_credentials is a ladder skip, not a free-tier hop
    expect(result.hopped).toBe(false);
    expect(result.fromProvider).toBeUndefined();
    expect(result.skipped).toEqual(['supabase']);
    expect(result.buyerMessage).toContain('Neon');
    expect(result.buyerMessage).not.toMatch(/free plan was full/);
  });

  it('hops on quota then pins the winner with auth companion', async () => {
    const written: Record<string, string>[] = [];
    const steps = [
      failStep('supabase', 'quota_exceeded', 'quota', 'Free tier project limit'),
      okStep('neon', 'postgresql://neon/winner'),
    ];

    const result = await run(
      runDataLiveWork({
        mode: 'dogfood',
        env: {},
        steps,
        preferExisting: false,
        writePin: (keys) => {
          written.push(keys);
          return Effect.void;
        },
      }),
    );

    expect(result.provider).toBe('neon');
    expect(result.hopped).toBe(true);
    expect(result.fromProvider).toBe('supabase');
    expect(result.buyerMessage).toMatch(/free plan was full/);
    expect(written[0]).toMatchObject({
      DATA_PROVIDER: 'neon',
      AUTH_PROVIDER: 'better-auth',
      DATABASE_URL: 'postgresql://neon/winner',
    });
  });

  it('cleans orphans attached to hop failures (A10)', async () => {
    const steps: DataLadderStep[] = [
      {
        provider: 'supabase',
        tryProvision: () =>
          Effect.fail(
            new LiveWorkError({
              code: 'quota_exceeded',
              message: 'Free tier project limit',
              hopClass: 'quota',
              provider: 'supabase',
              orphan: {
                provider: 'supabase',
                ephemeral: true,
                note: 'partial project',
              },
            }),
          ),
      },
      okStep('neon', 'postgresql://neon/after-orphan'),
    ];

    const result = await run(
      runDataLiveWork({
        mode: 'demo',
        env: {},
        steps,
        preferExisting: false,
      }),
    );

    expect(result.provider).toBe('neon');
    expect(result.hopped).toBe(true);
    expect(result.fromProvider).toBe('supabase');
  });

  it('preserves explicit AUTH_PROVIDER on pin (A14)', async () => {
    const written: Record<string, string>[] = [];
    const result = await run(
      runDataLiveWork({
        mode: 'demo',
        env: { AUTH_PROVIDER: 'local' },
        steps: [okStep('neon')],
        preferExisting: false,
        writePin: (keys) => {
          written.push(keys);
          return Effect.void;
        },
      }),
    );

    expect(result.provider).toBe('neon');
    expect(written[0]?.AUTH_PROVIDER).toBeUndefined();
    expect(written[0]?.DATA_PROVIDER).toBe('neon');
  });
});

describe('runDataLiveWork hard rules', () => {
  it('named vendor stick does not hop on quota', async () => {
    const steps = [failStep('supabase', 'quota', 'quota'), okStep('neon')];

    const exit = await runExit(
      runDataLiveWork({
        mode: 'demo',
        env: {},
        namedVendor: 'supabase',
        steps,
        preferExisting: false,
      }),
    );

    expect(exit._tag).toBe('Failure');
  });

  it('hard_stop does not hop', async () => {
    const steps = [
      failStep('supabase', 'db_unreachable', 'hard_stop', 'ECONNREFUSED'),
      okStep('neon'),
    ];

    const exit = await runExit(
      runDataLiveWork({
        mode: 'demo',
        env: {},
        steps,
        preferExisting: false,
      }),
    );

    expect(exit._tag).toBe('Failure');
  });

  it('exhausts the ladder with a hard_stop error', async () => {
    const steps = [
      failStep('supabase', 'missing_credentials', 'missing_credentials'),
      failStep('neon', 'missing_credentials', 'missing_credentials'),
      failStep('railway', 'missing_credentials', 'missing_credentials'),
    ];

    const exit = await runExit(
      runDataLiveWork({
        mode: 'buyer',
        env: {},
        steps,
        preferExisting: false,
      }),
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      expect(String(exit.cause)).toMatch(LADDER_EXHAUSTED_PATTERN);
    }
  });

  it('starts at pin neon and does not retry supabase', async () => {
    const tried: string[] = [];
    const steps: DataLadderStep[] = [
      {
        provider: 'supabase',
        tryProvision: () => {
          tried.push('supabase');
          return Effect.fail(
            new LiveWorkError({
              code: 'x',
              message: 'x',
              hopClass: 'hard_stop',
              provider: 'supabase',
            }),
          );
        },
      },
      {
        provider: 'neon',
        tryProvision: () => {
          tried.push('neon');
          return Effect.succeed({
            provider: 'neon' as const,
            databaseUrl: 'postgresql://pinned/db',
            ephemeral: false,
          });
        },
      },
    ];

    const result = await run(
      runDataLiveWork({
        mode: 'buyer',
        env: { DATA_PROVIDER: 'neon' },
        steps,
        preferExisting: false,
      }),
    );

    expect(result.provider).toBe('neon');
    expect(tried).toEqual(['neon']);
  });
});
