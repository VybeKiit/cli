'use client';

import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@vybekiit/ui/alert-dialog';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { Skeleton } from '@vybekiit/ui/skeleton';
import { Switch } from '@vybekiit/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@vybekiit/ui/table';
import {
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type PlanId = 'starter' | 'pro' | 'scale';
type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

/** One customer's subscription as the billing console sees it. MRR is integer cents. */
type Subscription = {
  readonly id: string;
  readonly customer: string;
  readonly email: string;
  readonly plan: PlanId;
  readonly status: SubStatus;
  readonly mrrCents: number;
  readonly seats: number;
  readonly renewsAt: string;
};

const PLAN_LABEL: Record<PlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
};

/** Badge label + tone for each subscription status. Status is never conveyed by color alone. */
const STATUS_META: Record<SubStatus, { readonly label: string; readonly className: string }> = {
  active: {
    label: 'Active',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  trialing: { label: 'Trialing', className: 'border-blue-500/30 bg-blue-500/10 text-blue-600' },
  past_due: { label: 'Past due', className: 'border-amber-500/40 bg-amber-500/10 text-amber-600' },
  canceled: { label: 'Canceled', className: 'border-border bg-muted text-muted-foreground' },
};

const STATUS_FILTERS: readonly { readonly value: 'all' | SubStatus; readonly label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'canceled', label: 'Canceled' },
];

/** Realistic multi-customer ledger — a spread of plans and every lifecycle status. */
const INITIAL_SUBS: readonly Subscription[] = [
  {
    id: 'sub_8Kd21',
    customer: 'Aria Montgomery',
    email: 'aria@northwind.io',
    plan: 'scale',
    status: 'active',
    mrrCents: 24_900,
    seats: 12,
    renewsAt: '2026-08-02',
  },
  {
    id: 'sub_5Rn09',
    customer: 'Marcus Bell',
    email: 'marcus@stackforge.dev',
    plan: 'pro',
    status: 'active',
    mrrCents: 8900,
    seats: 5,
    renewsAt: '2026-07-19',
  },
  {
    id: 'sub_3Qp77',
    customer: 'Lena Fischer',
    email: 'lena@brightloop.co',
    plan: 'pro',
    status: 'past_due',
    mrrCents: 8900,
    seats: 4,
    renewsAt: '2026-07-11',
  },
  {
    id: 'sub_9Wa14',
    customer: 'Diego Ramirez',
    email: 'diego@quantly.app',
    plan: 'starter',
    status: 'trialing',
    mrrCents: 2900,
    seats: 2,
    renewsAt: '2026-07-16',
  },
  {
    id: 'sub_2Fh63',
    customer: 'Priya Nair',
    email: 'priya@cadence.team',
    plan: 'scale',
    status: 'active',
    mrrCents: 24_900,
    seats: 20,
    renewsAt: '2026-08-08',
  },
  {
    id: 'sub_7Lc38',
    customer: 'Tom Becker',
    email: 'tom@paperkite.io',
    plan: 'starter',
    status: 'past_due',
    mrrCents: 2900,
    seats: 1,
    renewsAt: '2026-07-10',
  },
  {
    id: 'sub_4Vd50',
    customer: 'Sofia Rossi',
    email: 'sofia@lumenworks.com',
    plan: 'pro',
    status: 'canceled',
    mrrCents: 8900,
    seats: 6,
    renewsAt: '2026-07-05',
  },
  {
    id: 'sub_6Zx82',
    customer: 'Noah Kim',
    email: 'noah@driftlabs.dev',
    plan: 'starter',
    status: 'trialing',
    mrrCents: 2900,
    seats: 3,
    renewsAt: '2026-07-20',
  },
];

/** Stable keys for skeleton rows (avoids array-index keys during the loading state). */
const SKELETON_ROWS = ['sk1', 'sk2', 'sk3', 'sk4', 'sk5'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const LOAD_MS = 700;
const RETRY_MS = 1100;

type LoadState = 'loading' | 'ready' | 'error';
type StatusFilter = 'all' | SubStatus;

const usd = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const usdWhole = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);

/** Format a date-only ISO string without timezone drift (stays stable across SSR/CSR). */
const formatDate = (iso: string): string => {
  const [, month, day] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
};

const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

/**
 * A production-shaped admin billing console: every subscription across the workspace in a searchable,
 * filterable table with live MRR/status KPIs, plus real lifecycle actions — retry a past-due charge,
 * cancel (with a confirmation dialog), or reactivate. Every state is reachable: the table loads through
 * a skeleton, "Simulate outage" forces the error state with Retry, filtering to nothing shows the empty
 * state, and each action announces its result and updates the KPIs. Fully interactive with local state;
 * the "Plug this into your app" panel maps it onto the shipped D1 ledger + payments webhook.
 *
 * @returns The billing admin recipe element.
 * @example
 * const element = <BillingAdminPage />;
 */
export const BillingAdminPage = () => {
  const searchId = useId();
  const filterId = useId();
  const outageId = useId();

  const [subs, setSubs] = useState<readonly Subscription[]>(INITIAL_SUBS);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [outage, setOutage] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // The initial fetch and every manual refresh run through here. `fail` is explicit so the
  // error-clearing Retry can force a healthy load without waiting on the `outage` state update.
  const runLoad = (fail: boolean) => {
    setLoadState('loading');
    globalThis.setTimeout(() => {
      setLoadState(fail ? 'error' : 'ready');
    }, LOAD_MS);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: simulate the initial fetch once on mount.
  useEffect(() => {
    runLoad(outage);
  }, []);

  const kpis = useMemo(() => {
    const active = subs.filter((sub) => sub.status === 'active');
    const pastDue = subs.filter((sub) => sub.status === 'past_due');
    const trialing = subs.filter((sub) => sub.status === 'trialing');
    const mrr = [...active, ...pastDue].reduce((sum, sub) => sum + sub.mrrCents, 0);
    return {
      mrr,
      activeCount: active.length,
      pastDueCount: pastDue.length,
      trialingCount: trialing.length,
    };
  }, [subs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subs.filter((sub) => {
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      const matchesQuery =
        q.length === 0 ||
        sub.customer.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [subs, query, statusFilter]);

  const refresh = () => runLoad(outage);

  const retryLoad = () => {
    setOutage(false);
    runLoad(false);
  };

  const retryPayment = (sub: Subscription) => {
    setPendingId(sub.id);
    setNotice(null);
    // Simulated provider retry. Real apps POST /api/admin/subscriptions/:id/retry; the Lemon
    // Squeezy webhook flips the row to active once the charge settles.
    globalThis.setTimeout(() => {
      setSubs((current) =>
        current.map((item) => (item.id === sub.id ? { ...item, status: 'active' } : item)),
      );
      setPendingId(null);
      setNotice(`Payment retried — ${sub.customer} is active again.`);
    }, RETRY_MS);
  };

  const reactivate = (sub: Subscription) => {
    setSubs((current) =>
      current.map((item) => (item.id === sub.id ? { ...item, status: 'active' } : item)),
    );
    setNotice(`${sub.customer}'s subscription was reactivated.`);
  };

  const confirmCancel = () => {
    if (cancelTarget === null) {
      return;
    }
    const target = cancelTarget;
    setSubs((current) =>
      current.map((item) => (item.id === target.id ? { ...item, status: 'canceled' } : item)),
    );
    setNotice(`${target.customer}'s subscription was canceled.`);
    setCancelTarget(null);
  };

  let body: ReactNode;
  if (loadState === 'loading') {
    body = <SkeletonTable />;
  } else if (loadState === 'error') {
    body = <ErrorState onRetry={retryLoad} />;
  } else {
    body = (
      <SubscriptionsTable
        onCancel={setCancelTarget}
        onReactivate={reactivate}
        onRetry={retryPayment}
        pendingId={pendingId}
        rows={visible}
        totalCount={subs.length}
      />
    );
  }

  return (
    <Frame>
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Admin billing
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Billing</h1>
            <p className="max-w-xl text-muted-foreground">
              Every subscription across your workspace. Retry a past-due charge, cancel, or
              reactivate — each action mirrors the real provider call.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={outage} id={outageId} onCheckedChange={setOutage} />
              <Label className="text-muted-foreground text-sm" htmlFor={outageId}>
                Simulate outage
              </Label>
            </div>
            <Button
              disabled={loadState === 'loading'}
              onClick={refresh}
              type="button"
              variant="outline"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('h-4 w-4', loadState === 'loading' && 'animate-spin')}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* live KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi
            hint={`${kpis.activeCount + kpis.pastDueCount} paying customers`}
            icon={<Wallet aria-hidden="true" className="h-4 w-4" />}
            label="MRR"
            value={usdWhole(kpis.mrr)}
          />
          <Kpi
            hint="in good standing"
            icon={<Users aria-hidden="true" className="h-4 w-4" />}
            label="Active"
            value={String(kpis.activeCount)}
          />
          <Kpi
            hint="need a retry"
            icon={<TriangleAlert aria-hidden="true" className="h-4 w-4" />}
            label="Past due"
            value={String(kpis.pastDueCount)}
            valueClassName={cn(kpis.pastDueCount > 0 && 'text-amber-600')}
          />
          <Kpi
            hint="converting soon"
            icon={<Clock aria-hidden="true" className="h-4 w-4" />}
            label="Trials"
            value={String(kpis.trialingCount)}
          />
        </div>

        {/* result announcements (also surfaced visually in the Alert below) */}
        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <Alert className="mb-6">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            <AlertTitle>Done</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{notice}</span>
              <button
                className="shrink-0 font-medium text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
                onClick={() => setNotice(null)}
                type="button"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* subscriptions table */}
        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-base">Subscriptions</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Label className="sr-only" htmlFor={searchId}>
                  Search subscriptions
                </Label>
                <Search
                  aria-hidden="true"
                  className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
                />
                <Input
                  className="pl-9"
                  id={searchId}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search customer or email"
                  type="search"
                  value={query}
                />
              </div>
              <div>
                <Label className="sr-only" htmlFor={filterId}>
                  Filter by status
                </Label>
                <Select
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  value={statusFilter}
                >
                  <SelectTrigger className="w-full sm:w-[170px]" id={filterId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>{body}</CardContent>
        </Card>

        {/* real integration contract — the point that makes this plug-and-play */}
        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — the KPIs recompute from the rows, and
              Retry/Cancel/Reactivate flip status exactly like the provider webhook will. To make it
              real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Back the table with the D1 <code>orders</code> ledger (the customer table the
                checkout webhook already writes) joined to live Lemon Squeezy subscription state
                from <code>@vybekiit/payments</code>. Serve it from an admin-guarded{' '}
                <code>GET /api/admin/subscriptions</code>.
              </li>
              <li>
                <b>Retry</b> → <code>POST /api/admin/subscriptions/:id/retry</code>. The shipped
                webhook at <code>app/api/webhook/route.ts</code> receives{' '}
                <code>subscription_payment_success</code> and updates the row — mirror that
                optimistic flip here.
              </li>
              <li>
                <b>Cancel</b> → <code>POST /api/admin/subscriptions/:id/cancel</code>{' '}
                (cancel-at-period-end); <b>Reactivate</b> resumes it. Both settle when the provider
                webhook lands.
              </li>
              <li>
                Gate the route to admins and write every action to your audit log — billing
                mutations should never be anonymous.
              </li>
            </ol>
          </div>
        </details>
      </main>

      {/* cancel confirmation */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
          }
        }}
        open={cancelTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget
                ? `${cancelTarget.customer} (${PLAN_LABEL[cancelTarget.plan]}) keeps access until ${formatDate(cancelTarget.renewsAt)}, then moves to canceled. This mirrors a provider cancel-at-period-end.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep subscription</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Cancel subscription</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Frame>
  );
};

/** Gallery theme + motion wrapper (matches the other recipes). */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="scale" title="Billing motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** One KPI tile. `valueClassName` lets a caller tint the number (e.g. amber when past-due &gt; 0). */
const Kpi = ({
  icon,
  label,
  value,
  hint,
  valueClassName,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly valueClassName?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <p className={cn('mt-2 font-bold text-2xl tabular-nums', valueClassName)}>{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </CardContent>
  </Card>
);

/** Status pill — label carries the meaning; color is decorative reinforcement. */
const StatusBadge = ({ status }: { readonly status: SubStatus }) => (
  <Badge className={cn('font-medium', STATUS_META[status].className)} variant="outline">
    {STATUS_META[status].label}
  </Badge>
);

/** Skeleton stand-in shown while the (simulated) subscriptions fetch is in flight. */
const SkeletonTable = () => (
  <div aria-busy="true" className="space-y-4">
    <span className="sr-only">Loading subscriptions…</span>
    {SKELETON_ROWS.map((row) => (
      <div aria-hidden="true" className="flex items-center gap-4" key={row}>
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

/** Full-width error state with a recovery affordance (clears the outage and reloads). */
const ErrorState = ({ onRetry }: { readonly onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
      <TriangleAlert aria-hidden="true" className="h-6 w-6" />
    </span>
    <div className="space-y-1">
      <p className="font-medium">Couldn't load subscriptions</p>
      <p className="text-muted-foreground text-sm">
        The billing service didn't respond. Your data is safe — try again.
      </p>
    </div>
    <Button onClick={onRetry} type="button" variant="outline">
      <RotateCcw aria-hidden="true" className="h-4 w-4" /> Retry
    </Button>
  </div>
);

/** The right-hand action cell for a row: a spinner while retrying, else the status-appropriate action. */
const RowActions = ({
  sub,
  pending,
  onRetry,
  onCancel,
  onReactivate,
}: {
  readonly sub: Subscription;
  readonly pending: boolean;
  readonly onRetry: (sub: Subscription) => void;
  readonly onCancel: (sub: Subscription) => void;
  readonly onReactivate: (sub: Subscription) => void;
}) => {
  if (pending) {
    return (
      <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Retrying…
      </span>
    );
  }
  if (sub.status === 'past_due') {
    return (
      <Button onClick={() => onRetry(sub)} size="sm" type="button" variant="outline">
        <RefreshCw aria-hidden="true" className="h-4 w-4" /> Retry
      </Button>
    );
  }
  if (sub.status === 'canceled') {
    return (
      <Button onClick={() => onReactivate(sub)} size="sm" type="button" variant="outline">
        <RotateCcw aria-hidden="true" className="h-4 w-4" /> Reactivate
      </Button>
    );
  }
  return (
    <Button
      className="text-muted-foreground hover:text-destructive"
      onClick={() => onCancel(sub)}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Ban aria-hidden="true" className="h-4 w-4" /> Cancel
    </Button>
  );
};

/** The subscriptions table, or an empty state when nothing matches the current search/filter. */
const SubscriptionsTable = ({
  rows,
  pendingId,
  totalCount,
  onRetry,
  onCancel,
  onReactivate,
}: {
  readonly rows: readonly Subscription[];
  readonly pendingId: string | null;
  readonly totalCount: number;
  readonly onRetry: (sub: Subscription) => void;
  readonly onCancel: (sub: Subscription) => void;
  readonly onReactivate: (sub: Subscription) => void;
}) => {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Search aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="font-medium">No matching subscriptions</p>
        <p className="text-muted-foreground text-sm">
          {totalCount === 0
            ? 'There are no subscriptions yet.'
            : 'Try a different search or status filter.'}
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="sr-only">
          Customer subscriptions and their billing status.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead>Renews</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-xs"
                  >
                    {initials(sub.customer)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{sub.customer}</p>
                    <p className="truncate text-muted-foreground text-xs">{sub.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{PLAN_LABEL[sub.plan]}</span>
                <span className="block text-muted-foreground text-xs">{sub.seats} seats</span>
              </TableCell>
              <TableCell>
                <StatusBadge status={sub.status} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {usd(sub.mrrCents)}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatDate(sub.renewsAt)}
              </TableCell>
              <TableCell className="text-right">
                <RowActions
                  onCancel={onCancel}
                  onReactivate={onReactivate}
                  onRetry={onRetry}
                  pending={pendingId === sub.id}
                  sub={sub}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
