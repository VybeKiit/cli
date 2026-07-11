'use client';

import { useEffect, useState } from 'react';

/** Default delay for search-input filtering (ms). */
export const SEARCH_DEBOUNCE_MS = 250;

/**
 * Return a value only after it has stopped changing for a short delay.
 *
 * Use this for every search input that filters a list or triggers a query so
 * typing does not recompute on every keystroke.
 *
 * @param value - The latest value to debounce.
 * @param delayMs - Delay in milliseconds before publishing the value.
 * @returns The debounced value.
 * @example
 * const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
 */
export const useDebouncedValue = <Value>(value: Value, delayMs: number): Value => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => globalThis.clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
};
