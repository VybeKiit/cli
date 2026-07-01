import type { Result } from '@vybekiit/core';
import { Effect } from 'effect';
import { PaymentError } from './types';

/**
 * Transitional bridge: lift a `Result`-returning adapter body into the `Effect` the
 * {@link PaymentProvider} interface now returns (ADR-0023). The proven adapter/signature
 * logic stays untouched behind this seam; both this file and `Result` retire in Slice 8.
 */
export function fromResult<T>(result: Result<T>): Effect.Effect<T, PaymentError> {
  return result.ok ? Effect.succeed(result.value) : Effect.fail(new PaymentError(result.error));
}

/** Async variant — the adapter Promise never rejects (it catches into a `Result`). */
export function fromResultPromise<T>(promise: Promise<Result<T>>): Effect.Effect<T, PaymentError> {
  return Effect.flatMap(
    Effect.promise(() => promise),
    fromResult,
  );
}
