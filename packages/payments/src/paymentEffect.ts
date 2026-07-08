import { Effect } from 'effect';
import { PaymentError } from './types';

/**
 * Create a tagged payment failure.
 *
 * @param code - Stable machine-readable failure code.
 * @param message - Developer-facing failure detail.
 * @returns A {@link PaymentError} with the supplied code and message.
 * @example
 * const error = paymentError('invalid_signature', 'Missing signature.');
 */
export const paymentError = (code: string, message: string): PaymentError =>
  new PaymentError({ code, message });

/**
 * Narrow an unknown caught value to a developer-facing message.
 *
 * @param error - Unknown caught value.
 * @param fallback - Message to use when the value is not an Error.
 * @returns Error message for a tagged payment failure.
 * @example
 * const message = caughtMessage(error, 'unknown payment error');
 */
export const caughtMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Fail an Effect with a tagged payment error.
 *
 * @param code - Stable machine-readable failure code.
 * @param message - Developer-facing failure detail.
 * @returns An Effect that fails with {@link PaymentError}.
 * @example
 * const effect = failPayment('invalid_signature', 'Missing signature.');
 */
export const failPayment = <A = never>(
  code: string,
  message: string,
): Effect.Effect<A, PaymentError> => Effect.fail(paymentError(code, message));

/**
 * Run a Promise-returning provider operation as a typed payment Effect.
 *
 * @param code - Stable failure code used when the Promise rejects.
 * @param run - Provider operation to execute.
 * @param fallback - Message used when a rejection is not an Error.
 * @returns An Effect that succeeds with the provider value or fails with {@link PaymentError}.
 * @example
 * const effect = tryPayment('network_error', () => fetchCheckout(), 'unknown network error');
 */
export const tryPayment = <A>(
  code: string,
  run: () => Promise<A>,
  fallback: string,
): Effect.Effect<A, PaymentError> =>
  Effect.tryPromise({
    try: run,
    catch: (error) => paymentError(code, caughtMessage(error, fallback)),
  });
