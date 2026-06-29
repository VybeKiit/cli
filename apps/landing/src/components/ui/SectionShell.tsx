import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionShellProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/** Max-width content wrapper for landing sections. */
export function SectionShell({ children, className, id }: SectionShellProps) {
  return (
    <section className={cn('relative mx-auto max-w-[1520px] px-6 md:px-12', className)} id={id}>
      {children}
    </section>
  );
}
