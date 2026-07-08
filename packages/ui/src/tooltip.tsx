'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from './utils';

/** Tooltip Provider primitive re-export from the underlying UI library. */
const TooltipProvider = TooltipPrimitive.Provider;

/** Tooltip primitive re-export from the underlying UI library. */
const Tooltip = TooltipPrimitive.Root;

/** Tooltip Trigger primitive re-export from the underlying UI library. */
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Render the Tooltip Content component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Tooltip Content component.
 * @example
 * <TooltipContent />;
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-[--radix-tooltip-content-transform-origin] animate-in overflow-hidden rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs data-[state=closed]:animate-out',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
