import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('publishes the latest value only after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, SEARCH_DEBOUNCE_MS),
      { initialProps: { value: 'a' } },
    );

    expect(result.current).toBe('a');

    rerender({ value: 'ab' });
    rerender({ value: 'abc' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('abc');
  });

  it('resets the timer when the value keeps changing', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 'x' },
    });

    rerender({ value: 'xy' });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    rerender({ value: 'xyz' });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(result.current).toBe('x');

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current).toBe('xyz');
  });
});
