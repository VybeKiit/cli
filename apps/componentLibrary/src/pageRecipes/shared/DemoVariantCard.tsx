import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
