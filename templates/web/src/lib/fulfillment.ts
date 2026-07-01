import { type Result, fail, ok } from '@vybekiit/core';
import { type DataProvider, DbError, resolveDataProvider } from '@vybekiit/db';
import type { OrderEvent } from '@vybekiit/payments';
import { Cause, Effect, Exit, Option } from 'effect';

/** Row shape stored in the practice `orders` collection / Supabase table. */
interface OrderRecord {
  id: string;
  order_id: string;
  email: string;
  refunded: boolean;
}

/**
 * Record the order for the active data provider — insert/update on the local dev
 * adapter, else upsert on the `orders` preset table. Returns the db {@link Effect}
 * so {@link fulfillOrder} runs it once at its edge.
 */
function recordOrder(db: DataProvider, event: OrderEvent): Effect.Effect<true, DbError> {
  const row: OrderRecord = {
    id: event.orderId,
    order_id: event.orderId,
    email: event.customerEmail ?? '',
    refunded: event.isRefund,
  };
  if (db.name === 'local') {
    return Effect.gen(function* () {
      const existing = yield* db.query<OrderRecord>('orders', { order_id: event.orderId });
      const current = existing[0];
      if (current) {
        yield* db.update<OrderRecord>('orders', current.id, {
          email: row.email,
          refunded: row.refunded,
        });
      } else {
        yield* db.insert<OrderRecord>('orders', row);
      }
      return true as const;
    });
  }
  if (!(db.capabilities.upsert && db.upsert)) {
    return Effect.fail(
      new DbError({
        code: 'unsupported',
        message: 'The data adapter does not support order upserts.',
      }),
    );
  }
  return db.upsert<OrderRecord>('orders', row, 'order_id').pipe(Effect.as(true as const));
}

/**
 * What happens after a verified payment — the one place a buyer customizes per
 * product. The default records the order so "who paid" is queryable; the agent
 * reshapes this to the buyer's product (unlock a feature, start a subscription,
 * send a download). On refund it marks the order refunded.
 *
 * Uses the local in-memory adapter when no data backend is configured (ADR-0008),
 * otherwise upserts into the `orders` preset table. The db seam is Effect-native
 * (ADR-0023); this runs it at the edge and returns the payments callback's `Result`.
 */
export async function fulfillOrder(event: OrderEvent): Promise<Result<true>> {
  const db = resolveDataProvider();
  const exit = await Effect.runPromiseExit(recordOrder(db, event));
  if (Exit.isSuccess(exit)) {
    return ok(true);
  }
  const failure = Option.getOrNull(Cause.failureOption(exit.cause));
  return fail('fulfillment_failed', failure?.message ?? 'Order fulfillment failed.');
}
