import type { Result } from '@vybekiit/core';
import { useCallback, useState } from 'react';

/**
 * UI state for a single async call that returns a {@link Result}.
 *
 * @typeParam T - the success value carried by the wrapped function's `Result`.
 */
export interface AsyncState<T> {
  /** True while a `run(...)` call is in flight. */
  loading: boolean;
  /** The failed `Result`'s plain `message`, or `null` when there's no error. */
  error: string | null;
  /** The last successful value, or `null` before the first ok result. */
  data: T | null;
}

/**
 * Wrap an async function returning a {@link Result} into ergonomic UI state.
 *
 * The shared async-state primitive the form screens use instead of hand-rolling
 * `useState(loading)` / `useState(error)` around every auth or billing call.
 * `run(...)` resets the previous error, flips `loading`, then on completion
 * populates either `data` (on `ok`) or `error` (the failure's plain `message`, on
 * `err`) — never both — so a screen branches on one source of truth.
 *
 * Errors are surfaced as `string | null` so they drop straight into the shared
 * `<Alert variant="destructive">`. `run` is stable across renders (it is
 * `useCallback`-wrapped over `fn`), so callers can depend on it safely. Ported
 * verbatim from the web template.
 *
 * @typeParam T - the success value carried by `fn`'s `Result`.
 * @param fn - the async operation to wrap; receives whatever args `run` is given.
 * @returns The async state plus a stable `run` to invoke `fn`.
 */
export function useAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<Result<T>>,
): AsyncState<T> & { run: (...args: Args) => Promise<Result<T>> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<Result<T>> => {
      setLoading(true);
      setError(null);
      const result = await fn(...args);
      if (result.ok) {
        setData(result.value);
      } else {
        setError(result.error.message);
      }
      setLoading(false);
      return result;
    },
    [fn],
  );

  return { loading, error, data, run };
}
