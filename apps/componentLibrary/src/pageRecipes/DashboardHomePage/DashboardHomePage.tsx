'use client';

import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@vybekiit/ui/empty';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import {
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
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { ActionRow } from './ActionRow';
import { FeedList } from './FeedList';
import { FeedSkeleton } from './FeedSkeleton';
import { MetricCard } from './MetricCard';
import { formatMetric } from './metricFormat';
import type {
  ActionItem,
  ActivityEvent,
  ActivityKind,
  LoadState,
  MetricDef,
  MetricId,
  MetricPoint,
  RangeKey,
} from './types';

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
      <DemoRecipeFrame defaultTransition="fade" title="Dashboard motion pass">
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
      </DemoRecipeFrame>
    );
  }

  // ---------- ready / refreshing (main) ----------
  return (
    <DemoRecipeFrame defaultTransition="fade" title="Dashboard motion pass">
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
          <SegmentedControl
            onValueChange={(value) => setRange(value as typeof range)}
            value={range}
          >
            {RANGE_OPTIONS.map((option) => (
              <SegmentedControlItem key={option.id} value={option.id}>
                {option.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
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
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia className="size-12 rounded-full bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 aria-hidden="true" className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle className="text-base outline-none" ref={caughtUpRef} tabIndex={-1}>
                      You're all caught up
                    </EmptyTitle>
                    <EmptyDescription>Every action item is handled.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={restoreActions} size="sm" type="button" variant="outline">
                      Restore items
                    </Button>
                  </EmptyContent>
                </Empty>
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
        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — the range toggle recomputes every card and Refresh
            drives the live loading and error states (the <b>Simulate outage</b> button is a demo
            affordance; delete it in your app). To make it real:
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
              Feed the activity list from your events — recent <code>orders</code> rows map straight
              onto it; replace <code>ACTIVITY</code>.
            </li>
            <li>
              Derive <code>ACTION_ITEMS</code> from your own checks and persist a dismissal with a{' '}
              <code>PATCH /api/actions/:id</code> so it stays cleared on reload.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
