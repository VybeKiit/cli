import { type Result, fail } from '@vybekiit/core';

/**
 * Buyer-facing checkout wire point — the ONE file the `setup-payments` skill edits.
 *
 * Ships as a marked stub so the pricing page renders and the app builds with no
 * secrets. When the builder asks to "add payments", the agent wires this to the
 * kit's provider-agnostic checkout (POST `/api/checkout` → `resolvePaymentProvider`),
 * so switching Lemon Squeezy / Stripe / PayPal never touches the UI.
 */

/**
 * Start checkout for a plan and return the URL to send the buyer to.
 * TODO(vybekiit): POST the plan id to `/api/checkout` and return its url — skill: setup-payments
 */
export async function startCheckout(planId: string): Promise<Result<{ url: string }>> {
  if (!planId) return fail('invalid_input', 'Pick a plan first.');
  return fail(
    'not_configured',
    'Payments are not connected yet. Ask your AI agent to "add payments".',
  );
}
