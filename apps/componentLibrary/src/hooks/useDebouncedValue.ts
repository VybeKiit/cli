'use client';

import { useEffect, useState } from 'react';

/**
 * Return a value only after it has stopped changing for a short delay.
 *
 * @param value - The latest value to debounce.
 * @param delayMs - Delay in milliseconds before publishing the value.
 * @returns The debounced value.
 * @example
 * const debouncedQuery = useDebouncedValue(query, 250);
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
