'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedUnderlineTextProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly active?: boolean;
}

/** Single sweep underline after text completes (respects reduced motion). */
export function AnimatedUnderlineText({
  children,
  className,
  active = true,
}: AnimatedUnderlineTextProps) {
  return (
    <span
      className={cn(
        'hero-animated-underline',
        active && 'hero-animated-underline--active',
        className,
      )}
    >
      {children}
    </span>
  );
}
