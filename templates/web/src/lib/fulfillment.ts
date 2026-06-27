import { type Result, fail, ok, parseEnv, supabaseConfigSchema } from '@vybekiit/core';
import { createDbClient } from '@vybekiit/db';
import type { LemonSqueezyOrderEvent } from '@vybekiit/pay-lemonsqueezy';

/**
 * What happens after a verified payment — the one place a buyer customizes per
 * product. The default records the order in an `orders` table so "who paid" is
 * queryable; the agent reshapes this to the buyer's product (unlock a feature,
 * start a subscription, send a download). On refund it marks the order refunded.
 *
 * The `orders` table is created by the `add-data` skill — see `.vybekiit/skills`.
 */
export async function fulfillOrder(event: LemonSqueezyOrderEvent): Promise<Result<true>> {
  const db = createDbClient(parseEnv(supabaseConfigSchema));
  const { error } = await db
    .from('orders')
    .upsert(
      { order_id: event.orderId, email: event.customerEmail, refunded: event.isRefund },
      { onConflict: 'order_id' },
    );

  if (error) return fail('fulfillment_failed', error.message);
  return ok(true);
}
