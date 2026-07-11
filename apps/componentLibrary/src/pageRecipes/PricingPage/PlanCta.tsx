import { Button } from '@vybekiit/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

/** The per-plan call to action: checkout handoff when available, Contact sales past the seat cap. */
export const PlanCta = ({
  available,
  featured,
  loading,
  maxSeats,
  onStart,
}: {
  readonly available: boolean;
  readonly featured: boolean;
  readonly loading: boolean;
  readonly maxSeats: number;
  readonly onStart: () => void;
}) => {
  if (!available) {
    return (
      <div className="space-y-2">
        <Button className="w-full" disabled={true} type="button" variant="outline">
          Contact sales
        </Button>
        <p className="text-center text-muted-foreground text-xs">
          Up to {maxSeats} seat{maxSeats === 1 ? '' : 's'} on this plan.
        </p>
      </div>
    );
  }
  return (
    <Button
      aria-busy={loading}
      className="w-full"
      disabled={loading}
      onClick={onStart}
      type="button"
      variant={featured ? 'default' : 'outline'}
    >
      {loading ? (
        <>
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Redirecting…
        </>
      ) : (
        <>
          <CreditCard aria-hidden="true" className="h-4 w-4" /> Start checkout
        </>
      )}
    </Button>
  );
};
