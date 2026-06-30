import { type Result, fail, ok, parseEnv, supabaseConfigSchema } from '@vybekiit/core';
import { createDbClient, resolveDataProvider } from '@vybekiit/db';
import type { OrderEvent } from '@vybekiit/payments';

/** Row shape stored in the practice `orders` collection / Supabase table. */
interface OrderRecord {
  id: string;
  order_id: string;
  email: string;
  refunded: boolean;
}

/**
 * What happens after a verified payment — the one place a buyer customizes per
 * product. Uses the local in-memory adapter when no data backend is configured,
 * otherwise the Supabase `orders` table.
 */
export async function fulfillOrder(event: OrderEvent): Promise<Result<true>> {
  const db = resolveDataProvider();

  if (db.name === 'local') {
    const existing = await db.query<OrderRecord>('orders', { order_id: event.orderId });
    if (existing.ok && existing.value.length > 0) {
      const row = existing.value[0];
      if (!row) {
        return fail('fulfillment_failed', 'Order row missing.');
      }
      const updated = await db.update<OrderRecord>('orders', row.id, {
        email: event.customerEmail ?? '',
        refunded: event.isRefund,
      });
      return updated.ok ? ok(true) : updated;
    }

    const inserted = await db.insert<OrderRecord>('orders', {
      id: event.orderId,
      order_id: event.orderId,
      email: event.customerEmail ?? '',
      refunded: event.isRefund,
    });
    return inserted.ok ? ok(true) : inserted;
  }

  const client = createDbClient(parseEnv(supabaseConfigSchema));
  const { error } = await client
    .from('orders')
    .upsert(
      { order_id: event.orderId, email: event.customerEmail, refunded: event.isRefund },
      { onConflict: 'order_id' },
    );

  if (error) {
    return fail('fulfillment_failed', error.message);
  }
  return ok(true);
}
