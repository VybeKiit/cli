import { Button } from '@vybekiit/ui/button';
import { Ban, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import type { Subscription } from './types';

/** The right-hand action cell for a row: a spinner while retrying, else the status-appropriate action. */
export const RowActions = ({
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
