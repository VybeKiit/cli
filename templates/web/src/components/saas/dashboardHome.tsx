'use client';

import { IntegrationTodo } from '@/components/saas/integrationTodo';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  CloudOff,
  CreditCard,
  DollarSign,
  Globe,
  Loader2,
  Package,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useState } from 'react';

type RangeKey = '24h' | '7d' | '30d';
type MetricId = 'revenue' | 'customers' | 'active' | 'orders';
type ActivityKind = 'all' | 'order' | 'signup' | 'system';

type MetricPoint = { readonly value: number; readonly deltaPct: number };

const RANGE_OPTIONS: readonly { readonly id: RangeKey; readonly label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
];

const METRICS_BY_RANGE: Record<RangeKey, Record<MetricId, MetricPoint>> = {
  '24h': {
    revenue: { value: 128_400, deltaPct: 8.2 },
    customers: { value: 14, deltaPct: 5 },
    active: { value: 312, deltaPct: 2.1 },
    orders: { value: 9, deltaPct: 12 },
  },
  '7d': {
    revenue: { value: 964_000, deltaPct: 12.4 },
    customers: { value: 96, deltaPct: 9 },
    active: { value: 1204, deltaPct: 4.4 },
    orders: { value: 64, deltaPct: 7 },
  },
  '30d': {
    revenue: { value: 4_182_000, deltaPct: 18.6 },
    customers: { value: 418, deltaPct: 14 },
    active: { value: 2980, deltaPct: 7.2 },
    orders: { value: 216, deltaPct: 11 },
  },
};

const ACTIVITY: readonly {
  readonly id: string;
  readonly kind: Exclude<ActivityKind, 'all'>;
  readonly title: string;
  readonly meta: string;
  readonly time: string;
}[] = [
  {
    id: 'a1',
    kind: 'order',
    title: 'Order #VK-4821 paid',
    meta: '$199.00 · Starter Kit',
    time: '2m ago',
  },
  {
    id: 'a2',
    kind: 'signup',
    title: 'Priya Nair signed up',
    meta: 'Growth plan · 5 seats',
    time: '18m ago',
  },
  {
    id: 'a3',
    kind: 'system',
    title: 'Deploy v1.4.2 shipped',
    meta: 'Edge · 41s',
    time: '52m ago',
  },
  {
    id: 'a4',
    kind: 'order',
    title: 'Order #VK-4820 paid',
    meta: '$65.00 · Template bundle',
    time: '1h ago',
  },
];

const ACTIONS: readonly {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly href: string;
  readonly priority: 'high' | 'medium' | 'low';
}[] = [
  {
    id: 'domain',
    title: 'Verify your domain',
    detail: 'DNS is still pending.',
    href: '/dashboard/integrations',
    priority: 'high',
  },
  {
    id: 'orders',
    title: 'Review open orders',
    detail: 'Fulfill or refund recent purchases.',
    href: '/dashboard/orders',
    priority: 'high',
  },
  {
    id: 'team',
    title: 'Invite your team',
    detail: 'Share the workspace with editors.',
    href: '/dashboard/teams',
    priority: 'medium',
  },
  {
    id: 'billing',
    title: 'Check pricing handoff',
    detail: 'Practice checkout until payments are live.',
    href: '/pricing',
    priority: 'low',
  },
];

const usd = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

/**
 * Interactive signed-in dashboard home with range metrics, activity filters, and next actions.
 *
 * @returns The dashboard overview page.
 * @example
 * <DashboardHomePage />
 */
export const DashboardHomePage = () => {
  const [range, setRange] = useState<RangeKey>('7d');
  const [filter, setFilter] = useState<ActivityKind>('all');
  const [loadState, setLoadState] = useState<'ready' | 'refreshing' | 'error'>('ready');
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());

  const points = METRICS_BY_RANGE[range];
  const activity = filter === 'all' ? ACTIVITY : ACTIVITY.filter((event) => event.kind === filter);
  const actions = ACTIONS.filter((item) => !dismissed.has(item.id));
  const refreshing = loadState === 'refreshing';

  const refresh = (fail = false) => {
    setLoadState('refreshing');
    // TODO(vybekiit): GET /api/metrics?range= — replace practice METRICS_BY_RANGE
    globalThis.setTimeout(() => setLoadState(fail ? 'error' : 'ready'), 700);
  };

  if (loadState === 'error') {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-600">
          <CloudOff aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-bold text-2xl">Couldn&apos;t load your dashboard</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Practice outage mode. Retry to restore the overview.
        </p>
        <Button className="mt-4" onClick={() => refresh(false)} type="button">
          <RefreshCw aria-hidden="true" className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const metricCards: readonly {
    readonly id: MetricId;
    readonly label: string;
    readonly format: 'money' | 'number';
    readonly icon: typeof DollarSign;
  }[] = [
    { id: 'revenue', label: 'Revenue', format: 'money', icon: DollarSign },
    { id: 'customers', label: 'New customers', format: 'number', icon: Users },
    { id: 'active', label: 'Active users', format: 'number', icon: Globe },
    { id: 'orders', label: 'Orders', format: 'number', icon: Package },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Launch health, recent activity, and the next actions that matter.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
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
          <Button
            disabled={refreshing}
            onClick={() => refresh(false)}
            type="button"
            variant="outline"
          >
            {refreshing ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button onClick={() => refresh(true)} type="button" variant="ghost">
            Simulate outage
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const point = points[metric.id];
          const Icon = metric.icon;
          const good = point.deltaPct >= 0;
          return (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl tracking-tight">
                  {metric.format === 'money' ? usd(point.value) : point.value.toLocaleString()}
                </p>
                <p
                  className={cn(
                    'mt-1 flex items-center gap-1 text-sm',
                    good ? 'text-emerald-600' : 'text-red-600',
                  )}
                >
                  {good ? (
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {point.deltaPct > 0 ? '+' : ''}
                  {point.deltaPct}% vs prior
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_22rem]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Orders, signups, and system events</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'order', 'signup', 'system'] as const).map((kind) => (
                <Button
                  key={kind}
                  onClick={() => setFilter(kind)}
                  size="sm"
                  type="button"
                  variant={filter === kind ? 'default' : 'outline'}
                >
                  {kind === 'all' ? 'All' : kind}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((event) => (
              <div
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
                key={event.id}
              >
                <div>
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-muted-foreground text-xs">{event.meta}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline">{event.kind}</Badge>
                  <span className="text-muted-foreground text-xs">{event.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <CardDescription>Dismiss items as you complete them</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.length === 0 ? (
              <p className="text-muted-foreground text-sm">You&apos;re caught up.</p>
            ) : (
              actions.map((item) => (
                <div className="rounded-lg border p-3" key={item.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-muted-foreground text-xs">{item.detail}</p>
                    </div>
                    <Badge variant="outline">{item.priority}</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button asChild={true} size="sm" type="button">
                      <Link href={item.href}>Open</Link>
                    </Button>
                    <Button
                      onClick={() =>
                        setDismissed((current) => {
                          const next = new Set(current);
                          next.add(item.id);
                          return next;
                        })
                      }
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))
            )}
            {actions.length === 0 ? (
              <Button
                onClick={() => setDismissed(new Set())}
                size="sm"
                type="button"
                variant="outline"
              >
                Restore actions
              </Button>
            ) : null}
            <div className="rounded-lg border border-dashed p-3 text-muted-foreground text-xs">
              <CreditCard aria-hidden="true" className="mb-1 h-4 w-4" />
              Pricing and checkout stay on the real `/pricing` flow.
            </div>
          </CardContent>
        </Card>
      </section>

      <IntegrationTodo
        feature="dashboard home"
        todos={[
          'GET /api/metrics?range= from orders + auth data.',
          'Replace practice activity with audit_log / webhook_events queries.',
          'Drive next actions from real launch checklist state (skill: go-live).',
        ]}
      />
    </div>
  );
};
