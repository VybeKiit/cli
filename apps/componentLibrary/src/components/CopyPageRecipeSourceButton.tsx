'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { layoutActionButtonClass } from '@library/components/layout/layoutChrome';
import type { PageRecipe } from '@library/data/pageRecipes';
import { useClipboardCopy } from '@library/hooks/useClipboardCopy';
import { Button } from '@vybekiit/ui/button';
import { Check, Copy } from 'lucide-react';
import { type MouseEvent, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CopyPageRecipeSourceButtonProps {
  readonly recipe: PageRecipe;
  readonly compact?: boolean;
  readonly className?: string;
}

const sourceLabel = (compact: boolean, copied: boolean): string => {
  if (compact) {
    return copied ? 'Copied' : 'Copy source';
  }
  return copied ? 'Copied!' : 'Copy page source';
};

/**
 * Render the Page recipe source copy button.
 *
 * @param props - Props passed to this component.
 * @returns A React element for copying Page recipe source.
 * @example
 * const element = <CopyPageRecipeSourceButton recipe={recipe} />;
 */
export const CopyPageRecipeSourceButton = memo(
  ({ recipe, compact = false, className }: CopyPageRecipeSourceButtonProps) => {
    const { copy, copied } = useClipboardCopy();

    const handleClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        void copy(recipe.sourceCode);
      },
      [copy, recipe.sourceCode],
    );

    return (
      <LayoutTooltip label="Copy the ready Page recipe component source.">
        <Button
          aria-label={copied ? 'Page source copied' : 'Copy Page recipe source'}
          className={cn(layoutActionButtonClass(compact), className)}
          onClick={handleClick}
          size="sm"
          type="button"
          variant={copied ? 'secondary' : 'outline'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Copy className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{sourceLabel(compact, copied)}</span>
        </Button>
      </LayoutTooltip>
    );
  },
);
CopyPageRecipeSourceButton.displayName = 'CopyPageSource';
