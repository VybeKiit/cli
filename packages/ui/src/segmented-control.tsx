'use client';

import * as React from 'react';

import { cn } from './utils';

type SegmentedControlContextValue = {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly size: 'default' | 'sm';
};

const SegmentedControlContext = React.createContext<SegmentedControlContextValue | null>(null);

const useSegmentedControl = (): SegmentedControlContextValue => {
  const context = React.useContext(SegmentedControlContext);
  if (context === null) {
    throw new Error('SegmentedControlItem must be used within SegmentedControl');
  }
  return context;
};

export interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Currently selected option value. */
  readonly value: string;
  /** Called when the user picks an option. */
  readonly onValueChange: (value: string) => void;
  /** `sm` tightens padding for dense filter bars. */
  readonly size?: 'default' | 'sm';
}

/**
 * Muted pill track for exclusive options (date range, channel, env filter).
 *
 * Prefer this over hand-rolled `rounded-lg border bg-muted p-1` + chip buttons.
 *
 * @param props - Controlled value, change handler, optional size, and items.
 * @returns The segmented control root.
 * @example
 * <SegmentedControl value={range} onValueChange={setRange}>
 *   <SegmentedControlItem value="7d">7d</SegmentedControlItem>
 *   <SegmentedControlItem value="30d">30d</SegmentedControlItem>
 * </SegmentedControl>
 */
const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ className, value, onValueChange, size = 'default', children, ...props }, ref) => (
    <SegmentedControlContext.Provider value={{ value, onValueChange, size }}>
      <div
        ref={ref}
        className={cn('inline-flex flex-wrap gap-1 rounded-lg border bg-muted p-1', className)}
        data-slot="segmented-control"
        role="group"
        {...props}
      >
        {children}
      </div>
    </SegmentedControlContext.Provider>
  ),
);
SegmentedControl.displayName = 'SegmentedControl';

export interface SegmentedControlItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'type'> {
  /** Option value matched against the parent `value`. */
  readonly value: string;
}

/**
 * One option inside a {@link SegmentedControl}.
 *
 * @param props - Option value and label children.
 * @returns A pressed-state toggle button.
 * @example
 * <SegmentedControlItem value="all">All</SegmentedControlItem>
 */
const SegmentedControlItem = React.forwardRef<HTMLButtonElement, SegmentedControlItemProps>(
  ({ className, value, children, disabled, onClick, ...props }, ref) => {
    const context = useSegmentedControl();
    const active = context.value === value;

    return (
      <button
        ref={ref}
        aria-pressed={active}
        className={cn(
          'rounded-md font-medium transition-colors',
          context.size === 'sm'
            ? 'px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm'
            : 'px-3 py-1.5 text-sm',
          active
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          className,
        )}
        data-slot="segmented-control-item"
        data-state={active ? 'on' : 'off'}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          if (!(event.defaultPrevented || disabled)) {
            context.onValueChange(value);
          }
        }}
        type="button"
        {...props}
      >
        {children}
      </button>
    );
  },
);
SegmentedControlItem.displayName = 'SegmentedControlItem';

export { SegmentedControl, SegmentedControlItem };
