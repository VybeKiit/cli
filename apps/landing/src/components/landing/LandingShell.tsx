'use client';

import type { ReactNode } from 'react';
import { BlueFlare } from '@/components/landing/BlueFlare';
import { TooltipProvider } from '@/components/ui/tooltip';
import { landingFontClasses } from '@/lib/fonts';

interface LandingShellProps {
  children: ReactNode;
}

/**
 * Cinematic landing page wrapper — scoped tokens, background, vignette.
 *
 * @param props - Component props.
 * @returns The rendered LandingShell element.
 * @example
 * ```tsx
 * <LandingShell />
 * ```
 */

export const LandingShell = ({ children }: LandingShellProps) => (
  <div
    className={`landing-page relative min-h-screen overflow-x-hidden font-[family-name:var(--font-geist-sans),var(--font-inter),ui-sans-serif,system-ui] text-[var(--text-main)] ${landingFontClasses}`}
  >
    <div aria-hidden="true" className="page-bg pointer-events-none fixed inset-0 -z-10" />
    <div aria-hidden="true" className="page-vignette pointer-events-none fixed inset-0 -z-10" />
    <div aria-hidden="true" className="page-noise pointer-events-none fixed inset-0 -z-10" />
    <BlueFlare className="fixed start-1/2 top-[190px] z-0 -translate-x-1/2" variant="hero" />
    <TooltipProvider delayDuration={400} skipDelayDuration={0}>
      {children}
    </TooltipProvider>
  </div>
);
