import { Badge } from '@vybekiit/ui/badge';
import { cn } from '@/lib/utils';
import { STATUS_META } from './constants';
import type { SubStatus } from './types';

/** Status pill — label carries the meaning; color is decorative reinforcement. */
export const StatusBadge = ({ status }: { readonly status: SubStatus }) => (
  <Badge className={cn('font-medium', STATUS_META[status].className)} variant="outline">
    {STATUS_META[status].label}
  </Badge>
);
