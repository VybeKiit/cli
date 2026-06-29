'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

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
