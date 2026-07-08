'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/motion';

/**
 * Pause on compare-at after the block is visible.
 */

export const PRICING_COUNTDOWN_DELAY_MS = 1500;

/**
 * How long NumberFlow rolls from compare-at down to sale price.
 */

export const PRICING_COUNTDOWN_DROP_MS = 3200;

/**
 * pricingDropTiming value.
 */
export const pricingDropTiming = {
  duration: PRICING_COUNTDOWN_DROP_MS,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

/**
 * Rolls from `from` down to `to` once `start` is true (after optional visible gate).
 *
 * @param from - Input value.
 * @param to - Input value.
 * @param start - Input value.
 * @returns The hook result.
 * @example
 * const value = useCountdownNumber(from, to, start);
 */

export const useCountdownNumber = (
  from: number,
  to: number,
  start: boolean,
): { value: number; done: boolean; phase: 'idle' | 'holding' | 'dropping' | 'done' } => {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(from);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'holding' | 'dropping' | 'done'>('idle');

  useEffect(() => {
    if (!start) {
      setValue(from);
      setDone(false);
      setPhase('idle');
      return;
    }
    if (reduced) {
      setValue(to);
      setDone(true);
      setPhase('done');
      return;
    }

    setPhase('holding');
    let dropTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

    const delayTimer = globalThis.setTimeout(() => {
      setPhase('dropping');
      setValue(to);
      dropTimer = globalThis.setTimeout(() => {
        setDone(true);
        setPhase('done');
      }, PRICING_COUNTDOWN_DROP_MS);
    }, PRICING_COUNTDOWN_DELAY_MS);

    return () => {
      globalThis.clearTimeout(delayTimer);
      if (dropTimer !== undefined) {
        globalThis.clearTimeout(dropTimer);
      }
    };
  }, [start, from, to, reduced]);

  return { value, done, phase };
};
