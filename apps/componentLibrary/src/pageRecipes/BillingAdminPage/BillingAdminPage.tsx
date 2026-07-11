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
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { Switch } from '@vybekiit/ui/switch';
import { CheckCircle2, Clock, RefreshCw, Search, TriangleAlert, Users, Wallet } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { formatUsdWholeCents } from '../shared/formatUsdCents';
import { INITIAL_SUBS, LOAD_MS, PLAN_LABEL, RETRY_MS, STATUS_FILTERS } from './constants';
import { ErrorState } from './ErrorState';
import { formatDate } from './formatDate';
import { SkeletonTable } from './SkeletonTable';
import { SubscriptionsTable } from './SubscriptionsTable';
import type { LoadState, StatusFilter, Subscription } from './types';

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
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
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
    const q = debouncedQuery.trim().toLowerCase();
    return subs.filter((sub) => {
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      const matchesQuery =
        q.length === 0 ||
        sub.customer.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [subs, debouncedQuery, statusFilter]);

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
    <DemoRecipeFrame defaultTransition="scale" title="Billing motion pass">
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
          {(
            [
              {
                key: 'mrr',
                icon: <Wallet aria-hidden="true" className="h-4 w-4" />,
                label: 'MRR',
                value: formatUsdWholeCents(kpis.mrr),
                hint: `${kpis.activeCount + kpis.pastDueCount} paying customers`,
              },
              {
                key: 'active',
                icon: <Users aria-hidden="true" className="h-4 w-4" />,
                label: 'Active',
                value: String(kpis.activeCount),
                hint: 'in good standing',
              },
              {
                key: 'past-due',
                icon: <TriangleAlert aria-hidden="true" className="h-4 w-4" />,
                label: 'Past due',
                value: String(kpis.pastDueCount),
                hint: 'need a retry',
                valueClassName: cn(kpis.pastDueCount > 0 && 'text-amber-600'),
              },
              {
                key: 'trials',
                icon: <Clock aria-hidden="true" className="h-4 w-4" />,
                label: 'Trials',
                value: String(kpis.trialingCount),
                hint: 'converting soon',
              },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
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
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — the KPIs recompute from the rows, and
            Retry/Cancel/Reactivate flip status exactly like the provider webhook will. To make it
            real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Back the table with the D1 <code>orders</code> ledger (the customer table the checkout
              webhook already writes) joined to live Lemon Squeezy subscription state from{' '}
              <code>@vybekiit/payments</code>. Serve it from an admin-guarded{' '}
              <code>GET /api/admin/subscriptions</code>.
            </li>
            <li>
              <b>Retry</b> → <code>POST /api/admin/subscriptions/:id/retry</code>. The shipped
              webhook at <code>app/api/webhook/route.ts</code> receives{' '}
              <code>subscription_payment_success</code> and updates the row — mirror that optimistic
              flip here.
            </li>
            <li>
              <b>Cancel</b> → <code>POST /api/admin/subscriptions/:id/cancel</code>{' '}
              (cancel-at-period-end); <b>Reactivate</b> resumes it. Both settle when the provider
              webhook lands.
            </li>
            <li>
              Gate the route to admins and write every action to your audit log — billing mutations
              should never be anonymous.
            </li>
          </ol>
        </DemoPlugInPanel>
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
    </DemoRecipeFrame>
  );
};
