import { type Result, fail, ok } from '@vybekiit/core';
import { resolveDataProvider } from '@vybekiit/db';
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
 * product. The default records the order so "who paid" is queryable; the agent
 * reshapes this to the buyer's product (unlock a feature, start a subscription,
 * send a download). On refund it marks the order refunded.
 *
 * Uses the local in-memory adapter when no data backend is configured (ADR-0008),
 * otherwise upserts into the `orders` preset table via {@link DataProvider.upsert}.
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

  if (!(db.capabilities.upsert && db.upsert)) {
    return fail('fulfillment_failed', 'The data adapter does not support order upserts.');
  }

  const upserted = await db.upsert<OrderRecord>(
    'orders',
    {
      id: event.orderId,
      order_id: event.orderId,
      email: event.customerEmail ?? '',
      refunded: event.isRefund,
    },
    'order_id',
  );

  return upserted.ok ? ok(true) : fail('fulfillment_failed', upserted.error.message);
}
