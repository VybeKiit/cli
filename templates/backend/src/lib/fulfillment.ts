import { type Result, fail, ok, parseEnv, supabaseConfigSchema } from '@vybekiit/core';
import { type DataProvider, createDbClient, resolveDataProvider } from '@vybekiit/db';
import type { OrderEvent } from '@vybekiit/payments';
import { Cause, Effect, Exit, Option } from 'effect';

/** Row shape stored in the practice `orders` collection / Supabase table. */
interface OrderRecord {
  id: string;
  order_id: string;
  email: string;
  refunded: boolean;
}

/** Insert or update the order via the local dev data provider (Effect-native db seam). */
function recordLocal(db: DataProvider, event: OrderEvent) {
  return Effect.gen(function* () {
    const existing = yield* db.query<OrderRecord>('orders', { order_id: event.orderId });
    const current = existing[0];
    if (current) {
      yield* db.update<OrderRecord>('orders', current.id, {
        email: event.customerEmail ?? '',
        refunded: event.isRefund,
      });
    } else {
      yield* db.insert<OrderRecord>('orders', {
        id: event.orderId,
        order_id: event.orderId,
        email: event.customerEmail ?? '',
        refunded: event.isRefund,
      });
    }
    return true as const;
  });
}

/**
 * What happens after a verified payment — the one place a buyer customizes per
 * product. Uses the local in-memory adapter when no data backend is configured,
 * otherwise the Supabase `orders` table. Runs the db {@link Effect} at this edge and
 * returns the payments callback's `Result`.
 */
export async function fulfillOrder(event: OrderEvent): Promise<Result<true>> {
  const db = resolveDataProvider();

  if (db.name === 'local') {
    const exit = await Effect.runPromiseExit(recordLocal(db, event));
    if (Exit.isSuccess(exit)) {
      return ok(true);
    }
    const failure = Option.getOrNull(Cause.failureOption(exit.cause));
    return fail('fulfillment_failed', failure?.message ?? 'Order fulfillment failed.');
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
