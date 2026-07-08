'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { layoutActionButtonClass } from '@library/components/layout/layoutChrome';
import type { PageRecipe } from '@library/data/pageRecipes';
import { useClipboardCopy } from '@library/hooks/useClipboardCopy';
import { buildPageRecipeAgentPrompt } from '@library/lib/agentPrompt';
import { Button } from '@vybekiit/ui/button';
import { Check, ClipboardList } from 'lucide-react';
import { type MouseEvent, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CopyPageRecipePromptButtonProps {
  readonly recipe: PageRecipe;
  readonly compact?: boolean;
  readonly className?: string;
}

const promptLabel = (compact: boolean, copied: boolean): string => {
  if (compact) {
    return copied ? 'Copied' : 'Copy prompt';
  }
  return copied ? 'Copied!' : 'Copy install prompt';
};

/**
 * Render the Page recipe prompt copy button.
 *
 * @param props - Props passed to this component.
 * @returns A React element for copying Page recipe install prompts.
 * @example
 * const element = <CopyPageRecipePromptButton recipe={recipe} />;
 */
export const CopyPageRecipePromptButton = memo(
  ({ recipe, compact = false, className }: CopyPageRecipePromptButtonProps) => {
    const { copy, copied } = useClipboardCopy();

    const handleClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        void copy(buildPageRecipeAgentPrompt(recipe));
      },
      [copy, recipe],
    );

    return (
      <LayoutTooltip label="Copy an install prompt with route, TODOs, provider notes, and checks.">
        <Button
          aria-label={copied ? 'Page prompt copied' : 'Copy Page recipe install prompt'}
          className={cn(layoutActionButtonClass(compact), className)}
          onClick={handleClick}
          size="sm"
          type="button"
          variant={copied ? 'secondary' : 'outline'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{promptLabel(compact, copied)}</span>
        </Button>
      </LayoutTooltip>
    );
  },
);
CopyPageRecipePromptButton.displayName = 'CopyPagePrompt';
