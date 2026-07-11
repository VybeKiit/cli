import { Button } from '@vybekiit/ui/button';
import { RotateCcw, TriangleAlert } from 'lucide-react';

/** Full-width error state with a recovery affordance (clears the outage and reloads). */
export const ErrorState = ({ onRetry }: { readonly onRetry: () => void }) => (
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
