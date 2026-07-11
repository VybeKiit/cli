import { Button } from '@vybekiit/ui/button';
import { Search } from 'lucide-react';

/** Empty state when search/status filters match nothing. */
export const EmptyFilterState = ({ onClear }: { readonly onClear: () => void }) => (
  <div className="flex flex-col items-center px-4 py-16 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Search aria-hidden="true" className="h-6 w-6" />
    </span>
    <h2 className="mt-4 font-semibold text-lg">No customers match</h2>
    <p className="mt-1 max-w-sm text-muted-foreground text-sm">
      Try a different name, company, or clear the status filter.
    </p>
    <Button className="mt-4" onClick={onClear} type="button" variant="outline">
      Clear filters
    </Button>
  </div>
);
