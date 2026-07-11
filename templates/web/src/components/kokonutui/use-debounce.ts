import { useDebouncedValue } from '@/hooks/useDebouncedValue';

/**
 * KokonutUI-compatible debounce wrapper around the kit SSOT hook.
 *
 * @param value - Latest value to debounce.
 * @param delay - Delay in milliseconds (default 500 for upstream parity).
 * @returns Debounced value.
 * @example
 * const debouncedQuery = useDebounce(query, 200);
 */
function useDebounce<T>(value: T, delay = 500): T {
  return useDebouncedValue(value, delay);
}

export default useDebounce;
