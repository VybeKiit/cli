import { Effect } from 'effect';
import { clientError, legacyOutcomeToEffect } from '@/lib/clientEffect';
import { postJson } from '@/lib/fetchJson';

/**
 * Buyer-facing checkout wire point — the ONE file the `setup-payments` skill touches.
 *
 * POSTs the chosen plan to `/api/checkout` on the builder's web backend (via
 * `APP_URL`), which runs `resolvePaymentProvider()` on the server. Provider-agnostic:
 * switching Lemon Squeezy / Stripe / PayPal never touches the UI. Mirrors the web
 * template's `billing-client.ts` exactly so both platforms behave identically.
 *
 * @param planId - Pricing plan selected by the user.
 * @returns An Effect that succeeds with the hosted checkout URL or fails with MobileClientError.
 * @example
 * const checkout = startCheckout('plan_pro');
 */
export const startCheckout = (planId: string) => {
  if (!planId) {
    return Effect.fail(clientError('invalid_input', 'Pick a plan first.'));
  }

  return legacyOutcomeToEffect(
    postJson<{ readonly url: string }>('/api/checkout', { productId: planId }),
  );
};
