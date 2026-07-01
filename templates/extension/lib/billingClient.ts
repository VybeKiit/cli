import { type Result, fail } from '@vybekiit/core';
import { postJson } from './fetchJson';

/** Buyer-facing checkout wire point — the ONE file the `setup-payments` skill touches. */
export async function startCheckout(planId: string): Promise<Result<{ url: string }>> {
  if (!planId) return fail('invalid_input', 'Pick a plan first.');
  return postJson<{ url: string }>('/api/checkout', { productId: planId });
}
