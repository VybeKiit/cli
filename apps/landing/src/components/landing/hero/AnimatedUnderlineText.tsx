'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedUnderlineTextProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly active?: boolean;
}

/**
 * Single sweep underline after text completes (respects reduced motion).
 *
 * @param props - Component props.
 * @returns The rendered AnimatedUnderlineText element.
 * @example
 * ```tsx
 * <AnimatedUnderlineText />
 * ```
 */

export const AnimatedUnderlineText = ({
  children,
  className,
  active = true,
}: AnimatedUnderlineTextProps) => (
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
