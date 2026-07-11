import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEPS, stepStatus } from './steps';

/** The horizontal step tracker: a filled check for done steps, a ring for the current one. */
export const Stepper = ({ current }: { readonly current: number }) => (
  <ol className="flex items-center gap-2">
    {STEPS.map((entry, index) => {
      const state = stepStatus(entry.id, current);
      return (
        <li className="flex flex-1 items-center gap-2" key={entry.id}>
          <span
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-medium text-sm',
              state === 'done' && 'border-emerald-600 bg-emerald-600 text-white',
              state === 'current' && 'border-primary text-primary ring-2 ring-primary/20',
              state === 'todo' && 'border-muted-foreground/30 text-muted-foreground',
            )}
          >
            {state === 'done' ? <Check aria-hidden="true" className="h-4 w-4" /> : entry.id}
          </span>
          <span
            className={cn(
              'hidden font-medium text-sm sm:inline',
              state === 'todo' && 'text-muted-foreground',
            )}
          >
            {entry.title}
          </span>
          {index < STEPS.length - 1 ? (
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          ) : null}
        </li>
      );
    })}
  </ol>
);
