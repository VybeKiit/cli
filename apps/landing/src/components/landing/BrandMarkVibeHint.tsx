'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

import { VIBE_HINTS } from '@/data/vibeHints';
import { cn } from '@/lib/utils';

export type BrandMarkVibeHintMode = 'tooltip-only' | 'tooltip-and-mobile-subtitle';

interface BrandMarkVibeHintProps {
  readonly slug: string;
  readonly children: ReactNode;
  readonly mode?: BrandMarkVibeHintMode;
  readonly forceOpen?: boolean;
  readonly side?: 'top' | 'bottom' | 'left' | 'right';
  readonly onCascadeInterrupt?: (() => void) | undefined;
  /**
   * When true, show the full hint immediately (no hover typewriter).
   * Use under moving marquees so the tooltip is readable on first paint.
   */
  readonly instant?: boolean;
}

/**
 * Muted mobile subtitle — place inside label column in product-stack rows.
 *
 * @param props - Component props.
 * @returns The rendered BrandMarkVibeHintMobile element.
 * @example
 * ```tsx
 * <BrandMarkVibeHintMobile slug="cursor" />
 * ```
 */
export const BrandMarkVibeHintMobile = ({ slug }: { readonly slug: string }) => {
  const hint = VIBE_HINTS[slug];
  if (!hint) {
    return null;
  }

  return <span className="brand-mark-vibe-hint md:hidden">{hint}</span>;
};

interface TooltipBoxProps {
  readonly text: string;
  readonly anchor: DOMRect;
  readonly side: 'top' | 'bottom' | 'left' | 'right';
  readonly labelId: string;
}

/**
 * Fixed-position portal tooltip. Avoids Radix opacity/animation fights under marquees.
 *
 * @param props - Text, anchor rect, and preferred side.
 * @returns Portal tooltip node.
 */
const TooltipBox = ({ text, anchor, side, labelId }: TooltipBoxProps) => {
  const gap = 12;
  const maxWidth = 256;
  const viewportPad = 12;

  let top = anchor.top;
  let left = anchor.left + anchor.width / 2;

  if (side === 'top') {
    top = anchor.top - gap;
  } else if (side === 'bottom') {
    top = anchor.bottom + gap;
  } else if (side === 'left') {
    top = anchor.top + anchor.height / 2;
    left = anchor.left - gap;
  } else {
    top = anchor.top + anchor.height / 2;
    left = anchor.right + gap;
  }

  // Keep the bubble inside the viewport horizontally.
  const half = maxWidth / 2;
  const clampedLeft = Math.min(
    Math.max(left, half + viewportPad),
    window.innerWidth - half - viewportPad,
  );

  let transform = 'translate(0, -50%)';
  if (side === 'top') {
    transform = 'translate(-50%, -100%)';
  } else if (side === 'bottom') {
    transform = 'translate(-50%, 0)';
  } else if (side === 'left') {
    transform = 'translate(-100%, -50%)';
  }

  return createPortal(
    <div
      className="brand-vibe-tooltip"
      id={labelId}
      role="tooltip"
      style={{
        position: 'fixed',
        top,
        left: side === 'top' || side === 'bottom' ? clampedLeft : left,
        transform,
        zIndex: 400,
      }}
    >
      {text}
    </div>,
    document.body,
  );
};

/**
 * Plain-English vibe hint — desktop portal tooltip; works under marquees and auto-popups.
 *
 * @param props - Component props.
 * @returns The rendered BrandMarkVibeHint element.
 * @example
 * ```tsx
 * <BrandMarkVibeHint slug="cursor" instant>
 *   <button type="button">Cursor</button>
 * </BrandMarkVibeHint>
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
  const labelId = useId();
  const [finePointer, setFinePointer] = useState(true);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [wrapEl, setWrapEl] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => {
      setFinePointer(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  const open = Boolean(hint) && finePointer && (forceOpen || hoverOpen);

  const measure = useCallback(() => {
    if (wrapEl === null) {
      return;
    }
    setAnchor(wrapEl.getBoundingClientRect());
  }, [wrapEl]);

  useEffect(() => {
    if (!open) {
      return;
    }
    measure();
    const onScrollOrResize = () => {
      measure();
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    // Marquees move every frame — keep the bubble glued to the logo.
    const raf = window.setInterval(measure, 80);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      window.clearInterval(raf);
    };
  }, [open, measure]);

  const handlePointerEnter = useCallback(() => {
    if (!(finePointer && hint)) {
      return;
    }
    onCascadeInterrupt?.();
    setHoverOpen(true);
    if (wrapEl !== null) {
      setAnchor(wrapEl.getBoundingClientRect());
    }
  }, [finePointer, hint, onCascadeInterrupt, wrapEl]);

  const handlePointerLeave = useCallback(() => {
    if (forceOpen) {
      return;
    }
    setHoverOpen(false);
  }, [forceOpen]);

  if (!hint) {
    return <>{children}</>;
  }

  return (
    <span
      ref={setWrapEl}
      className={cn('brand-vibe-hint-wrap', open && 'brand-vibe-hint-wrap--open')}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <span aria-describedby={open ? labelId : undefined} className="brand-vibe-hint-trigger">
        {children}
      </span>
      {open && anchor !== null ? (
        <TooltipBox anchor={anchor} labelId={labelId} side={side} text={hint} />
      ) : null}
    </span>
  );
};
