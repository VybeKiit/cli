'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from './utils';

interface AnimatedCounterProps {
  readonly value: number;
  readonly duration?: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly className?: string;
}

/**
 * Animated number counter that smoothly rolls toward the target value.
 *
 * @param props - Counter value, animation duration, affixes, and text classes.
 * @returns A formatted animated counter span.
 * @example
 * <AnimatedCounter value={1200} prefix="$" suffix=" earned" />;
 */
export const AnimatedCounter = (props: AnimatedCounterProps) => {
  const { value, duration = 1000, suffix = '', prefix = '', className = '' } = props;
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = startRef.current;
    const diff = value - start;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(start + diff * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={cn('font-bold tabular-nums', className)}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};
