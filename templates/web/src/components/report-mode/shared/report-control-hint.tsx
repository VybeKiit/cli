'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ReportControlHintProps = {
  readonly text: string;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly className?: string;
};

/** Buyer-voice control hint — shadcn Tooltip, suppressed when flyout/hold/tutorial is active. */
export function ReportControlHint({
  text,
  children,
  disabled = false,
  className,
}: ReportControlHintProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
      <TooltipContent
        className={cn(
          'max-w-[11rem] border border-white/12 bg-[#080b12] px-2 py-1.5 text-center text-[0.62rem] font-medium leading-snug text-white/88 shadow-lg',
          className,
        )}
        side="top"
        sideOffset={6}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
