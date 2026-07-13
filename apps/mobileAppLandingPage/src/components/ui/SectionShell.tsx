import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionShellProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Max-width content wrapper for landing sections.
 *
 * @param props - Component props.
 * @returns The rendered SectionShell element.
 * @example
 * ```tsx
 * <SectionShell>…</SectionShell>
 * ```
 */

export const SectionShell = ({ children, className, id }: SectionShellProps) => (
  <section className={cn('relative mx-auto max-w-6xl px-6 md:px-8', className)} id={id}>
    {children}
  </section>
);
