import { Badge } from '@vybekiit/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionItem, Priority } from './types';

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'border-red-500/40 text-red-600',
  medium: 'border-amber-500/40 text-amber-600',
  low: 'text-muted-foreground',
};

/** One attention item in the action rail; the check button clears it and updates the live count. */
export const ActionRow = ({
  item,
  onDismiss,
}: {
  readonly item: ActionItem;
  readonly onDismiss: () => void;
}) => (
  <li className="flex items-start gap-3 rounded-lg border p-3">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      {item.icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="font-medium text-sm">{item.title}</p>
        <Badge
          className={cn('text-xs capitalize', PRIORITY_BADGE[item.priority])}
          variant="outline"
        >
          {item.priority}
        </Badge>
      </div>
      <p className="mt-0.5 text-muted-foreground text-xs">{item.detail}</p>
    </div>
    <button
      aria-label={`Mark "${item.title}" done`}
      className="text-muted-foreground transition-colors hover:text-emerald-600"
      onClick={onDismiss}
      type="button"
    >
      <CheckCircle2 className="h-4 w-4" />
    </button>
  </li>
);
