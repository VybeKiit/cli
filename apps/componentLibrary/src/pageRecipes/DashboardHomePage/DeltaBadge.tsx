import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isGoodDelta } from './metricFormat';

/** The colored ▲/▼ change chip; green when the change is in the healthy direction, red otherwise. */
export const DeltaBadge = ({
  deltaPct,
  invert,
}: {
  readonly deltaPct: number;
  readonly invert: boolean;
}) => {
  const rising = deltaPct >= 0;
  const good = isGoodDelta(deltaPct, invert);
  const Arrow = rising ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium text-xs tabular-nums',
        good ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600',
      )}
    >
      <Arrow aria-hidden="true" className="h-3 w-3" />
      {rising ? '+' : ''}
      {deltaPct}%
    </span>
  );
};
