import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DemoVariantGridProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly description?: string;
  readonly title: string;
}

interface DemoVariantCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly label: string;
  readonly tone?: 'default' | 'primary' | 'accent' | 'muted';
}

const toneClassNames: Record<NonNullable<DemoVariantCardProps['tone']>, string> = {
  default: 'bg-card',
  primary: 'border-primary/30 bg-primary/5',
  accent: 'bg-accent/70',
  muted: 'bg-muted/60',
};

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

/**
 * Render one labeled variant card inside a demo grid.
 *
 * @param props - Card label, optional tone, className, and children.
 * @returns A card for one visual or interaction state.
 * @example
 * const element = <DemoVariantCard label="Large">Large text</DemoVariantCard>;
 */
export const DemoVariantCard = ({
  children,
  className,
  label,
  tone = 'default',
}: DemoVariantCardProps) => (
  <article className={cn('rounded-lg border p-3', toneClassNames[tone], className)}>
    <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
      {label}
    </p>
    {children}
  </article>
);
