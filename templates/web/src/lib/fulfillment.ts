import { type DataProvider, type DbError, type DbRecord, resolveDataProvider } from '@vybekiit/db';
import { mapOrderEventToLedgerRow, type OrderEvent } from '@vybekiit/payments';
import { Cause, Data as EffectData, Effect, Exit, Option } from 'effect';

/** Row shape stored in the practice `orders` collection or Supabase table. */
type OrderRecord = DbRecord & {
  readonly order_id: string;
  readonly email: string | null;
  readonly github_username: string | null;
  readonly refunded: boolean;
};

/** Tagged fulfillment failure returned through the Effect error channel. */
class FulfillmentError extends EffectData.TaggedError('FulfillmentError')<{
  readonly code: 'fulfillment_failed';
  readonly message: string;
}> {}

type FulfillmentResult =
  | { readonly ok: true; readonly value: true }
  | {
      readonly ok: false;
      readonly error: { readonly code: 'fulfillment_failed'; readonly message: string };
    };

/**
 * Create a typed fulfillment failure.
 *
 * @param message - Developer-facing failure detail.
 * @returns Tagged fulfillment error.
 * @example
 * const error = fulfillmentError('Could not record order.');
 */
const fulfillmentError = (message: string): FulfillmentError =>
  new FulfillmentError({ code: 'fulfillment_failed', message });

/**
 * Convert an unknown caught value into a readable message.
 *
 * @param caught - Unknown value from a caught failure.
 * @returns Error message for Error values, otherwise the stringified value.
 * @example
 * const message = caughtMessage(caught);
 */
const caughtMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

/**
 * Pull the fulfillment error message from a failed Effect cause.
 *
 * @param cause - Failed fulfillment Effect cause.
 * @returns Tagged failure message, or a generic fallback for defects.
 * @example
 * const message = fulfillmentFailureMessage(exit.cause);
 */
const fulfillmentFailureMessage = (cause: Cause.Cause<FulfillmentError>): string => {
  const failure = Option.getOrNull(Cause.failureOption(cause));
  if (failure !== null) {
    return failure.message;
  }

  return 'Order fulfillment failed.';
};

/**
 * Convert a fulfillment Effect exit into the payments callback result shape.
 *
 * @param exit - Fulfillment Effect exit to adapt.
 * @returns Payments-compatible success or failure object.
 * @example
 * const result = toFulfillmentResult(exit);
 */
const toFulfillmentResult = (exit: Exit.Exit<true, FulfillmentError>): FulfillmentResult => {
  if (Exit.isSuccess(exit)) {
    return { ok: true, value: true };
  }

  return {
    ok: false,
    error: {
      code: 'fulfillment_failed',
      message: fulfillmentFailureMessage(exit.cause),
    },
  };
};

/**
 * Resolve the configured data provider inside the Effect error channel.
 *
 * @returns Effect that succeeds with a data provider or fails with FulfillmentError.
 * @example
 * const provider = resolveFulfillmentData();
 */
const resolveFulfillmentData = (): Effect.Effect<DataProvider, FulfillmentError> =>
  Effect.try({
    try: () => resolveDataProvider(),
    catch: (caught) => fulfillmentError(caughtMessage(caught)),
  });

/**
 * Build the stored order record from a payment event via shared OrderLedger mapper.
 *
 * @param event - Normalized payment event.
 * @returns Order record ready for the data provider.
 * @example
 * const record = orderRecord(event);
 */
const orderRecord = (event: OrderEvent): OrderRecord => {
  const row = mapOrderEventToLedgerRow(event);
  return {
    id: row.orderId,
    order_id: row.orderId,
    email: row.email,
    github_username: row.githubUsername,
    refunded: row.refunded,
  };
};

/**
 * Insert or update an order through the local data provider.
 *
 * @param db - Local data provider resolved from the web environment.
 * @param row - Order record to write.
 * @returns Effect that succeeds after the order row is recorded.
 * @example
 * const program = recordLocalOrder(db, row);
 */
const recordLocalOrder = (
  db: DataProvider,
  row: OrderRecord,
): Effect.Effect<true, FulfillmentError> =>
  Effect.gen(function* () {
    const existing = yield* db.query<OrderRecord>('orders', { order_id: row.order_id });
    const [current] = existing;
    if (current !== undefined) {
      yield* db.update<OrderRecord>('orders', current.id, {
        email: row.email,
        github_username: row.github_username,
        refunded: row.refunded,
      });
      return true as const;
    }

    yield* db.insert<OrderRecord>('orders', row);
    return true as const;
  }).pipe(Effect.mapError((error) => fulfillmentError(error.message)));

/**
 * Upsert an order through a provider that supports conflict keys.
 *
 * @param db - Data provider resolved from the web environment.
 * @param row - Order record to upsert.
 * @returns Effect that succeeds after the order row is recorded.
 * @example
 * const program = upsertOrder(db, row);
 */
const upsertOrder = (db: DataProvider, row: OrderRecord): Effect.Effect<true, FulfillmentError> => {
  if (!(db.capabilities.upsert && db.upsert)) {
    return Effect.fail(fulfillmentError('The data adapter does not support order upserts.'));
  }

  return db.upsert<OrderRecord>('orders', row, 'order_id').pipe(
    Effect.mapError((error: DbError) => fulfillmentError(error.message)),
    Effect.as(true as const),
  );
};

/**
 * Record the order for the active data provider.
 *
 * @param db - Active data provider selected by the kit.
 * @param event - Verified order event from the payments package.
 * @returns Effect that records the order or fails with FulfillmentError.
 * @example
 * const program = recordOrder(db, event);
 */
const recordOrder = (
  db: DataProvider,
  event: OrderEvent,
): Effect.Effect<true, FulfillmentError> => {
  const row = orderRecord(event);
  if (db.name === 'local') {
    return recordLocalOrder(db, row);
  }

  return upsertOrder(db, row);
};

/**
 * Fulfill a verified payment event with the configured data provider.
 *
 * @param event - Verified order event from the payments provider.
 * @returns Effect that succeeds when fulfillment has been recorded.
 * @example
 * const program = fulfillOrderEffect(event);
 */
const fulfillOrderEffect = (event: OrderEvent): Effect.Effect<true, FulfillmentError> =>
  resolveFulfillmentData().pipe(Effect.flatMap((db) => recordOrder(db, event)));

/**
 * Fulfill a verified payment event for the payments HTTP callback contract.
 *
 * @param event - Verified order event from the payments provider.
 * @returns Payments-compatible fulfillment result.
 * @example
 * const result = await fulfillOrder(event);
 */
const fulfillOrder = async (event: OrderEvent): Promise<FulfillmentResult> => {
  const exit = await Effect.runPromiseExit(fulfillOrderEffect(event));
  return toFulfillmentResult(exit);
};

export { FulfillmentError, fulfillOrder, fulfillOrderEffect };
