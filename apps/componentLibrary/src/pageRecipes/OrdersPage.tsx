'use client';

import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Separator } from '@vybekiit/ui/separator';
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Download,
  Loader2,
  Package,
  Receipt,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

/** Fulfillment / payment status for an order. */
type OrderStatus = 'paid' | 'shipped' | 'refunded';

/** Filter chip including "all". */
type StatusFilter = 'all' | OrderStatus;

/** One line inside an order. Prices in integer cents. */
type OrderLine = {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
};

/** One historical order. */
type Order = {
  readonly id: string;
  readonly orderNumber: string;
  readonly email: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
  readonly totalCents: number;
  readonly tracking?: string;
  readonly lines: readonly OrderLine[];
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid',
  shipped: 'Shipped',
  refunded: 'Refunded',
};

const FILTER_LABEL: Record<StatusFilter, string> = {
  all: 'All',
  paid: 'Paid',
  shipped: 'Shipped',
  refunded: 'Refunded',
};

/** Realistic multi-order history for the demo. */
const ORDERS: readonly Order[] = [
  {
    id: 'o1',
    orderNumber: 'VK-4821',
    email: 'you@example.com',
    status: 'paid',
    createdAt: '2026-07-02',
    totalCents: 24_832,
    lines: [
      { name: 'VybeKiit Starter Kit', quantity: 1, unitPrice: 19_900 },
      { name: 'Brand Icon Pack', quantity: 1, unitPrice: 2900 },
    ],
  },
  {
    id: 'o2',
    orderNumber: 'VK-4790',
    email: 'you@example.com',
    status: 'shipped',
    createdAt: '2026-06-18',
    totalCents: 14_200,
    tracking: '1Z999AA10123456784',
    lines: [
      { name: 'Founder Hoodie', quantity: 1, unitPrice: 6500 },
      { name: 'Studio Desk Mat', quantity: 1, unitPrice: 4200 },
    ],
  },
  {
    id: 'o3',
    orderNumber: 'VK-4712',
    email: 'you@example.com',
    status: 'refunded',
    createdAt: '2026-05-29',
    totalCents: 14_900,
    lines: [{ name: 'Priority Onboarding Call', quantity: 1, unitPrice: 14_900 }],
  },
  {
    id: 'o4',
    orderNumber: 'VK-4688',
    email: 'you@example.com',
    status: 'shipped',
    createdAt: '2026-05-12',
    totalCents: 5420,
    tracking: '9400111899223344556677',
    lines: [{ name: 'Build Log Stickers', quantity: 2, unitPrice: 1200 }],
  },
  {
    id: 'o5',
    orderNumber: 'VK-4601',
    email: 'you@example.com',
    status: 'paid',
    createdAt: '2026-04-30',
    totalCents: 49_900,
    lines: [{ name: 'Agency Client Pack', quantity: 1, unitPrice: 49_900 }],
  },
];

const usd = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const statusVariant = (
  status: OrderStatus,
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (status === 'refunded') {
    return 'destructive';
  }
  if (status === 'shipped') {
    return 'secondary';
  }
  return 'default';
};

type LoadStatus = 'ready' | 'loading' | 'error';

/**
 * A production-shaped orders history page: status filters, selectable detail panel, live empty
 * state when a filter yields nothing, and invoice / reorder affordances. Local React state only;
 * see the integration panel for real wiring via apply-preset orders and the payment webhook.
 *
 * @returns The orders recipe element.
 * @example
 * const element = <OrdersPage />;
 */
export const OrdersPage = () => {
  const listLabelId = useId();
  const detailHeadingId = useId();

  const [status, setStatus] = useState<LoadStatus>('ready');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string>(ORDERS[0]?.id ?? '');
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceNote, setInvoiceNote] = useState<string | null>(null);
  const [reorderNote, setReorderNote] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return ORDERS;
    }
    return ORDERS.filter((order) => order.status === filter);
  }, [filter]);

  const selected = useMemo(() => {
    const inList = filtered.find((order) => order.id === selectedId);
    return inList ?? filtered[0] ?? null;
  }, [filtered, selectedId]);

  const reload = () => {
    setStatus('loading');
    setInvoiceNote(null);
    setReorderNote(null);
    globalThis.setTimeout(() => {
      setFilter('all');
      setSelectedId(ORDERS[0]?.id ?? '');
      setStatus('ready');
    }, 900);
  };

  const downloadInvoice = () => {
    if (selected === null) {
      return;
    }
    setInvoiceBusy(true);
    setInvoiceNote(null);
    globalThis.setTimeout(() => {
      setInvoiceBusy(false);
      setInvoiceNote(`Invoice ${selected.orderNumber}.pdf ready (demo)`);
    }, 700);
  };

  const reorder = () => {
    if (selected === null) {
      return;
    }
    setReorderNote(`${selected.lines.length} line(s) from ${selected.orderNumber} queued for cart`);
    globalThis.setTimeout(() => setReorderNote(null), 2800);
  };

  // ---------- loading ----------
  if (status === 'loading') {
    return (
      <Frame>
        <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-muted-foreground" />
          <h1 className="mt-6 font-bold text-2xl tracking-tight">Loading orders…</h1>
          <p className="mt-2 text-muted-foreground text-sm">Fetching history and fulfillment.</p>
        </section>
      </Frame>
    );
  }

  // ---------- error ----------
  if (status === 'error') {
    return (
      <Frame>
        <section className="mx-auto max-w-md px-4 py-24">
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" className="h-4 w-4" />
            <AlertTitle>Orders could not load</AlertTitle>
            <AlertDescription>
              Order history failed to load. Retry once the orders API is reachable.
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex justify-center">
            <Button onClick={reload} type="button">
              <RefreshCw aria-hidden="true" className="h-4 w-4" /> Retry
            </Button>
          </div>
        </section>
      </Frame>
    );
  }

  // ---------- ready ----------
  return (
    <Frame>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit" variant="secondary">
              Orders
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Order history</h1>
            <p className="max-w-xl text-muted-foreground">
              Filter by status and select a row for details. Pick a filter with no matches to see
              the empty state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reload} type="button" variant="outline">
              <RefreshCw aria-hidden="true" className="h-4 w-4" /> Reload
            </Button>
            <Button onClick={() => setStatus('error')} type="button" variant="ghost">
              Simulate error
            </Button>
          </div>
        </div>

        <div
          aria-label="Filter orders by status"
          className="mb-6 flex flex-wrap gap-2"
          role="group"
        >
          {(Object.keys(FILTER_LABEL) as StatusFilter[]).map((key) => {
            const count =
              key === 'all' ? ORDERS.length : ORDERS.filter((order) => order.status === key).length;
            return (
              <Button
                aria-pressed={filter === key}
                key={key}
                onClick={() => {
                  setFilter(key);
                  setInvoiceNote(null);
                  setReorderNote(null);
                }}
                size="sm"
                type="button"
                variant={filter === key ? 'default' : 'outline'}
              >
                {FILTER_LABEL[key]}
                <Badge className="ml-1" variant="secondary">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <section className="flex flex-col items-center rounded-lg border border-dashed px-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package aria-hidden="true" className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-semibold text-lg">No orders in this filter</h2>
            <p className="mt-1 max-w-sm text-muted-foreground text-sm">
              Nothing matches <span className="font-medium">{FILTER_LABEL[filter]}</span>. Try
              another status or clear the filter.
            </p>
            <Button
              className="mt-4"
              onClick={() => setFilter('all')}
              type="button"
              variant="outline"
            >
              Show all orders
            </Button>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base" id={listLabelId}>
                  {filtered.length} {filtered.length === 1 ? 'order' : 'orders'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul aria-labelledby={listLabelId} className="divide-y">
                  {filtered.map((order) => {
                    const isSelected = selected?.id === order.id;
                    return (
                      <li key={order.id}>
                        <button
                          aria-current={isSelected ? 'true' : undefined}
                          className={cn(
                            'flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/40',
                            isSelected && 'bg-primary/5',
                          )}
                          onClick={() => {
                            setSelectedId(order.id);
                            setInvoiceNote(null);
                            setReorderNote(null);
                          }}
                          type="button"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <Receipt aria-hidden="true" className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-sm">{order.orderNumber}</span>
                              <Badge className="text-[10px]" variant={statusVariant(order.status)}>
                                {STATUS_LABEL[order.status]}
                              </Badge>
                            </span>
                            <span className="mt-0.5 block text-muted-foreground text-xs">
                              {order.createdAt} · {order.lines.length}{' '}
                              {order.lines.length === 1 ? 'item' : 'items'}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-sm tabular-nums">
                              {usd(order.totalCents)}
                            </span>
                            <ChevronRight
                              aria-hidden="true"
                              className={cn(
                                'h-4 w-4 text-muted-foreground',
                                isSelected && 'text-primary',
                              )}
                            />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            {selected ? (
              <Card className="lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle className="text-base" id={detailHeadingId}>
                    Order {selected.orderNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(selected.status)}>
                      {STATUS_LABEL[selected.status]}
                    </Badge>
                    <span className="text-muted-foreground text-sm">{selected.createdAt}</span>
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="truncate font-medium">{selected.email}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Total</dt>
                      <dd className="font-semibold tabular-nums">{usd(selected.totalCents)}</dd>
                    </div>
                    {selected.tracking ? (
                      <div className="flex justify-between gap-2">
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Truck aria-hidden="true" className="h-3.5 w-3.5" /> Tracking
                        </dt>
                        <dd className="font-mono text-xs">{selected.tracking}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <Separator />

                  <ul className="space-y-2">
                    {selected.lines.map((line) => (
                      <li
                        className="flex items-start justify-between gap-2 text-sm"
                        key={`${selected.id}-${line.name}`}
                      >
                        <span>
                          <span className="font-medium">{line.name}</span>
                          <span className="block text-muted-foreground text-xs">
                            Qty {line.quantity} · {usd(line.unitPrice)} each
                          </span>
                        </span>
                        <span className="tabular-nums">{usd(line.unitPrice * line.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Button
                      aria-busy={invoiceBusy}
                      disabled={invoiceBusy || selected.status === 'refunded'}
                      onClick={downloadInvoice}
                      type="button"
                      variant="outline"
                    >
                      {invoiceBusy ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download aria-hidden="true" className="h-4 w-4" />
                      )}
                      Download invoice
                    </Button>
                    <Button
                      disabled={selected.status === 'refunded'}
                      onClick={reorder}
                      type="button"
                    >
                      <RefreshCw aria-hidden="true" className="h-4 w-4" /> Reorder items
                    </Button>
                  </div>

                  {invoiceNote ? (
                    <p className="flex items-center gap-2 text-emerald-700 text-sm" role="status">
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                      {invoiceNote}
                    </p>
                  ) : null}
                  {reorderNote ? (
                    <p className="flex items-center gap-2 text-sm" role="status">
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-emerald-600"
                      />
                      {reorderNote}
                    </p>
                  ) : null}
                  {selected.status === 'refunded' ? (
                    <p className="text-muted-foreground text-xs">
                      Refunded orders cannot be reordered or invoiced from this panel.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              This recipe is fully interactive with local React state — no backend needed to demo
              it. To show real order history:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset orders</code>. Rows are written by the payment
                webhook at <code>app/api/webhook/route.ts</code> on successful checkout (and refund
                events).
              </li>
              <li>
                List with <code>GET /api/orders</code> →{' '}
                <code>{'{ orders: [{ order_id, email, refunded, created_at, … }] }'}</code>. Map{' '}
                <code>refunded</code> to status; derive shipped from fulfillment metadata if you
                store tracking.
              </li>
              <li>
                Invoice: generate a PDF / receipt URL from the order id. Reorder: re-insert the
                original line items into the open cart after <code>apply-preset cart</code>.
              </li>
              <li>
                Keep this route auth-gated — the orders preset is service-role for webhooks; expose
                only the signed-in buyer's rows via your API.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Wrap a recipe view in the gallery's theme + motion controls. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="fade" title="Orders motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

// TODO: Load order history from GET /api/orders after apply-preset orders (filled by webhook).
// TODO: Wire invoice download and reorder actions to orders + cart endpoints.
