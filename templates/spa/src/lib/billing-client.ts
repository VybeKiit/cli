import { postJson } from './api-client';
import { type Result, fail } from '@vybekiit/core';

/**
 * Buyer-facing checkout wire point — the ONE file the `setup-payments` skill touches.
 *
 * POSTs the chosen plan to `/api/checkout` on the Express backend.
 */
export async function startCheckout(planId: string): Promise<Result<{ url: string }>> {
  if (!planId) return fail('invalid_input', 'Pick a plan first.');
  return postJson<{ url: string }>('/api/checkout', { productId: planId });
}
