import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { classifyPaymentsHopSignal, shouldContinuePaymentsLadder } from './hopSignals';
import { toPaymentsLiveWorkErrorEvent, toPaymentsLiveWorkJourneyEvents } from './journeyEvents';
import { PAYMENTS_PREFERENCE_LADDER, resolvePaymentsLadderOrder } from './ladders';
import { buildPaymentsPinKeys, buyerPaymentsSuccessMessage } from './pin';
import type { PaymentsLadderStep } from './runPaymentsLiveWork';
import { runPaymentsLiveWork } from './runPaymentsLiveWork';
import type { PaymentsLiveWorkResult } from './types';
import { PaymentsLiveWorkError } from './types';
import {
  detectExistingPayments,
  hasLemonSqueezyCredentials,
  hasStripeCredentials,
} from './verifyCredentials';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);

const stripeEnv = {
  STRIPE_SECRET_KEY: 'sk_test_unit',
  STRIPE_WEBHOOK_SECRET: 'whsec_unit',
} as const;

const lemonEnv = {
  LEMONSQUEEZY_API_KEY: 'ls_unit',
  LEMONSQUEEZY_STORE_ID: '1',
  LEMONSQUEEZY_WEBHOOK_SECRET: 'whsec_ls_unit',
} as const;

const paypalEnv = {
  PAYPAL_CLIENT_ID: 'pp_id',
  PAYPAL_CLIENT_SECRET: 'pp_secret',
  PAYPAL_WEBHOOK_ID: 'pp_wh',
} as const;

describe('payments ladders', () => {
  it('has lemon-squeezy first', () => {
    expect(PAYMENTS_PREFERENCE_LADDER[0]).toBe('lemon-squeezy');
    expect([...PAYMENTS_PREFERENCE_LADDER]).toEqual(['lemon-squeezy', 'stripe', 'paypal']);
  });

  it('starts at pin then remainder', () => {
    expect(resolvePaymentsLadderOrder({ PAYMENTS_PROVIDER: 'stripe' })).toEqual([
      'stripe',
      'paypal',
    ]);
  });

  it('named stick is single entry', () => {
    expect(resolvePaymentsLadderOrder({}, 'paypal')).toEqual(['paypal']);
  });
});

describe('payments hop signals', () => {
  it('classifies LS onboarding as hop class', () => {
    expect(classifyPaymentsHopSignal('onboarding_blocked', 'Store not ready')).toBe(
      'onboarding_blocked',
    );
    expect(classifyPaymentsHopSignal('missing_credentials', 'api key missing')).toBe(
      'missing_credentials',
    );
    expect(shouldContinuePaymentsLadder('hard_stop')).toBe(false);
    expect(shouldContinuePaymentsLadder('onboarding_blocked')).toBe(true);
  });
});

describe('payments pin', () => {
  it('pins only PAYMENTS_PROVIDER (no secrets)', () => {
    expect(buildPaymentsPinKeys({ provider: 'stripe', ephemeral: false })).toEqual({
      PAYMENTS_PROVIDER: 'stripe',
    });
  });

  it('celebrates without jargon', () => {
    expect(buyerPaymentsSuccessMessage('stripe', false)).toContain('Stripe');
    expect(buyerPaymentsSuccessMessage('stripe', false)).not.toMatch(/PAYMENTS_PROVIDER|env|API/i);
    expect(buyerPaymentsSuccessMessage('stripe', true, 'lemon-squeezy')).toMatch(/Lemon Squeezy/);
  });
});

describe('verify credentials', () => {
  it('detects lemon and stripe key sets', () => {
    expect(hasLemonSqueezyCredentials(lemonEnv)).toBe(true);
    expect(hasStripeCredentials(stripeEnv)).toBe(true);
    expect(hasStripeCredentials({})).toBe(false);
  });

  it('detectExistingPayments requires pin and keys', () => {
    expect(detectExistingPayments({ ...stripeEnv, PAYMENTS_PROVIDER: 'stripe' })?.provider).toBe(
      'stripe',
    );
    expect(detectExistingPayments(stripeEnv)).toBeNull();
    expect(detectExistingPayments({ PAYMENTS_PROVIDER: 'stripe' })).toBeNull();
  });
});

describe('runPaymentsLiveWork', () => {
  it('uses existing pin without ladder walk', async () => {
    const result = await run(
      runPaymentsLiveWork({
        mode: 'buyer',
        env: { ...stripeEnv, PAYMENTS_PROVIDER: 'stripe' },
      }),
    );
    expect(result.provider).toBe('stripe');
    expect(result.verified).toBe(true);
    expect(result.hopped).toBe(false);
    expect(result.pin.PAYMENTS_PROVIDER).toBe('stripe');
    expect(JSON.stringify(result)).not.toContain('sk_test_unit');
  });

  it('walks ladder and wins on lemon-squeezy first', async () => {
    const result = await run(
      runPaymentsLiveWork({
        mode: 'buyer',
        env: { ...lemonEnv },
        preferExisting: false,
      }),
    );
    expect(result.provider).toBe('lemon-squeezy');
    expect(result.pin.PAYMENTS_PROVIDER).toBe('lemon-squeezy');
  });

  it('hops onboarding_blocked to next injectable step', async () => {
    const steps: readonly PaymentsLadderStep[] = [
      {
        provider: 'lemon-squeezy',
        tryVerify: () =>
          Effect.fail(
            new PaymentsLiveWorkError({
              code: 'onboarding_blocked',
              message: 'Store not ready / papers not complete',
              hopClass: 'onboarding_blocked',
              provider: 'lemon-squeezy',
            }),
          ),
      },
      {
        provider: 'stripe',
        tryVerify: () =>
          Effect.succeed({
            provider: 'stripe',
            ephemeral: false,
          }),
      },
    ];

    const result = await run(
      runPaymentsLiveWork({
        mode: 'buyer',
        env: {},
        steps,
        preferExisting: false,
      }),
    );

    expect(result.provider).toBe('stripe');
    expect(result.hopped).toBe(true);
    expect(result.fromProvider).toBe('lemon-squeezy');
    expect(result.buyerMessage).toMatch(/wasn't ready yet/);
  });

  it('skips missing credentials and wins on later provider', async () => {
    const result = await run(
      runPaymentsLiveWork({
        mode: 'buyer',
        env: { ...paypalEnv },
        preferExisting: false,
      }),
    );
    expect(result.provider).toBe('paypal');
    expect(result.skipped).toEqual(['lemon-squeezy', 'stripe']);
  });

  it('named stick never hops away', async () => {
    await expect(
      run(
        runPaymentsLiveWork({
          mode: 'buyer',
          env: { ...stripeEnv },
          namedVendor: 'lemon-squeezy',
          preferExisting: false,
        }),
      ),
    ).rejects.toThrow();
  });

  it('calls writePin with public keys only', async () => {
    const written: Record<string, string>[] = [];
    await run(
      runPaymentsLiveWork({
        mode: 'buyer',
        env: { ...lemonEnv },
        preferExisting: false,
        writePin: (keys) => {
          written.push(keys);
          return Effect.void;
        },
      }),
    );
    expect(written).toEqual([{ PAYMENTS_PROVIDER: 'lemon-squeezy' }]);
  });

  it('exhausts ladder when no credentials', async () => {
    await expect(
      run(
        runPaymentsLiveWork({
          mode: 'demo',
          env: {},
          preferExisting: false,
        }),
      ),
    ).rejects.toThrow(/ladder_exhausted|missing_credentials|Payments preference/);
  });
});

describe('journey events', () => {
  const success = (partial: Partial<PaymentsLiveWorkResult> = {}): PaymentsLiveWorkResult => ({
    provider: 'lemon-squeezy',
    ephemeral: false,
    hopped: false,
    skipped: [],
    pin: { PAYMENTS_PROVIDER: 'lemon-squeezy' },
    verified: true,
    buyerMessage: 'Taking money is ready with Lemon Squeezy.',
    ...partial,
  });

  it('emits start/end pairs without secrets', () => {
    const events = toPaymentsLiveWorkJourneyEvents(success());
    expect(events.length).toBeGreaterThanOrEqual(4);
    expect(events.every((e) => e.phase === 'start' || e.phase === 'end')).toBe(true);
    const blob = JSON.stringify(events);
    expect(blob).toMatch(/lemon-squeezy|payments/);
    expect(blob).not.toMatch(/LEMONSQUEEZY_API_KEY|sk_live|whsec_/);
  });

  it('error event is safe', () => {
    const event = toPaymentsLiveWorkErrorEvent('ladder_exhausted', 'No path left');
    expect(event.phase).toBe('error');
    expect(event.detail).toContain('ladder_exhausted');
  });
});
