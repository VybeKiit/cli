'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { layoutActionButtonClass } from '@library/components/layout/layoutChrome';
import { useIsSelected, useSelectionToggle } from '@library/context/SelectionContext';
import { Button } from '@vybekiit/ui/button';
import { Check, Square } from 'lucide-react';
import { type MouseEvent, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ComponentSelectCheckboxProps {
  readonly previewKey: string;
  readonly className?: string;
  readonly compact?: boolean;
}

/**
 * Render the component select checkbox component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <ComponentSelectCheckbox {...props} />;
 */
export const ComponentSelectCheckbox = memo(
  ({ previewKey, className, compact = true }: ComponentSelectCheckboxProps) => {
    const selected = useIsSelected(previewKey);
    const toggle = useSelectionToggle();

    const handleClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(previewKey);
      },
      [previewKey, toggle],
    );

    return (
      <LayoutTooltip label="Mark this block for a combined agent prompt. Select a few, then copy once from the tray at the bottom.">
        <Button
          aria-label="Select for agent prompt"
          aria-pressed={selected}
          className={cn(layoutActionButtonClass(compact), className)}
          onClick={handleClick}
          size="sm"
          type="button"
          variant={selected ? 'secondary' : 'outline'}
        >
          {selected ? (
            <Check className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Square className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{selected ? 'Selected' : 'Select'}</span>
        </Button>
      </LayoutTooltip>
    );
  },
);
ComponentSelectCheckbox.displayName = 'ComponentSelectCheckbox';
