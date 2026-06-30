'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VIBE_HINTS } from '@/data/vibe-hints';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const DESKTOP_MEDIA = '(min-width: 768px)';

export type BrandMarkVibeHintMode = 'tooltip-only' | 'tooltip-and-mobile-subtitle';

interface BrandMarkVibeHintProps {
  readonly slug: string;
  readonly children: ReactNode;
  readonly mode?: BrandMarkVibeHintMode;
  readonly forceOpen?: boolean;
  readonly side?: 'top' | 'bottom' | 'left' | 'right';
  readonly onCascadeInterrupt?: () => void;
}

/** Muted mobile subtitle — place inside label column in product-stack rows. */
export function BrandMarkVibeHintMobile({ slug }: { readonly slug: string }) {
  const hint = VIBE_HINTS[slug];
  if (!hint) {
    return null;
  }

  return <span className="brand-mark-vibe-hint md:hidden">{hint}</span>;
}

/** Plain-English vibe hint — desktop tooltip; mobile subtitle lives in children. */
export function BrandMarkVibeHint({
  slug,
  children,
  forceOpen = false,
  side = 'top',
  onCascadeInterrupt,
}: BrandMarkVibeHintProps) {
  const hint = VIBE_HINTS[slug];
  const [isDesktop, setIsDesktop] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const sync = () => {
      setIsDesktop(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (forceOpen) {
        if (nextOpen) {
          onCascadeInterrupt?.();
        }
        return;
      }
      setHoverOpen(nextOpen);
    },
    [forceOpen, onCascadeInterrupt],
  );

  const handlePointerEnter = useCallback(() => {
    if (!isDesktop) {
      return;
    }
    onCascadeInterrupt?.();
    setHoverOpen(true);
  }, [isDesktop, onCascadeInterrupt]);

  const handlePointerLeave = useCallback(() => {
    if (forceOpen) {
      return;
    }
    setHoverOpen(false);
  }, [forceOpen]);

  if (!hint) {
    return <>{children}</>;
  }

  const open = isDesktop && (forceOpen || hoverOpen);

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger
        asChild={true}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          'max-w-[16rem] border border-white/12 bg-[#080b12] px-2.5 py-2 text-center font-medium text-[0.68rem] text-white/88 leading-snug shadow-lg',
        )}
        side={side}
        sideOffset={8}
      >
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}
