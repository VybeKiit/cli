'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CloudOff,
  CreditCard,
  Database,
  DollarSign,
  Globe,
  Loader2,
  Package,
  RefreshCw,
  Rocket,
  ShoppingBag,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type RangeKey = '24h' | '7d' | '30d';
type MetricId = 'revenue' | 'customers' | 'active' | 'churn';
type ActivityKind = 'signup' | 'order' | 'system';
type Priority = 'high' | 'medium' | 'low';
type LoadState = 'ready' | 'refreshing' | 'error';

/** A dashboard KPI. Presentation is static; the value/delta come per range from `METRICS_BY_RANGE`. */
type MetricDef = {
  readonly id: MetricId;
  readonly label: string;
  readonly icon: ReactNode;
  readonly chip: string;
  readonly format: 'money' | 'number';
  /** Churn is healthier when it falls, so for it a negative delta is the "good" direction. */
  readonly invertDelta: boolean;
};

/** A metric's value (integer cents when money) and its change vs the previous period. */
type MetricPoint = { readonly value: number; readonly deltaPct: number };

type ActivityEvent = {
  readonly id: string;
  readonly kind: ActivityKind;
  readonly title: string;
  readonly meta: string;
  readonly time: string;
  readonly icon: ReactNode;
};

type ActionItem = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly priority: Priority;
  readonly icon: ReactNode;
};

const RANGE_OPTIONS: readonly { readonly id: RangeKey; readonly label: string }[] = [
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
];

const METRIC_DEFS: readonly MetricDef[] = [
  {
    id: 'revenue',
    label: 'Revenue',
    icon: <DollarSign aria-hidden="true" className="h-5 w-5" />,
    chip: 'bg-emerald-500/10 text-emerald-600',
    format: 'money',
    invertDelta: false,
  },
  {
    id: 'customers',
    label: 'New customers',
    icon: <UserPlus aria-hidden="true" className="h-5 w-5" />,
    chip: 'bg-blue-500/10 text-blue-600',
    format: 'number',
    invertDelta: false,
  },
  {
    id: 'active',
    label: 'Active users',
    icon: <Users aria-hidden="true" className="h-5 w-5" />,
    chip: 'bg-violet-500/10 text-violet-600',
    format: 'number',
    invertDelta: false,
  },
  {
    id: 'churn',
    label: 'Churn risk',
    icon: <TriangleAlert aria-hidden="true" className="h-5 w-5" />,
    chip: 'bg-amber-500/10 text-amber-600',
    format: 'number',
    invertDelta: true,
  },
];

/** Metric values per range. Money is integer cents; `deltaPct` is the change vs the previous period. */
const METRICS_BY_RANGE: Record<RangeKey, Record<MetricId, MetricPoint>> = {
  '24h': {
    revenue: { value: 128_400, deltaPct: 8.2 },
    customers: { value: 14, deltaPct: 5 },
    active: { value: 312, deltaPct: 2.1 },
    churn: { value: 3, deltaPct: -25 },
  },
  '7d': {
    revenue: { value: 964_000, deltaPct: 12.4 },
    customers: { value: 96, deltaPct: 9 },
    active: { value: 1204, deltaPct: 4.4 },
    churn: { value: 11, deltaPct: 6 },
  },
  '30d': {
    revenue: { value: 4_182_000, deltaPct: 18.6 },
    customers: { value: 418, deltaPct: 14 },
    active: { value: 2980, deltaPct: 7.2 },
    churn: { value: 42, deltaPct: -4 },
  },
};

const KIND_CHIP: Record<ActivityKind, string> = {
  signup: 'bg-blue-500/10 text-blue-600',
  order: 'bg-emerald-500/10 text-emerald-600',
  system: 'bg-violet-500/10 text-violet-600',
};

const ACTIVITY: readonly ActivityEvent[] = [
  {
    id: 'a1',
    kind: 'order',
    title: 'Order #VK-4821 paid',
    meta: '$199.00 · Starter Kit',
    time: '2m ago',
    icon: <ShoppingBag aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'a2',
    kind: 'signup',
    title: 'Priya Nair signed up',
    meta: 'Growth plan · 5 seats',
    time: '18m ago',
    icon: <UserPlus aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'a3',
    kind: 'system',
    title: 'Deploy v1.4.2 shipped',
    meta: 'Cloudflare Workers · 41s',
    time: '52m ago',
    icon: <Rocket aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'a4',
    kind: 'order',
    title: 'Order #VK-4820 paid',
    meta: '$65.00 · Founder Hoodie',
    time: '1h ago',
    icon: <ShoppingBag aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'a5',
    kind: 'signup',
    title: 'Sofia Rossi signed up',
    meta: 'Starter plan · 1 seat',
    time: '3h ago',
    icon: <UserPlus aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'a6',
    kind: 'system',
    title: 'Nightly D1 backup completed',
    meta: 'vybekiit · 128 MB',
    time: '6h ago',
    icon: <Database aria-hidden="true" className="h-4 w-4" />,
  },
];

const ACTIVITY_FILTERS: readonly { readonly id: 'all' | ActivityKind; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'order', label: 'Orders' },
  { id: 'signup', label: 'Signups' },
  { id: 'system', label: 'System' },
];

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'border-red-500/40 text-red-600',
  medium: 'border-amber-500/40 text-amber-600',
  low: 'text-muted-foreground',
};

const ACTION_ITEMS: readonly ActionItem[] = [
  {
    id: 'domain',
    title: 'Verify your domain',
    detail: 'DNS for vybekiit.com is still pending.',
    priority: 'high',
    icon: <Globe aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'fulfill',
    title: '3 orders need fulfillment',
    detail: 'Ship or mark the physical goods delivered.',
    priority: 'high',
    icon: <Package aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'team',
    title: 'Invite your team',
    detail: '2 of 5 seats are still open.',
    priority: 'medium',
    icon: <Users aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: 'payout',
    title: 'Add a payout method',
    detail: 'Connect Lemon Squeezy payouts to get paid.',
    priority: 'low',
    icon: <CreditCard aria-hidden="true" className="h-4 w-4" />,
  },
];

const REFRESH_MS = 900;

const usd = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

const formatMetric = (def: MetricDef, value: number): string =>
  def.format === 'money' ? usd(value) : formatNumber(value);

/** A rising delta is good, unless the metric is inverted (churn) where a falling delta is the win. */
const isGoodDelta = (deltaPct: number, invert: boolean): boolean => {
  if (deltaPct === 0) {
    return true;
  }
  return deltaPct > 0 !== invert;
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * A production-shaped signed-in dashboard home: live KPI cards driven by a range toggle, a filterable
 * activity feed, and a dismissable action rail — with real loading, error, and caught-up states
 * reachable by interacting (Refresh drives loading; "Simulate outage" then Refresh reaches the error
 * state; clearing every action reaches the empty state). Fully interactive with local state — no
 * backend needed to demo it; see the "Plug this into your app" panel for the real D1 wiring.
 *
 * @returns The dashboard home recipe element.
 * @example
 * const element = <DashboardHomePage />;
 */
export const DashboardHomePage = () => {
  const rangeLabelId = useId();
  const metricsSummaryId = useId();
  const feedHeadingId = useId();
  const actionsHeadingId = useId();
  const caughtUpRef = useRef<HTMLParagraphElement>(null);

  const [range, setRange] = useState<RangeKey>('7d');
  const [loadState, setLoadState] = useState<LoadState>('ready');
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityKind>('all');
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());

  const points = METRICS_BY_RANGE[range];
  const rangeLabel = RANGE_OPTIONS.find((option) => option.id === range)?.label ?? range;
  const filteredActivity =
    activityFilter === 'all' ? ACTIVITY : ACTIVITY.filter((event) => event.kind === activityFilter);
  const visibleActions = ACTION_ITEMS.filter((item) => !dismissed.has(item.id));
  const isRefreshing = loadState === 'refreshing';

  // Move focus to the caught-up heading when the last action is cleared (keyboard + screen readers).
  useEffect(() => {
    if (visibleActions.length === 0) {
      caughtUpRef.current?.focus();
    }
  }, [visibleActions.length]);

  const runRefresh = (fail: boolean) => {
    setLoadState('refreshing');
    // Simulated fetch. Real apps GET /api/metrics?range=… and render the response.
    globalThis.setTimeout(() => setLoadState(fail ? 'error' : 'ready'), REFRESH_MS);
  };

  const dismissAction = (id: string) => {
    setDismissed((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const restoreActions = () => setDismissed(new Set());

  const metricsSummary = `Last ${rangeLabel}: ${METRIC_DEFS.map(
    (def) => `${def.label} ${formatMetric(def, points[def.id].value)}`,
  ).join(', ')}.`;

  // ---------- error ----------
  if (loadState === 'error') {
    return (
      <Frame>
        <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-24 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <CloudOff aria-hidden="true" className="h-8 w-8" />
          </span>
          <h1 className="mt-6 font-bold text-2xl tracking-tight">Couldn't load your dashboard</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            We couldn't reach your data source. Your data is safe — this is usually transient.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setSimulateOutage(false);
              runRefresh(false);
            }}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> Retry
          </Button>
        </main>
      </Frame>
    );
  }

  // ---------- ready / refreshing (main) ----------
  return (
    <Frame>
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Welcome back, Maya</h1>
            <p className="text-muted-foreground">
              Here's how your launch is doing. Switch the range or refresh — every card updates
              live.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-pressed={simulateOutage}
              className={cn(simulateOutage && 'border-red-500/50 text-red-600')}
              onClick={() => setSimulateOutage((value) => !value)}
              size="sm"
              title="Demo control: makes the next refresh fail so you can see the error state"
              type="button"
              variant="outline"
            >
              <CloudOff aria-hidden="true" className="h-4 w-4" /> Simulate outage
            </Button>
            <Button
              aria-busy={isRefreshing}
              disabled={isRefreshing}
              onClick={() => runRefresh(simulateOutage)}
              size="sm"
              type="button"
            >
              {isRefreshing ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Refreshing…
                </>
              ) : (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4" /> Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* range selector */}
        <div className="mt-6 flex items-center gap-2">
          <span className="text-muted-foreground text-sm" id={rangeLabelId}>
            Showing
          </span>
          <div
            aria-labelledby={rangeLabelId}
            className="flex gap-1 rounded-lg border bg-muted p-1"
            role="group"
          >
            {RANGE_OPTIONS.map((option) => (
              <button
                aria-pressed={range === option.id}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium text-sm transition-colors',
                  range === option.id
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={option.id}
                onClick={() => setRange(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* one screen-reader announcement covers every metric change */}
        <p aria-live="polite" className="sr-only" id={metricsSummaryId}>
          {metricsSummary}
        </p>

        {/* metric cards */}
        <section
          aria-busy={isRefreshing}
          aria-label="Key metrics"
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {METRIC_DEFS.map((def) => (
            <MetricCard def={def} key={def.id} loading={isRefreshing} point={points[def.id]} />
          ))}
        </section>

        {/* main: activity feed + action rail */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* activity feed */}
          <Card>
            <CardHeader className="gap-3">
              <CardTitle className="text-base" id={feedHeadingId}>
                Recent activity
              </CardTitle>
              <div aria-label="Filter activity" className="flex flex-wrap gap-1" role="group">
                {ACTIVITY_FILTERS.map((filter) => (
                  <button
                    aria-pressed={activityFilter === filter.id}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      activityFilter === filter.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    key={filter.id}
                    onClick={() => setActivityFilter(filter.id)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {isRefreshing ? (
                <FeedSkeleton />
              ) : (
                <FeedList events={filteredActivity} labelId={feedHeadingId} />
              )}
            </CardContent>
          </Card>

          {/* action rail */}
          <Card className="self-start lg:sticky lg:top-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base" id={actionsHeadingId}>
                  Needs your attention
                </CardTitle>
                <span aria-live="polite" className="text-muted-foreground text-xs">
                  {visibleActions.length > 0 ? plural(visibleActions.length, 'item') : 'Clear'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {visibleActions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <p className="mt-3 font-medium outline-none" ref={caughtUpRef} tabIndex={-1}>
                    You're all caught up
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Every action item is handled.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={restoreActions}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Restore items
                  </Button>
                </div>
              ) : (
                <ul aria-labelledby={actionsHeadingId} className="space-y-3">
                  {visibleActions.map((item) => (
                    <ActionRow item={item} key={item.id} onDismiss={() => dismissAction(item.id)} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* real integration contract — the point that makes this plug-and-play */}
        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — the range toggle recomputes every card and
              Refresh drives the live loading and error states (the <b>Simulate outage</b> button is
              a demo affordance; delete it in your app). To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Add a <code>GET /api/metrics?range=7d</code> route handler that queries the D1{' '}
                <code>vybekiit</code> database — the same <code>orders</code> table the shipped{' '}
                <code>app/api/webhook/route.ts</code> writes to — returning{' '}
                <code>{'{ revenueCents, newCustomers, activeUsers, churnRisk, deltaPct }'}</code>.
              </li>
              <li>
                Swap <code>METRICS_BY_RANGE</code> for that response and fetch it from{' '}
                <code>runRefresh</code>; keep the <code>refreshing</code> and <code>error</code>{' '}
                states as-is.
              </li>
              <li>
                Feed the activity list from your events — recent <code>orders</code> rows map
                straight onto it; replace <code>ACTIVITY</code>.
              </li>
              <li>
                Derive <code>ACTION_ITEMS</code> from your own checks and persist a dismissal with a{' '}
                <code>PATCH /api/actions/:id</code> so it stays cleared on reload.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper (matches the other recipes). */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="fade" title="Dashboard motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** One KPI card. Shows a pulsing skeleton in place of the value while the dashboard is refreshing. */
const MetricCard = ({
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
        <p className="font-bold text-2xl tracking-tight tabular-nums">
          {formatMetric(def, point.value)}
        </p>
      )}
    </CardContent>
  </Card>
);

/** The colored ▲/▼ change chip; green when the change is in the healthy direction, red otherwise. */
const DeltaBadge = ({
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

/** The activity list, or an in-context empty state when the active filter matches nothing. */
const FeedList = ({
  events,
  labelId,
}: {
  readonly events: readonly ActivityEvent[];
  readonly labelId: string;
}) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <p className="font-medium text-sm">No activity in this filter</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Pick another filter to see more events.
        </p>
      </div>
    );
  }
  return (
    <ul aria-labelledby={labelId} className="divide-y">
      {events.map((event) => (
        <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0" key={event.id}>
          <span
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              KIND_CHIP[event.kind],
            )}
          >
            {event.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{event.title}</p>
            <p className="truncate text-muted-foreground text-xs">{event.meta}</p>
          </div>
          <span className="shrink-0 text-muted-foreground text-xs">{event.time}</span>
        </li>
      ))}
    </ul>
  );
};

/** Four pulsing placeholder rows shown in the feed while the dashboard is refreshing. */
const FeedSkeleton = () => (
  <ul className="divide-y">
    {[0, 1, 2, 3].map((row) => (
      <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={row}>
        <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <span className="block h-3 w-1/2 animate-pulse rounded bg-muted" />
          <span className="block h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </li>
    ))}
  </ul>
);

/** One attention item in the action rail; the check button clears it and updates the live count. */
const ActionRow = ({
  item,
  onDismiss,
}: {
  readonly item: ActionItem;
  readonly onDismiss: () => void;
}) => (
  <li className="flex items-start gap-3 rounded-lg border p-3">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      {item.icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="font-medium text-sm">{item.title}</p>
        <Badge
          className={cn('text-[10px] capitalize', PRIORITY_BADGE[item.priority])}
          variant="outline"
        >
          {item.priority}
        </Badge>
      </div>
      <p className="mt-0.5 text-muted-foreground text-xs">{item.detail}</p>
    </div>
    <button
      aria-label={`Mark "${item.title}" done`}
      className="text-muted-foreground transition-colors hover:text-emerald-600"
      onClick={onDismiss}
      type="button"
    >
      <CheckCircle2 className="h-4 w-4" />
    </button>
  </li>
);
