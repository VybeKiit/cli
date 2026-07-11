import { Card, CardContent } from '@vybekiit/ui/card';
import { cn } from '@/lib/utils';
import { DeltaBadge } from './DeltaBadge';
import { formatMetric } from './metricFormat';
import type { MetricDef, MetricPoint } from './types';

/** One KPI card. Shows a pulsing skeleton in place of the value while the dashboard is refreshing. */
export const MetricCard = ({
  def,
  point,
  loading,
}: {
  readonly def: MetricDef;
  readonly point: MetricPoint;
  readonly loading: boolean;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', def.chip)}>
          {def.icon}
        </span>
        {loading ? null : <DeltaBadge deltaPct={point.deltaPct} invert={def.invertDelta} />}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">{def.label}</p>
      {loading ? (
        <span className="mt-1 block h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="font-bold text-2xl tabular-nums tracking-tight">
          {formatMetric(def, point.value)}
        </p>
      )}
    </CardContent>
  </Card>
);
