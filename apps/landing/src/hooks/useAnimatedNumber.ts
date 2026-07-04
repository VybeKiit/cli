'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/motion';

/** Rolls from zero to target when `start` becomes true. */
export function useAnimatedNumber(target: number, start: boolean): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }
    if (reduced) {
      setValue(target);
      return;
    }
    const frame = requestAnimationFrame(() => setValue(target));
    return () => cancelAnimationFrame(frame);
  }, [start, target, reduced]);

  return value;
}
