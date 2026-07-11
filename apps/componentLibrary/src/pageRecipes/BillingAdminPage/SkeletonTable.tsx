import { Skeleton } from '@vybekiit/ui/skeleton';
import { SKELETON_ROWS } from './constants';

/** Skeleton stand-in shown while the (simulated) subscriptions fetch is in flight. */
export const SkeletonTable = () => (
  <div aria-busy="true" className="space-y-4">
    <span className="sr-only">Loading subscriptions…</span>
    {SKELETON_ROWS.map((row) => (
      <div aria-hidden="true" className="flex items-center gap-4" key={row}>
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);
