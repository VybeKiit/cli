import { Badge } from '@vybekiit/ui/badge';
import { Card, CardContent } from '@vybekiit/ui/card';
import { IconBox } from '@vybekiit/ui/icon-box';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const MetricCard = ({
  icon,
  label,
  value,
  trend,
  valueClassName,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly trend: string;
  readonly valueClassName?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-2">
        <IconBox size="sm">{icon}</IconBox>
        <Badge variant="secondary">{trend}</Badge>
      </div>
      <p className="mt-3 text-muted-foreground text-xs">{label}</p>
      <p className={cn('mt-1 font-bold text-2xl tabular-nums', valueClassName)}>{value}</p>
    </CardContent>
  </Card>
);
