/** Four pulsing placeholder rows shown in the feed while the dashboard is refreshing. */
export const FeedSkeleton = () => (
  <ul className="divide-y">
    {[0, 1, 2, 3].map((row) => (
      <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={row}>
        <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <span className="block h-3 w-1/2 animate-pulse rounded bg-muted" />
          <span className="block h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </li>
    ))}
  </ul>
);
