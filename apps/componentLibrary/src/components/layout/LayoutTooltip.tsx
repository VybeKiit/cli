'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@vybekiit/ui/tooltip';
import type { ReactNode } from 'react';

interface LayoutTooltipProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly className?: string;
  readonly disabled?: boolean;
}

/**
 * Render a layout tooltip around a control.
 *
 * @param props - Label, children, side, and optional disable flag.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LayoutTooltip label="Copy"><button type="button">Copy</button></LayoutTooltip>;
 */
export const LayoutTooltip = ({
  label,
  children,
  side = 'top',
  className,
  disabled = false,
}: LayoutTooltipProps) => {
  if (disabled) {
    return children;
  }
  const tooltipClassName =
    className === undefined ? 'z-[var(--vk-z-tooltip,40)] max-w-[16rem] text-center' : className;

  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
      <TooltipContent className={tooltipClassName} side={side}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
