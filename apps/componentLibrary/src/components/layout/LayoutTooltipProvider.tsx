'use client';

import { TooltipProvider } from '@vybekiit/ui/tooltip';
import type { ReactNode } from 'react';

/**
 * Shared tooltip provider for layout chrome (catalog controls, copy buttons).
 *
 * @param props - Optional children to wrap.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LayoutTooltipProvider><App /></LayoutTooltipProvider>;
 */
export const LayoutTooltipProvider = ({ children = <></> }: { readonly children?: ReactNode }) => (
  <TooltipProvider delayDuration={250} skipDelayDuration={0}>
    {children}
  </TooltipProvider>
);
