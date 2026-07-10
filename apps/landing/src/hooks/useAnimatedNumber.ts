'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/motion';

/**
 * Shared roll duration so every number on a section finishes together.
 * Keep in sync with `AnimatedNumber` NumberFlow timing.
 */
export const NUMBER_ROLL_MS = 1500;

/**
 * Smooth ease-out used for digit rolls (0 → target).
 */
export const NUMBER_ROLL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)' as const;

/**
 * NumberFlow spin / transform timing — one curve for every landing roll.
 */
export const numberRollTiming = {
  duration: NUMBER_ROLL_MS,
  easing: NUMBER_ROLL_EASING,
} as const;

/**
 * Rolls from `from` (default 0) to `target` when `start` becomes true.
 * Double rAF paints the start value first so NumberFlow always has a previous
 * digit to spin from (avoids snapping straight to the final number).
 *
 * @param target - Final number to land on.
 * @param start - When true, begin the roll (usually after in-view).
 * @param from - Starting number (default 0).
 * @returns The current numeric value to render.
 * @example
 * const value = useAnimatedNumber(29, inView);
 */
export const useAnimatedNumber = (target: number, start: boolean, from = 0): number => {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!start) {
      setValue(from);
      return;
    }
    if (reduced) {
      setValue(target);
      return;
    }

    // Paint `from` first, then jump to `target` so NumberFlow can interpolate.
    setValue(from);
    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        setValue(target);
      });
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [start, target, from, reduced]);

  return value;
};
