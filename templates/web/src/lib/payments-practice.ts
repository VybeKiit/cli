/** Env keys that signal a real payment provider is configured. */
import process from 'node:process';
const PAYMENT_ANCHOR_KEYS = [
  'LEMONSQUEEZY_API_KEY',
  'STRIPE_SECRET_KEY',
  'PAYPAL_CLIENT_ID',
] as const;

/**
 * True when no payment provider credentials are set — the practice checkout flow
 * runs instead of a hosted provider page (ADR-0008 covers auth/data only; this is
 * a template-level UX fallback so pricing is clickable in session #1).
 */
export function isPaymentsUnconfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return PAYMENT_ANCHOR_KEYS.every((key) => !env[key]);
}
