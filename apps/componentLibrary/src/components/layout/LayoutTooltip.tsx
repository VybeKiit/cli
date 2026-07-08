'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@vybekiit/ui/tooltip';
import type { ReactNode } from 'react';

interface LayoutTooltipProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly className?: string;
  readonly disabled?: boolean;
}

/**
 * Render the layout tooltip provider component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LayoutTooltipProvider><App /></LayoutTooltipProvider>;
 */
export const LayoutTooltipProvider = ({ children = <></> }: { readonly children?: ReactNode }) => (
  <TooltipProvider delayDuration={250} skipDelayDuration={0}>
    {children}
  </TooltipProvider>
);

/**
 * Render the layout tooltip component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LayoutTooltip {...props} />;
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
