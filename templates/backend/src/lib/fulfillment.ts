import { type DataProvider, resolveDataProvider } from '@vybekiit/db';
import type { OrderEvent } from '@vybekiit/payments';
import { Cause, Effect, Data as EffectData, Exit, Option } from 'effect';

/** Row shape stored in the buyer app's `orders` collection or table. */
type OrderRecord = {
  readonly id: string;
  readonly order_id: string;
  readonly email: string;
  readonly refunded: boolean;
};

/** Tagged fulfillment failure returned through the Effect error channel. */
export class FulfillmentError extends EffectData.TaggedError('FulfillmentError')<{
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
 * Resolve a nullable order email into the stored email string.
 *
 * @param event - Normalized payment event.
 * @returns Customer email, or an empty string when the provider omitted it.
 * @example
 * const email = customerEmail(event);
 */
const customerEmail = (event: OrderEvent): string => {
  if (event.customerEmail === null) {
    return '';
  }

  return event.customerEmail;
};

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
 * Build the stored order record from a payment event.
 *
 * @param event - Normalized payment event.
 * @returns Order record ready for the data provider.
 * @example
 * const record = orderRecord(event);
 */
const orderRecord = (event: OrderEvent): OrderRecord => ({
  id: event.orderId,
  order_id: event.orderId,
  email: customerEmail(event),
  refunded: event.isRefund,
});

/**
 * Insert or update an order through the configured data provider.
 *
 * @param db - Data provider resolved from the backend environment.
 * @param event - Normalized payment event from the payments package.
 * @returns Effect that succeeds after the order row is recorded.
 * @example
 * const program = recordOrder(db, event);
 */
const recordOrder = (db: DataProvider, event: OrderEvent): Effect.Effect<true, FulfillmentError> =>
  Effect.gen(function* () {
    const record = orderRecord(event);
    const existing = yield* db.query<OrderRecord>('orders', { order_id: event.orderId });
    const [current] = existing;

    if (current !== undefined) {
      yield* db.update<OrderRecord>('orders', current.id, {
        email: record.email,
        refunded: record.refunded,
      });
      return true as const;
    }

    yield* db.insert<OrderRecord>('orders', record);
    return true as const;
  }).pipe(Effect.mapError((error) => fulfillmentError(error.message)));

/**
 * Fulfill a verified payment event with the configured data provider.
 *
 * @param event - Normalized payment event to record.
 * @returns Effect that succeeds when fulfillment has been recorded.
 * @example
 * const program = fulfillOrderEffect(event);
 */
export const fulfillOrderEffect = (event: OrderEvent): Effect.Effect<true, FulfillmentError> =>
  resolveFulfillmentData().pipe(Effect.flatMap((db) => recordOrder(db, event)));

/**
 * Fulfill a verified payment event for the payments HTTP callback contract.
 *
 * @param event - Normalized payment event to record.
 * @returns Payments-compatible fulfillment result.
 * @example
 * const result = await fulfillOrder(event);
 */
export const fulfillOrder = async (event: OrderEvent): Promise<FulfillmentResult> => {
  const exit = await Effect.runPromiseExit(fulfillOrderEffect(event));
  return toFulfillmentResult(exit);
};
