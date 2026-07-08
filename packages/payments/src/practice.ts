import type { EnvSource } from '@vybekiit/core';

/** Env keys that signal a real payment provider is configured. */
const PAYMENT_ANCHOR_KEYS = [
  'LEMONSQUEEZY_API_KEY',
  'STRIPE_SECRET_KEY',
  'PAYPAL_CLIENT_ID',
] as const;

/**
 * True when no payment provider credentials are set — the practice checkout flow
 * runs instead of a hosted provider page.
 *
 * @param env - Environment variables to inspect for payment provider credentials.
 * @returns `true` when no payment anchor key has a non-empty value.
 * @example
 * const practiceMode = isPaymentsUnconfigured(process.env);
 */
export const isPaymentsUnconfigured = (env: EnvSource = process.env): boolean =>
  PAYMENT_ANCHOR_KEYS.every((key) => {
    const value = env[key];
    return value === undefined || value.length === 0;
  });
