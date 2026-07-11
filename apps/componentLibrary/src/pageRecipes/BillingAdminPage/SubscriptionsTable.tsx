import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@vybekiit/ui/table';
import { Search } from 'lucide-react';
import { formatUsdCents } from '../shared/formatUsdCents';
import { PLAN_LABEL } from './constants';
import { formatDate, initials } from './formatDate';
import { RowActions } from './RowActions';
import { StatusBadge } from './StatusBadge';
import type { Subscription } from './types';

/** The subscriptions table, or an empty state when nothing matches the current search/filter. */
export const SubscriptionsTable = ({
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
            {(
              [
                { key: 'customer', label: 'Customer' },
                { key: 'plan', label: 'Plan' },
                { key: 'status', label: 'Status' },
                { key: 'mrr', label: 'MRR', className: 'text-right' },
                { key: 'renews', label: 'Renews' },
                { key: 'action', label: 'Action', className: 'text-right' },
              ] as const
            ).map(({ key, label, ...head }) => (
              <TableHead key={key} {...head}>
                {label}
              </TableHead>
            ))}
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
                {formatUsdCents(sub.mrrCents)}
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
