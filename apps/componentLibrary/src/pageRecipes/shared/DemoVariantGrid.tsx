import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DemoVariantGridProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly description?: string;
  readonly title: string;
}

/**
 * Render a labeled grid for comparing recipe component states.
 *
 * @param props - Section title, optional description, className, and grid children.
 * @returns A responsive variant grid.
 * @example
 * const element = <DemoVariantGrid title="Buttons"><DemoVariantCard label="Primary">...</DemoVariantCard></DemoVariantGrid>;
 */
export const DemoVariantGrid = ({
  children,
  className,
  description,
  title,
}: DemoVariantGridProps) => (
  <section className={cn('rounded-lg border bg-card p-4', className)}>
    <div className="mb-4">
      <h2 className="font-semibold text-lg">{title}</h2>
      {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
  </section>
);
