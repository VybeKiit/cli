'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@vybekiit/ui/tooltip';
import { cn } from '@/lib/utils';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface BuilderFeatureHintProps {
  readonly text: string;
  readonly children: ReactNode;
  /** Stagger intro tooltips across the landing grid (ms). */
  readonly mountDelayMs?: number;
  readonly className?: string;
}

/**
 * Buyer-voice feature hint: intro tooltip on mount, then hover to read again.
 *
 * @param props - Tooltip text, trigger element, optional mount delay, and optional content class.
 * @returns A tooltip wrapper that introduces the feature once, then behaves like hover help.
 * @example
 * <BuilderFeatureHint text="Your assistant can tune this later"><button>Preview</button></BuilderFeatureHint>
 */
export const BuilderFeatureHint = ({
  text,
  children,
  mountDelayMs = 0,
  className = '',
}: BuilderFeatureHintProps) => {
  const [open, setOpen] = useState(false);
  const hoveringRef = useRef(false);
  const mountIntroDoneRef = useRef(false);

  useEffect(() => {
    const showTimer = globalThis.setTimeout(() => {
      if (!(hoveringRef.current || mountIntroDoneRef.current)) {
        setOpen(true);
      }
    }, mountDelayMs);

    const hideTimer = globalThis.setTimeout(() => {
      if (!hoveringRef.current) {
        setOpen(false);
        mountIntroDoneRef.current = true;
      }
    }, mountDelayMs + 4500);

    return () => {
      globalThis.clearTimeout(showTimer);
      globalThis.clearTimeout(hideTimer);
    };
  }, [mountDelayMs]);

  const handleOpenChange = useCallback((next: boolean) => {
    hoveringRef.current = next;
    setOpen(next);
  }, []);

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} delayDuration={150}>
      <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className={cn(
          'max-w-[15rem] border border-border/60 bg-popover px-3 py-2 text-left text-popover-foreground text-xs leading-snug shadow-md',
          className,
        )}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
};
