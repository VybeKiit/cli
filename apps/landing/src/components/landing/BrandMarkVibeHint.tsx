'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VIBE_HINTS } from '@/data/vibeHints';
import { useFirstHoverTypewriter } from '@/hooks/useFirstHoverTypewriter';
import { cn } from '@/lib/utils';

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

/**
 * Muted mobile subtitle — place inside label column in product-stack rows.
 *
 * @param props - Component props.
 * @returns The rendered BrandMarkVibeHintMobile element.
 * @example
 * ```tsx
 * <BrandMarkVibeHintMobile />
 * ```
 */

export const BrandMarkVibeHintMobile = ({ slug }: { readonly slug: string }) => {
  const hint = VIBE_HINTS[slug];
  if (!hint) {
    return null;
  }

  return <span className="brand-mark-vibe-hint md:hidden">{hint}</span>;
};

/**
 * Plain-English vibe hint — desktop tooltip; mobile subtitle lives in children.
 *
 * @param props - Component props.
 * @returns The rendered BrandMarkVibeHint element.
 * @example
 * ```tsx
 * <BrandMarkVibeHint />
 * ```
 */

export const BrandMarkVibeHint = ({
  slug,
  children,
  forceOpen = false,
  side = 'top',
  onCascadeInterrupt,
}: BrandMarkVibeHintProps) => {
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

  const open = Boolean(hint) && isDesktop && (forceOpen || hoverOpen);
  const typewriterHint = hint === undefined ? '' : hint;
  const { text: tooltipText, showCursor } = useFirstHoverTypewriter(slug, typewriterHint, {
    open,
    enabled: !forceOpen && Boolean(hint),
  });

  if (!hint) {
    return <>{children}</>;
  }

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
        <span className={cn(showCursor && 'typewriter-cursor')}>{tooltipText}</span>
      </TooltipContent>
    </Tooltip>
  );
};
