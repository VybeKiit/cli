import { Effect } from 'effect';
import type { Result, VybeKiitError } from './result';

/**
 * Lift a settled {@link Result} into an `Effect`, mapping a failure through `onError`
 * into the caller's tagged error. The single source of truth for the Result→Effect
 * seam (ADR-0023) — every package's `effect-bridge` re-imports this instead of copying
 * the logic. Retires with `Result` in Slice 8.
 */
export function fromResult<T, E>(
  result: Result<T>,
  onError: (failure: VybeKiitError) => E,
): Effect.Effect<T, E> {
  return result.ok ? Effect.succeed(result.value) : Effect.fail(onError(result.error));
}

/** Async variant of {@link fromResult} — the adapter Promise catches into a `Result`, never rejects. */
export function fromResultPromise<T, E>(
  promise: Promise<Result<T>>,
  onError: (failure: VybeKiitError) => E,
): Effect.Effect<T, E> {
  return Effect.flatMap(
    Effect.promise(() => promise),
    (result) => fromResult(result, onError),
  );
}

/**
 * Bind {@link fromResult}/{@link fromResultPromise} to one package's tagged error once,
 * so an `effect-bridge` becomes a single re-import + error binding with no copied logic.
 */
export function makeResultLifter<E>(onError: (failure: VybeKiitError) => E) {
  return {
    fromResult: <T>(result: Result<T>): Effect.Effect<T, E> => fromResult(result, onError),
    fromResultPromise: <T>(promise: Promise<Result<T>>): Effect.Effect<T, E> =>
      fromResultPromise(promise, onError),
  };
}
