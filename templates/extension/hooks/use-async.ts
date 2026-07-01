import type { Result } from '@vybekiit/core';
import { useCallback, useState } from 'react';

export interface AsyncState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

/** Wrap an async {@link Result} function for form screens (auth, checkout). */
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
