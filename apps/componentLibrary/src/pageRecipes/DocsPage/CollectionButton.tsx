import { cn } from '@/lib/utils';

export const CollectionButton = ({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) => (
  <button
    aria-pressed={active}
    className={cn(
      'w-full rounded-md px-3 py-2 text-left font-medium text-sm transition-colors',
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);
