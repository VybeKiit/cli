import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@vybekiit/ui/empty';
import { cn } from '@/lib/utils';
import type { ActivityEvent, ActivityKind } from './types';

const KIND_CHIP: Record<ActivityKind, string> = {
  signup: 'bg-blue-500/10 text-blue-600',
  order: 'bg-emerald-500/10 text-emerald-600',
  system: 'bg-violet-500/10 text-violet-600',
};

/** The activity list, or an in-context empty state when the active filter matches nothing. */
export const FeedList = ({
  events,
  labelId,
}: {
  readonly events: readonly ActivityEvent[];
  readonly labelId: string;
}) => {
  if (events.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No activity in this filter</EmptyTitle>
          <EmptyDescription>Pick another filter to see more events.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <ul aria-labelledby={labelId} className="divide-y">
      {events.map((event) => (
        <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0" key={event.id}>
          <span
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              KIND_CHIP[event.kind],
            )}
          >
            {event.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{event.title}</p>
            <p className="truncate text-muted-foreground text-xs">{event.meta}</p>
          </div>
          <span className="shrink-0 text-muted-foreground text-xs">{event.time}</span>
        </li>
      ))}
    </ul>
  );
};
