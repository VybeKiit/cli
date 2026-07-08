import { Effect, Either } from 'effect';
import { useCallback, useState } from 'react';

type MessageError = {
  readonly message: string;
};

/**
 * UI state for a single Effect-backed async call.
 *
 * @typeParam T - Success value carried by the wrapped Effect.
 */
export interface AsyncState<T> {
  /** True while a `run(...)` call is in flight. */
  loading: boolean;
  /** The failed Effect error's plain `message`, or `null` when there's no error. */
  error: string | null;
  /** The last successful value, or `null` before the first success. */
  data: T | null;
}

/**
 * Wrap an Effect-returning operation into ergonomic UI state.
 *
 * @typeParam T - Success value carried by `fn`.
 * @typeParam E - Expected failure type with a user-facing message.
 * @typeParam Args - Argument tuple accepted by `fn`.
 * @param fn - Effect-returning operation to invoke from the UI.
 * @returns The async state plus a stable `run` function.
 * @example
 * const { run } = useAsync(signInWithPassword);
 */
export const useAsync = <T, E extends MessageError, Args extends unknown[]>(
  fn: (...args: Args) => Effect.Effect<T, E>,
): AsyncState<T> & { run: (...args: Args) => Promise<Either.Either<T, E>> } => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<Either.Either<T, E>> => {
      setLoading(true);
      setError(null);
      const result = await Effect.runPromise(Effect.either(fn(...args)));
      if (Either.isRight(result)) {
        setData(result.right);
      } else {
        setError(result.left.message);
      }
      setLoading(false);
      return result;
    },
    [fn],
  );

  return { loading, error, data, run };
};
