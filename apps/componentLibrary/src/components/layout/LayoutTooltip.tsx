'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LayoutTooltipProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly className?: string;
  readonly disabled?: boolean;
}

export function LayoutTooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={0}>
      {children}
    </TooltipProvider>
  );
}

export function LayoutTooltip({
  label,
  children,
  side = 'top',
  className,
  disabled = false,
}: LayoutTooltipProps) {
  if (disabled) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
      <TooltipContent
        className={className ?? 'z-[var(--vk-z-tooltip,40)] max-w-[16rem] text-center'}
        side={side}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
