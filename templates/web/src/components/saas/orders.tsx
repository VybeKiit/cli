'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Download, Eye, Receipt } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IntegrationTodo } from '@/components/saas/integrationTodo';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';

type OrderStatus = 'paid' | 'fulfilled' | 'refunded' | 'pending';

type OrderRow = {
  readonly id: string;
  readonly customer: string;
  readonly product: string;
  readonly amount: string;
  readonly status: OrderStatus;
  readonly date: string;
};

const ORDERS: readonly OrderRow[] = [
  {
    id: 'VK-1048',
    customer: 'alice@example.com',
    product: 'Starter kit license',
    amount: '$49.00',
    status: 'paid',
    date: '2026-07-08',
  },
  {
    id: 'VK-1047',
    customer: 'bob@example.com',
    product: 'Design audit',
    amount: '$299.00',
    status: 'pending',
    date: '2026-07-07',
  },
  {
    id: 'VK-1046',
    customer: 'carol@example.com',
    product: 'Template bundle',
    amount: '$129.00',
    status: 'fulfilled',
    date: '2026-07-06',
  },
  {
    id: 'VK-1045',
    customer: 'dave@example.com',
    product: 'Starter kit license',
    amount: '$49.00',
    status: 'refunded',
    date: '2026-07-04',
  },
];

const STATUS_FILTERS: readonly { readonly id: 'all' | OrderStatus; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'fulfilled', label: 'Fulfilled' },
  { id: 'refunded', label: 'Refunded' },
];

const statusClass: Record<OrderStatus, string> = {
  paid: 'border-emerald-500/40 text-emerald-700',
  pending: 'border-amber-500/40 text-amber-700',
  fulfilled: 'border-blue-500/40 text-blue-700',
  refunded: 'border-red-500/40 text-red-700',
};

/**
 * Orders list with search, status filters, and a detail drawer-style panel.
 *
 * @returns The orders dashboard page.
 * @example
 * <OrdersPage />
 */
export const OrdersPage = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>('VK-1048');

  const rows = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return ORDERS.filter((order) => {
      if (status !== 'all' && order.status !== status) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      return (
        order.id.toLowerCase().includes(needle) ||
        order.customer.toLowerCase().includes(needle) ||
        order.product.toLowerCase().includes(needle)
      );
    });
  }, [debouncedQuery, status]);

  const selected = rows.find((order) => order.id === selectedId) ?? rows[0] ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Search purchases, filter by status, and inspect fulfillment details.
          </p>
        </div>
        <Button type="button" variant="outline">
          <Download aria-hidden="true" className="h-4 w-4" /> Export CSV
        </Button>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          className="max-w-md"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search order, customer, or product"
          value={query}
        />
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              onClick={() => setStatus(filter.id)}
              size="sm"
              type="button"
              variant={status === filter.id ? 'default' : 'outline'}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt aria-hidden="true" className="h-5 w-5" /> Order history
            </CardTitle>
            <CardDescription>
              {rows.length} result{rows.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders match this filter.</p>
            ) : (
              rows.map((order) => (
                <button
                  className={cn(
                    'grid w-full gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 sm:grid-cols-[7rem_minmax(0,1fr)_auto]',
                    selected?.id === order.id && 'border-primary bg-muted/30',
                  )}
                  key={order.id}
                  onClick={() => setSelectedId(order.id)}
                  type="button"
                >
                  <span className="font-medium text-sm">{order.id}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{order.product}</span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {order.customer}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 sm:justify-end">
                    <span className="font-medium text-sm">{order.amount}</span>
                    <Badge className={statusClass[order.status]} variant="outline">
                      {order.status}
                    </Badge>
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye aria-hidden="true" className="h-4 w-4" /> Details
            </CardTitle>
            <CardDescription>Selected order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {selected === null ? (
              <p className="text-muted-foreground">Select an order to inspect it.</p>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground text-xs">Order</p>
                  <p className="font-medium">{selected.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Customer</p>
                  <p className="font-medium">{selected.customer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Product</p>
                  <p className="font-medium">{selected.product}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs">Amount</p>
                    <p className="font-medium">{selected.amount}</p>
                  </div>
                  <Badge className={statusClass[selected.status]} variant="outline">
                    {selected.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium">{selected.date}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" type="button" variant="outline">
                    Download invoice
                  </Button>
                  <Button size="sm" type="button" variant="ghost">
                    Mark fulfilled
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <IntegrationTodo
        feature="orders"
        todos={[
          'Load rows from the orders preset / payments webhook log (skill: setup-payments).',
          'Wire invoice download and refund actions to the payments provider.',
          'Replace practice ORDERS with GET /api/orders.',
        ]}
      />
    </div>
  );
};
