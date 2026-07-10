'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Activity, BarChart3, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type Range = '7d' | '30d' | '90d';
type EventKind = 'signup' | 'purchase' | 'error' | 'pageview';

/** Metric snapshot for a date range. */
type MetricSnapshot = {
  readonly visitors: number;
  readonly signups: number;
  readonly errors: number;
  readonly conversion: number;
  readonly series: readonly number[];
};

/** One event row under the chart. */
type AnalyticsEvent = {
  readonly id: string;
  readonly kind: EventKind;
  readonly label: string;
  readonly at: string;
};

const RANGE_DATA: Record<Range, MetricSnapshot> = {
  '7d': {
    visitors: 3240,
    signups: 186,
    errors: 2,
    conversion: 5.7,
    series: [12, 18, 14, 22, 28, 24, 31],
  },
  '30d': {
    visitors: 12_800,
    signups: 842,
    errors: 0,
    conversion: 6.6,
    series: [18, 22, 19, 28, 31, 27, 34, 30, 36, 33, 40, 38],
  },
  '90d': {
    visitors: 41_200,
    signups: 2410,
    errors: 7,
    conversion: 5.8,
    series: [20, 24, 22, 30, 28, 35, 32, 38, 36, 42, 40, 48],
  },
};

const EVENTS: readonly AnalyticsEvent[] = [
  {
    id: 'ev_01',
    kind: 'purchase',
    label: 'Checkout completed · $49.00',
    at: '4m ago',
  },
  {
    id: 'ev_02',
    kind: 'signup',
    label: 'New account · aria@northwind.io',
    at: '18m ago',
  },
  {
    id: 'ev_03',
    kind: 'pageview',
    label: 'Viewed /pricing',
    at: '22m ago',
  },
  {
    id: 'ev_04',
    kind: 'error',
    label: 'API 500 on /api/checkout',
    at: '1h ago',
  },
  {
    id: 'ev_05',
    kind: 'signup',
    label: 'New account · sam@orbit.app',
    at: '2h ago',
  },
  {
    id: 'ev_06',
    kind: 'purchase',
    label: 'Checkout completed · $19.00',
    at: '3h ago',
  },
  {
    id: 'ev_07',
    kind: 'error',
    label: 'Client timeout on Safari 17',
    at: 'Yesterday',
  },
];

const KIND_META: Record<EventKind, { readonly label: string; readonly className: string }> = {
  signup: {
    label: 'Signup',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
  },
  purchase: {
    label: 'Purchase',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  error: {
    label: 'Error',
    className: 'border-red-500/30 bg-red-500/10 text-red-600',
  },
  pageview: {
    label: 'Page',
    className: 'border-border bg-muted text-muted-foreground',
  },
};

/**
 * Interactive analytics: range switch recomputes KPIs and sparkline; event filters + export.
 *
 * @returns The analytics recipe element.
 * @example
 * const element = <AnalyticsPage />;
 */
export const AnalyticsPage = () => {
  // TODO: Connect usage totals to the configured analytics provider.
  // TODO: Connect error alerts to the configured tracking provider.
  const [range, setRange] = useState<Range>('30d');
  const [kindFilter, setKindFilter] = useState<'all' | EventKind>('all');
  const [exported, setExported] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const metrics = RANGE_DATA[range];

  const visibleEvents = useMemo(
    () => (kindFilter === 'all' ? EVENTS : EVENTS.filter((event) => event.kind === kindFilter)),
    [kindFilter],
  );

  const maxSeries = Math.max(...metrics.series);

  const exportReport = () => {
    setExported(true);
    setNotice(`Exported ${range} report (${metrics.visitors.toLocaleString()} visitors).`);
    globalThis.setTimeout(() => setExported(false), 1600);
  };

  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Analytics
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Product health</h1>
            <p className="max-w-xl text-muted-foreground">
              Switch ranges to recompute KPIs, scan the sparkline, and filter live events.
            </p>
          </div>
          <Button disabled={exported} onClick={exportReport} type="button" variant="outline">
            <Download aria-hidden="true" className="h-4 w-4" />
            {exported ? 'Exported' : 'Export report'}
          </Button>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 flex flex-wrap gap-1 rounded-lg border bg-muted p-1">
          {(
            [
              { value: '7d', label: '7 days' },
              { value: '30d', label: '30 days' },
              { value: '90d', label: '90 days' },
            ] as const
          ).map((option) => (
            <button
              aria-pressed={range === option.value}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium text-sm transition-colors',
                range === option.value
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              key={option.value}
              onClick={() => setRange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
            label="Visitors"
            trend={range === '7d' ? '+12%' : '+18%'}
            value={metrics.visitors.toLocaleString()}
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            label="Signups"
            trend={range === '90d' ? '+6%' : '+9%'}
            value={metrics.signups.toLocaleString()}
          />
          <MetricCard
            icon={<Activity className="h-4 w-4 text-rose-600" />}
            label="Errors"
            trend={metrics.errors === 0 ? 'Clean' : `${metrics.errors} open`}
            value={String(metrics.errors)}
            valueClassName={metrics.errors === 0 ? 'text-emerald-600' : 'text-rose-600'}
          />
          <MetricCard
            icon={<TrendingDown className="h-4 w-4 text-violet-600" />}
            label="Conversion"
            trend={`${metrics.conversion}%`}
            value={`${metrics.conversion}%`}
          />
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Traffic ({range})</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-label="Traffic sparkline" className="flex h-36 items-end gap-1.5" role="img">
              {metrics.series.map((point, index) => (
                <div
                  className="flex-1 rounded-t-sm bg-primary/80 transition-all"
                  key={`${range}-${index}`}
                  style={{ height: `${Math.max(8, (point / maxSeries) * 100)}%` }}
                  title={String(point)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base">Recent events</CardTitle>
            <div className="flex flex-wrap gap-1">
              {(['all', 'signup', 'purchase', 'error', 'pageview'] as const).map((value) => (
                <button
                  aria-pressed={kindFilter === value}
                  className={cn(
                    'rounded-md border px-2 py-1 font-medium text-xs capitalize transition-colors',
                    kindFilter === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  key={value}
                  onClick={() => setKindFilter(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            {visibleEvents.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Activity aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">No events</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Nothing matches this event kind.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setKindFilter('all')}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Show all
                </Button>
              </div>
            ) : (
              <ul aria-label="Analytics events" className="divide-y">
                {visibleEvents.map((event) => (
                  <li className="flex items-center gap-3 px-2 py-3" key={event.id}>
                    <Badge
                      className={cn('font-normal', KIND_META[event.kind].className)}
                      variant="outline"
                    >
                      {KIND_META[event.kind].label}
                    </Badge>
                    <p className="min-w-0 flex-1 truncate text-sm">{event.label}</p>
                    <span className="shrink-0 text-muted-foreground text-xs">{event.at}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — range chips recompute KPIs and the sparkline
              without inventing live production secrets. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Replace <code>RANGE_DATA</code> with totals from the configured analytics provider (
                <code>GET /api/analytics?range=</code>).
              </li>
              <li>
                Map error rows from the tracking provider; keep the error KPI red when count &gt; 0.
              </li>
              <li>Export can stream a CSV of the filtered event list for the selected range.</li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

const MetricCard = ({
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
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">{icon}</span>
        <Badge variant="secondary">{trend}</Badge>
      </div>
      <p className="mt-3 text-muted-foreground text-xs">{label}</p>
      <p className={cn('mt-1 font-bold text-2xl tabular-nums', valueClassName)}>{value}</p>
    </CardContent>
  </Card>
);

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="blur" title="Analytics motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
