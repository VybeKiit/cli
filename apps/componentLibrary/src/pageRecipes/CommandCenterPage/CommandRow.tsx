import { Button } from '@vybekiit/ui/button';
import { IconBox } from '@vybekiit/ui/icon-box';
import { Flag, Loader2, Pin, UserPlus, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GROUP_LABEL } from './constants';
import type { CommandItem } from './types';

/** One command row with run + pin. */
export const CommandRow = ({
  cmd,
  onRun,
  onPin,
  running,
  selected,
}: {
  readonly cmd: CommandItem;
  readonly onRun: () => void;
  readonly onPin: () => void;
  readonly running: boolean;
  readonly selected: boolean;
}) => {
  let icon: ReactNode = <Zap aria-hidden="true" className="h-4 w-4" />;
  if (cmd.group === 'create') {
    icon = <UserPlus aria-hidden="true" className="h-4 w-4" />;
  } else if (cmd.group === 'ops') {
    icon = <Flag aria-hidden="true" className="h-4 w-4" />;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-2',
        selected && 'bg-primary/5',
        'hover:bg-muted/60',
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        disabled={running}
        onClick={onRun}
        type="button"
      >
        <IconBox size="sm">
          {running ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : icon}
        </IconBox>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-sm">{cmd.label}</span>
          <span className="block text-muted-foreground text-xs">{GROUP_LABEL[cmd.group]}</span>
        </span>
        {cmd.shortcut ? (
          <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
            {cmd.shortcut}
          </kbd>
        ) : null}
      </button>
      <Button
        aria-label={cmd.pinned ? `Unpin ${cmd.label}` : `Pin ${cmd.label}`}
        aria-pressed={Boolean(cmd.pinned)}
        onClick={onPin}
        size="icon"
        type="button"
        variant="ghost"
        className="h-8 w-8 shrink-0"
      >
        <Pin
          aria-hidden="true"
          className={cn(
            'h-4 w-4',
            cmd.pinned ? 'fill-current text-primary' : 'text-muted-foreground',
          )}
        />
      </Button>
    </div>
  );
};
