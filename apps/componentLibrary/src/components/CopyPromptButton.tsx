'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { layoutActionButtonClass } from '@library/components/layout/layoutChrome';
import type { CatalogEntry } from '@library/data/catalog';
import { useClipboardCopy } from '@library/hooks/useClipboardCopy';
import { buildComponentAgentPrompt } from '@library/lib/agentPrompt';
import { Check, Copy } from 'lucide-react';
import { type MouseEvent, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyPromptButtonProps {
  readonly entry: CatalogEntry;
  readonly compact?: boolean;
  readonly className?: string;
}

export const CopyPromptButton = memo(function CopyPromptButton({
  entry,
  compact = false,
  className,
}: CopyPromptButtonProps) {
  const { copy, copied } = useClipboardCopy();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void copy(buildComponentAgentPrompt(entry));
    },
    [copy, entry],
  );

  return (
    <LayoutTooltip label="Copy a ready-made prompt for Cursor, Claude, or Codex — includes import path and preview link so your agent can wire this block in.">
      <Button
        aria-label={copied ? 'Prompt copied' : 'Copy agent prompt'}
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
        <span className="truncate">
          {compact ? (copied ? 'Copied' : 'Copy prompt') : copied ? 'Copied!' : 'Copy agent prompt'}
        </span>
      </Button>
    </LayoutTooltip>
  );
});
