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
 */
export function isPaymentsUnconfigured(env: EnvSource = process.env): boolean {
  return PAYMENT_ANCHOR_KEYS.every((key) => !env[key]);
}
