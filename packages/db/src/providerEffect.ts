import { Effect } from 'effect';
import { DbError } from './types';

/**
 * Create a tagged DB failure.
 *
 * @param code - Stable machine-readable failure code.
 * @param message - Developer-facing failure detail.
 * @returns A {@link DbError} with the supplied code and message.
 * @example
 * const error = dbError('not_found', 'No order found.');
 */
export const dbError = (code: string, message: string): DbError => new DbError({ code, message });

/**
 * Narrow an unknown caught value to a developer-facing message.
 *
 * @param error - Unknown caught value.
 * @param fallback - Message to use when the value is not an Error.
 * @returns Error message for a tagged DB failure.
 * @example
 * const message = caughtMessage(error, 'unknown database error');
 */
export const caughtMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Fail an Effect with a tagged DB error.
 *
 * @param code - Stable machine-readable failure code.
 * @param message - Developer-facing failure detail.
 * @returns An Effect that fails with {@link DbError}.
 * @example
 * const effect = failDb('not_found', 'No order found.');
 */
export const failDb = <A = never>(code: string, message: string): Effect.Effect<A, DbError> =>
  Effect.fail(dbError(code, message));

/**
 * Run a Promise-returning backend operation as a typed DB Effect.
 *
 * @param code - Stable failure code used when the Promise rejects.
 * @param run - Backend operation to execute.
 * @param fallback - Message used when a rejection is not an Error.
 * @returns An Effect that succeeds with the backend value or fails with {@link DbError}.
 * @example
 * const effect = tryDb('db_get_failed', () => client.get(), 'unknown database error');
 */
export const tryDb = <A>(
  code: string,
  run: () => Promise<A>,
  fallback: string,
): Effect.Effect<A, DbError> =>
  Effect.tryPromise({
    try: run,
    catch: (error) => dbError(code, caughtMessage(error, fallback)),
  });
