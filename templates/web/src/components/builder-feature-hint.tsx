'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@vybekiit/ui/tooltip';
import { cn } from '@/lib/utils';
import { type ReactNode, useEffect, useRef, useState } from 'react';

type BuilderFeatureHintProps = {
  readonly text: string;
  readonly children: ReactNode;
  /** Stagger intro tooltips across the landing grid (ms). */
  readonly mountDelayMs?: number;
  readonly className?: string;
};

/**
 * Buyer-voice feature hint: intro tooltip on mount, then hover to read again.
 */
export function BuilderFeatureHint({
  text,
  children,
  mountDelayMs = 0,
  className,
}: BuilderFeatureHintProps) {
  const [open, setOpen] = useState(false);
  const hoveringRef = useRef(false);
  const mountIntroDoneRef = useRef(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      if (!(hoveringRef.current || mountIntroDoneRef.current)) {
        setOpen(true);
      }
    }, mountDelayMs);

    const hideTimer = window.setTimeout(() => {
      if (!hoveringRef.current) {
        setOpen(false);
        mountIntroDoneRef.current = true;
      }
    }, mountDelayMs + 4500);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [mountDelayMs]);

  const handleOpenChange = (next: boolean) => {
    hoveringRef.current = next;
    setOpen(next);
  };

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} delayDuration={150}>
      <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className={cn(
          'max-w-[15rem] border border-border/60 bg-popover px-3 py-2 text-left text-xs leading-snug text-popover-foreground shadow-md',
          className,
        )}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
