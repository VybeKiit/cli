import { describe, expect, it } from 'vitest';
import {
  parseLiveWorkPaymentsFlags,
  toPublicLiveWorkPaymentsResult,
} from '../src/commands/liveWorkPaymentsCmd';

describe('parseLiveWorkPaymentsFlags', () => {
  it('defaults to buyer mode with pin on', () => {
    const flags = parseLiveWorkPaymentsFlags([]);
    expect(flags.mode).toBe('buyer');
    expect(flags.pin).toBe(true);
    expect(flags.preferExisting).toBe(true);
    expect(flags.error).toBeUndefined();
  });

  it('parses vendor fresh and mode', () => {
    const flags = parseLiveWorkPaymentsFlags([
      '--vendor=stripe',
      '--fresh',
      '--mode=demo',
      '--no-pin',
    ]);
    expect(flags.vendor).toBe('stripe');
    expect(flags.preferExisting).toBe(false);
    expect(flags.mode).toBe('demo');
    expect(flags.pin).toBe(false);
  });

  it('accepts lemon-squeezy and paypal vendors', () => {
    expect(parseLiveWorkPaymentsFlags(['--vendor=lemon-squeezy']).vendor).toBe('lemon-squeezy');
    expect(parseLiveWorkPaymentsFlags(['--vendor=paypal']).vendor).toBe('paypal');
  });

  it('rejects unknown vendor', () => {
    expect(parseLiveWorkPaymentsFlags(['--vendor=square']).error).toMatch(/Unknown vendor/);
  });

  it('rejects unknown mode', () => {
    expect(parseLiveWorkPaymentsFlags(['--mode=prod']).error).toMatch(/Unknown mode/);
  });
});

describe('toPublicLiveWorkPaymentsResult', () => {
  it('exposes pin key names only and journey events', () => {
    const publicResult = toPublicLiveWorkPaymentsResult(
      {
        provider: 'stripe',
        ephemeral: false,
        hopped: true,
        fromProvider: 'lemon-squeezy',
        skipped: ['lemon-squeezy'],
        pin: { PAYMENTS_PROVIDER: 'stripe' },
        verified: true,
        buyerMessage: "Lemon Squeezy wasn't ready yet, so we set up taking money with Stripe.",
      },
      true,
    );
    expect(publicResult.ok).toBe(true);
    expect(publicResult.provider).toBe('stripe');
    expect(publicResult.pinKeys).toEqual(['PAYMENTS_PROVIDER']);
    expect(publicResult.pinned).toBe(true);
    expect(publicResult.hopped).toBe(true);
    expect(publicResult.fromProvider).toBe('lemon-squeezy');
    expect(publicResult.events.length).toBeGreaterThanOrEqual(4);
    const blob = JSON.stringify(publicResult);
    expect(blob).not.toMatch(/sk_live|whsec_|STRIPE_SECRET|API_KEY/);
  });
});
