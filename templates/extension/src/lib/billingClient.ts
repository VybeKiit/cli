import { Effect } from 'effect';
import { clientError, legacyOutcomeToEffect } from '@/lib/clientEffect';
import { postJson } from './fetchJson';

/**
 * Buyer-facing checkout wire point the `setup-payments` skill touches.
 *
 * @param planId - Pricing plan selected by the user.
 * @returns An Effect that succeeds with the hosted checkout URL or fails with ExtensionClientError.
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
