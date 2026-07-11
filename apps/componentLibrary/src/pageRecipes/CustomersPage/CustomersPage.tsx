'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { Skeleton } from '@vybekiit/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vybekiit/ui/table';
import { Building2, Loader2, RefreshCw, Search, UserRound, Users, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { formatUsdWholeCents } from '../shared/formatUsdCents';
import { EmptyFilterState } from './EmptyFilterState';

type CustomerStatus = 'active' | 'trial' | 'churned' | 'at_risk';
type StatusFilter = 'all' | CustomerStatus;
type LoadState = 'loading' | 'ready' | 'error';

/** One CRM customer row. Mirrors the customers preset shape (name, company, status, owner). */
type Customer = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly company: string;
  readonly status: CustomerStatus;
  readonly owner: string;
  readonly plan: string;
  readonly mrrCents: number;
  readonly lastActive: string;
};

const STATUS_META: Record<CustomerStatus, { readonly label: string; readonly className: string }> =
  {
    active: {
      label: 'Active',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
    },
    trial: {
      label: 'Trial',
      className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
    },
    at_risk: {
      label: 'At risk',
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
    },
    churned: {
      label: 'Churned',
      className: 'border-border bg-muted text-muted-foreground',
    },
  };

const STATUS_FILTERS: readonly { readonly value: StatusFilter; readonly label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'churned', label: 'Churned' },
];

/** Realistic multi-row CRM seed — varied status, plan, and owner. */
const INITIAL_CUSTOMERS: readonly Customer[] = [
  {
    id: 'cus_01',
    name: 'Aria Montgomery',
    email: 'aria@northwind.io',
    company: 'Northwind Labs',
    status: 'active',
    owner: 'Maya Chen',
    plan: 'Scale',
    mrrCents: 24_900,
    lastActive: '2h ago',
  },
  {
    id: 'cus_02',
    name: 'Priya Nair',
    email: 'priya@orbit.app',
    company: 'Orbit Health',
    status: 'trial',
    owner: 'Sam Ortiz',
    plan: 'Growth',
    mrrCents: 0,
    lastActive: '1d ago',
  },
  {
    id: 'cus_03',
    name: 'Jonas Weber',
    email: 'jonas@lumen.de',
    company: 'Lumen GmbH',
    status: 'active',
    owner: 'Maya Chen',
    plan: 'Pro',
    mrrCents: 9900,
    lastActive: '4h ago',
  },
  {
    id: 'cus_04',
    name: 'Sofia Rossi',
    email: 'sofia@canvas.it',
    company: 'Canvas Studio',
    status: 'at_risk',
    owner: 'Lee Park',
    plan: 'Pro',
    mrrCents: 9900,
    lastActive: '12d ago',
  },
  {
    id: 'cus_05',
    name: 'Noah Brooks',
    email: 'noah@fieldkit.co',
    company: 'Fieldkit',
    status: 'churned',
    owner: 'Sam Ortiz',
    plan: 'Starter',
    mrrCents: 0,
    lastActive: '45d ago',
  },
  {
    id: 'cus_06',
    name: 'Amelia Cole',
    email: 'amelia@harbor.io',
    company: 'Harbor Freight SaaS',
    status: 'active',
    owner: 'Lee Park',
    plan: 'Growth',
    mrrCents: 14_900,
    lastActive: '30m ago',
  },
  {
    id: 'cus_07',
    name: 'Kenji Sato',
    email: 'kenji@pixel.jp',
    company: 'Pixel Forge',
    status: 'trial',
    owner: 'Maya Chen',
    plan: 'Starter',
    mrrCents: 0,
    lastActive: '3d ago',
  },
  {
    id: 'cus_08',
    name: 'Elena Vargas',
    email: 'elena@summit.mx',
    company: 'Summit Retail',
    status: 'active',
    owner: 'Sam Ortiz',
    plan: 'Scale',
    mrrCents: 49_900,
    lastActive: '1h ago',
  },
];

const LOAD_MS = 700;

const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

/**
 * A production-shaped CRM customers index: multi-row table with live search and status filter,
 * row selection, loading skeleton, and a real empty state when filters match nothing. Fully
 * interactive with local state — see the plug-in panel for the customers preset wiring.
 *
 * @returns The customers recipe element.
 * @example
 * const element = <CustomersPage />;
 */
export const CustomersPage = () => {
  // TODO: Load customer records from the customers preset tables via GET /api/customers.
  // TODO: Persist customer status and selection actions through CRM mutations.
  const searchId = useId();
  const filterId = useId();
  const tableCaptionId = useId();

  const [customers] = useState<readonly Customer[]>(INITIAL_CUSTOMERS);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const runLoad = () => {
    setLoadState('loading');
    globalThis.setTimeout(() => setLoadState('ready'), LOAD_MS);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: simulate the initial fetch once on mount.
  useEffect(() => {
    runLoad();
  }, []);

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      const matchesQuery =
        q.length === 0 ||
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.company.toLowerCase().includes(q) ||
        customer.owner.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [customers, debouncedQuery, statusFilter]);

  const selected = customers.find((customer) => customer.id === selectedId) ?? null;

  const kpis = useMemo(() => {
    const active = customers.filter((c) => c.status === 'active').length;
    const trial = customers.filter((c) => c.status === 'trial').length;
    const atRisk = customers.filter((c) => c.status === 'at_risk').length;
    const mrr = customers
      .filter((c) => c.status === 'active' || c.status === 'at_risk')
      .reduce((sum, c) => sum + c.mrrCents, 0);
    return { active, trial, atRisk, mrr, total: customers.length };
  }, [customers]);

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  let tableBody: ReactNode;
  if (loadState === 'loading') {
    tableBody = (
      <div className="space-y-3" role="status">
        <span className="sr-only">Loading customers</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={`sk-${String(index)}`} />
        ))}
      </div>
    );
  } else if (visible.length === 0) {
    tableBody = <EmptyFilterState onClear={clearFilters} />;
  } else {
    tableBody = (
      <div className="overflow-x-auto">
        <Table aria-labelledby={tableCaptionId}>
          <TableHeader>
            <TableRow>
              {(
                [
                  { key: 'customer', label: 'Customer' },
                  { key: 'company', label: 'Company', className: 'hidden md:table-cell' },
                  { key: 'status', label: 'Status' },
                  { key: 'owner', label: 'Owner', className: 'hidden lg:table-cell' },
                  { key: 'plan', label: 'Plan', className: 'hidden sm:table-cell' },
                  { key: 'mrr', label: 'MRR', className: 'text-right' },
                ] as const
              ).map(({ key, label, ...head }) => (
                <TableHead key={key} {...head}>
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((customer) => {
              const isSelected = selectedId === customer.id;
              return (
                <TableRow
                  aria-selected={isSelected}
                  className={cn('cursor-pointer', isSelected && 'bg-primary/5 hover:bg-primary/10')}
                  key={customer.id}
                  onClick={() =>
                    setSelectedId((current) => (current === customer.id ? null : customer.id))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId((current) => (current === customer.id ? null : customer.id));
                    }
                  }}
                  tabIndex={0}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-xs"
                      >
                        {initials(customer.name)}
                      </span>
                      <span>
                        <span className="block font-medium">{customer.name}</span>
                        <span className="block text-muted-foreground text-xs">
                          {customer.email}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{customer.company}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn('font-normal', STATUS_META[customer.status].className)}
                      variant="outline"
                    >
                      {STATUS_META[customer.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{customer.owner}</TableCell>
                  <TableCell className="hidden sm:table-cell">{customer.plan}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {customer.mrrCents === 0 ? '—' : formatUsdWholeCents(customer.mrrCents)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Customers motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              CRM
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Customers</h1>
            <p className="max-w-xl text-muted-foreground">
              Search and filter your accounts. Select a row to pin the profile strip — try a
              nonsense query to reach the empty state.
            </p>
          </div>
          <Button
            disabled={loadState === 'loading'}
            onClick={runLoad}
            type="button"
            variant="outline"
          >
            {loadState === 'loading' ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        <section
          aria-label="Customer metrics"
          className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {(
            [
              {
                key: 'total',
                icon: <Users aria-hidden="true" className="h-4 w-4" />,
                label: 'Total',
                value: String(kpis.total),
              },
              {
                key: 'active',
                icon: <UserRound aria-hidden="true" className="h-4 w-4" />,
                label: 'Active',
                value: String(kpis.active),
              },
              {
                key: 'at-risk',
                icon: <Building2 aria-hidden="true" className="h-4 w-4" />,
                label: 'At risk',
                value: String(kpis.atRisk),
                valueClassName: kpis.atRisk > 0 ? 'text-amber-600' : undefined,
              },
              {
                key: 'paying-mrr',
                icon: <Users aria-hidden="true" className="h-4 w-4" />,
                label: 'Paying MRR',
                value: formatUsdWholeCents(kpis.mrr),
              },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </section>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base" id={tableCaptionId}>
                Directory
              </CardTitle>
              <p aria-live="polite" className="text-muted-foreground text-sm">
                {loadState === 'ready'
                  ? `Showing ${visible.length} of ${customers.length}`
                  : 'Loading customers…'}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
              <div className="space-y-1.5 sm:w-64">
                <Label htmlFor={searchId}>Search</Label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    className="pl-9"
                    id={searchId}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, email, company…"
                    type="search"
                    value={query}
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:w-44">
                <Label htmlFor={filterId}>Status</Label>
                <Select
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  value={statusFilter}
                >
                  <SelectTrigger id={filterId}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>{tableBody}</CardContent>
        </Card>

        {selected ? (
          <Card className="mt-4 border-primary/30">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm"
                >
                  {initials(selected.name)}
                </span>
                <div>
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {selected.company} · Last active {selected.lastActive} · Owner {selected.owner}
                  </p>
                </div>
              </div>
              <Button onClick={() => setSelectedId(null)} size="sm" type="button" variant="ghost">
                <X aria-hidden="true" className="h-4 w-4" /> Clear selection
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — search and status filters recompute the table, and
            selecting a row pins the profile strip. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset customers</code> to create the <code>customers</code>{' '}
              and <code>customer_notes</code> tables.
            </li>
            <li>
              Add <code>GET /api/customers?status=&amp;q=</code> that reads those tables via{' '}
              <code>@vybekiit/db</code> and returns{' '}
              <code>{'{ id, name, email, company, status, owner, plan, mrrCents }'}</code>.
            </li>
            <li>
              Swap <code>INITIAL_CUSTOMERS</code> for that response in <code>runLoad</code>; keep
              the loading skeleton and empty filter state as-is.
            </li>
            <li>
              Wire row open to <code>/customers/[id]</code> (the customer detail recipe) and persist
              status changes with <code>PATCH /api/customers/:id</code>.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
