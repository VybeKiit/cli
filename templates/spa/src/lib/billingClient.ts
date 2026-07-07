import { Effect } from 'effect';
import { postJson } from '@/lib/fetchJson';
import { clientError, legacyOutcomeToEffect } from '@/lib/clientEffect';

type CheckoutUrl = {
  readonly url: string;
};

/**
 * Buyer-facing checkout wire point — the ONE file the `setup-payments` skill touches.
 *
 * POSTs the chosen plan to `/api/checkout` on the Express backend.
 *
 * @param planId - Pricing plan selected by the user.
 * @returns An Effect that succeeds with the hosted checkout URL or fails with SpaClientError.
 * @example
 * const checkout = startCheckout('plan_pro');
 */
export const startCheckout = (planId: string) => {
  if (!planId) {
    return Effect.fail(clientError('invalid_input', 'Pick a plan first.'));
  }
  return legacyOutcomeToEffect(postJson<CheckoutUrl>('/api/checkout', { productId: planId }));
};
