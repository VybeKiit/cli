'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { useSelectionTrayState } from '@library/context/SelectionContext';
import { useClipboardCopy } from '@library/hooks/useClipboardCopy';
import { buildBulkAgentPrompt } from '@library/lib/agentPrompt';
import { Check, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SelectionTray() {
  const { count, selectedEntries, clear } = useSelectionTrayState();
  const { copy, copied } = useClipboardCopy();

  if (count === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-border border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
      data-tour="selection-tray"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">{count}</span>{' '}
          {count === 1 ? 'component selected' : 'components selected'}
          <span className="hidden text-muted-foreground sm:inline">
            {' '}
            — paste one prompt into Cursor, Claude, or Codex
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <LayoutTooltip label="Copy one prompt that lists every selected block — paste it into your AI editor to implement them together.">
            <Button
              onClick={() => void copy(buildBulkAgentPrompt(selectedEntries))}
              size="sm"
              type="button"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy combined prompt'}
            </Button>
          </LayoutTooltip>
          <LayoutTooltip label="Clear your selection and hide this tray.">
            <Button onClick={clear} size="sm" type="button" variant="ghost">
              <X className="h-4 w-4" />
              Clear
            </Button>
          </LayoutTooltip>
        </div>
      </div>
    </div>
  );
}
