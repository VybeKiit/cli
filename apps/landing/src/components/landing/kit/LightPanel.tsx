import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LightPanelProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly contentClassName?: string;
}

/**
 * Light marketing mock surface — matches kit Card styling from templates/web.
 *
 * @param props - Component props.
 * @returns The rendered LightPanel element.
 * @example
 * ```tsx
 * <LightPanel />
 * ```
 */

export const LightPanel = ({
  title,
  description,
  children,
  className,
  contentClassName,
}: LightPanelProps) => (
  <Card
    className={cn(
      'w-full gap-0 overflow-hidden border-black/8 bg-[var(--light-card)] py-0 text-[var(--light-text)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]',
      className,
    )}
  >
    <CardHeader className="space-y-1 px-6 pt-6 pb-4">
      <CardTitle className="font-bold text-xl">{title}</CardTitle>
      {description ? (
        <CardDescription className="text-[var(--light-muted)]">{description}</CardDescription>
      ) : null}
    </CardHeader>
    <CardContent className={cn('px-6 pb-6', contentClassName)}>{children}</CardContent>
  </Card>
);
