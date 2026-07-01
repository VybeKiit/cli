import { postJson } from '@/lib/fetchJson';
import { type Result, fail } from '@vybekiit/core';

/**
 * Buyer-facing checkout wire point — the ONE file the `setup-payments` skill touches.
 *
 * POSTs the chosen plan to `/api/checkout` on the builder's web backend (via
 * `APP_URL`), which runs `resolvePaymentProvider()` on the server. Provider-agnostic:
 * switching Lemon Squeezy / Stripe / PayPal never touches the UI. Mirrors the web
 * template's `billing-client.ts` exactly so both platforms behave identically.
 */
export async function startCheckout(planId: string): Promise<Result<{ url: string }>> {
  if (!planId) return fail('invalid_input', 'Pick a plan first.');
  return postJson<{ url: string }>('/api/checkout', { productId: planId });
}
