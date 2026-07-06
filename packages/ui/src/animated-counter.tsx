'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from './utils';

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
};

/** Animated number counter that smoothly rolls up to target value. */
export const AnimatedCounter = ({
  value,
  duration = 1000,
  suffix = '',
  prefix = '',
  className,
}: AnimatedCounterProps) => {
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={cn('tabular-nums font-bold', className)}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};
