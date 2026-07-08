'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ReportControlHintProps {
  readonly text: string;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Buyer-voice control hint — shadcn Tooltip, suppressed when flyout/hold/tutorial is active.
 *
 * @param props - Component props.
 * @returns The rendered ReportControlHint element.
 * @example
 * ```tsx
 * <ReportControlHint />
 * ```
 */

export const ReportControlHint = ({
  text,
  children,
  disabled = false,
  className,
}: ReportControlHintProps) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
      <TooltipContent
        className={cn(
          'max-w-[11rem] border border-white/12 bg-[#080b12] px-2 py-1.5 text-center font-medium text-[0.62rem] text-white/88 leading-snug shadow-lg',
          className,
        )}
        side="top"
        sideOffset={6}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
};
