import { Effect } from 'effect';
import type { Result, VybeKiitError } from './result';

/**
 * Lift a settled {@link Result} into an Effect error channel.
 *
 * @param result - Result returned by a legacy package seam.
 * @param onError - Mapper from {@link VybeKiitError} to the caller's tagged error.
 * @returns An Effect that succeeds with the result value or fails with the mapped error.
 * @example
 * const program = fromResult(legacyResult, (failure) => new AuthError(failure));
 */
export const fromResult = <T, E>(
  result: Result<T>,
  onError: (failure: VybeKiitError) => E,
): Effect.Effect<T, E> =>
  result.ok ? Effect.succeed(result.value) : Effect.fail(onError(result.error));

/**
 * Lift a Promise that resolves to {@link Result} into an Effect.
 *
 * @param promise - Promise returned by a legacy async adapter.
 * @param onError - Mapper from {@link VybeKiitError} to the caller's tagged error.
 * @returns An Effect that waits for the Promise and maps the settled Result.
 * @example
 * const program = fromResultPromise(fetchOrder(), (failure) => new PaymentError(failure));
 */
export const fromResultPromise = <T, E>(
  promise: Promise<Result<T>>,
  onError: (failure: VybeKiitError) => E,
): Effect.Effect<T, E> =>
  Effect.flatMap(
    Effect.promise(() => promise),
    (result) => fromResult(result, onError),
  );

/**
 * Bind Result lifters to one package's tagged error mapper.
 *
 * @param onError - Mapper from {@link VybeKiitError} to the package error type.
 * @returns Reusable synchronous and asynchronous Result lifters.
 * @example
 * const { fromResult } = makeResultLifter((failure) => new DbError(failure));
 */
export const makeResultLifter = <E>(onError: (failure: VybeKiitError) => E) => ({
  fromResult: <T>(result: Result<T>): Effect.Effect<T, E> => fromResult(result, onError),
  fromResultPromise: <T>(promise: Promise<Result<T>>): Effect.Effect<T, E> =>
    fromResultPromise(promise, onError),
});
