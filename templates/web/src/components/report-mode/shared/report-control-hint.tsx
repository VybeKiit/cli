'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@vybekiit/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ReportControlHintProps {
  readonly text: string;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Render a buyer-voice tooltip for a report-mode control.
 *
 * @param props - Tooltip text, child control, and disabled state.
 * @returns The child directly when disabled, otherwise a tooltip wrapper.
 * @example
 * <ReportControlHint text="Point and fix"><button type="button" /></ReportControlHint>
 */
const ReportControlHint = ({
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
          'max-w-[11rem] border border-white/12 bg-[#080b12] px-2 py-1.5 text-center font-medium text-xs text-white/88 leading-snug shadow-lg',
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

export { ReportControlHint };
