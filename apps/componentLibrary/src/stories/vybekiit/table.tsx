'use client';

import type { ComponentStateId } from '@library/lib/componentStates';
import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@vybekiit/ui/empty';
import { Skeleton } from '@vybekiit/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vybekiit/ui/table';

interface InvoiceRow {
  readonly id: string;
  readonly customer: string;
  readonly status: string;
  readonly amount: string;
}

const ROWS: readonly InvoiceRow[] = [
  { id: 'INV-1001', customer: 'Northwind Traders', status: 'Paid', amount: '$1,240.00' },
  { id: 'INV-1002', customer: 'Contoso Ltd', status: 'Pending', amount: '$860.00' },
  { id: 'INV-1003', customer: 'Fabrikam Inc', status: 'Overdue', amount: '$3,120.00' },
];

const SKELETON_ROWS: readonly string[] = ['a', 'b', 'c'];
const SKELETON_CELLS: readonly string[] = ['id', 'customer', 'status', 'amount'];

/** The real Table primitive rendering data, loading, or empty states. */
const InvoiceTable = ({ state }: { readonly state: ComponentStateId }) => (
  <div className="w-full">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {state === 'loading'
          ? SKELETON_ROWS.map((row) => (
              <TableRow key={row}>
                {SKELETON_CELLS.map((cell) => (
                  <TableCell key={cell}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}
        {state === 'empty' ? (
          <TableRow>
            <TableCell colSpan={4}>
              <Empty variant="compact">
                <EmptyHeader>
                  <EmptyTitle>No invoices</EmptyTitle>
                  <EmptyDescription>Invoices you create will appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>
        ) : null}
        {state !== 'loading' && state !== 'empty'
          ? ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="text-right">{row.amount}</TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </Table>
  </div>
);

const ORDER: readonly ComponentStateId[] = ['default', 'loading', 'empty'];

/** Data, loading, and empty Table states, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full space-y-6">
      {ORDER.map((state) => (
        <div className="space-y-2" key={state}>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {state}
          </p>
          <InvoiceTable state={state} />
        </div>
      ))}
    </div>
  ),
};

export default story;
