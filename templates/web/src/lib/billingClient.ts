import { postJson } from '@/lib/fetchJson';
import { type Result, fail } from '@vybekiit/core';

/**
 * Buyer-facing checkout wire point — the ONE file the `setup-payments` skill touches.
 *
 * POSTs the chosen plan to `/api/checkout`, which runs the real
 * `resolvePaymentProvider()` from `@vybekiit/payments` on the server (so no payment
 * secret reaches the client bundle) and returns the URL to send the buyer to.
 * Provider-agnostic: switching Lemon Squeezy / Stripe / PayPal never touches the UI.
 *
 * Unlike sign-in/data, payments has no no-secrets local fallback (ADR-0008 covers
 * data + auth only): until the `setup-payments` skill sets the provider's keys, the
 * checkout route fails loud with a clear config error. The pricing screen still
 * renders and the rest of the app runs — only the buy action waits on real keys.
 */
export async function startCheckout(planId: string): Promise<Result<{ url: string }>> {
  if (!planId) {
    return fail('invalid_input', 'pricing.errors.pickPlanFirst');
  }
  return postJson<{ url: string }>('/api/checkout', { productId: planId });
}
