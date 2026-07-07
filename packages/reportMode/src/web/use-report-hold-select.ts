'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const REPORT_HOLD_MS = 2000;
const REPORT_HOLD_MS_REDUCED = 400;

/**
 * Resolve the hold duration, respecting reduced-motion preferences.
 *
 * @returns Hold duration in milliseconds.
 * @example
 * const duration = holdDurationMs();
 */
const holdDurationMs = (): number => {
  if (typeof globalThis.matchMedia === 'undefined') {
    return REPORT_HOLD_MS;
  }
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? REPORT_HOLD_MS_REDUCED
    : REPORT_HOLD_MS;
};

/**
 * Manage hover-and-hold selection progress.
 *
 * @param onSelect - Callback invoked when the hold completes.
 * @returns Pending value, progress, and hold control actions.
 * @example
 * const hold = useReportHoldSelect((value) => setCorner(value));
 */
export const useReportHoldSelect = <T>(onSelect: (value: T) => void) => {
  const [pending, setPending] = useState<T | null>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const cancelHold = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPending(null);
    setProgress(0);
  }, []);

  const startHold = useCallback(
    (value: T) => {
      cancelHold();
      setPending(value);
      setProgress(0);
      startRef.current = performance.now();

      const tick = (now: number): void => {
        const elapsed = now - startRef.current;
        const duration = holdDurationMs();
        const next = Math.min(1, elapsed / duration);
        setProgress(next);
        if (next >= 1) {
          rafRef.current = null;
          onSelectRef.current(value);
          setPending(null);
          setProgress(0);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [cancelHold],
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  return { pending, progress, startHold, cancelHold };
};
