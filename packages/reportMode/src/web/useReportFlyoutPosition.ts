'use client';

import { type CSSProperties, type RefObject, useCallback, useEffect, useState } from 'react';
import { computeFlyoutPlacement, type FlyoutAlign } from '../position';

/**
 * Resolve flyout dimensions from an optional element ref.
 *
 * @param flyoutRef - Optional ref to the measured flyout element.
 * @returns Width and height used by flyout placement.
 * @example
 * const flyout = resolveFlyoutSize(flyoutRef);
 */
const resolveFlyoutSize = (
  flyoutRef: RefObject<HTMLElement | null> | undefined,
): { readonly width: number; readonly height: number } => {
  const rect = flyoutRef?.current?.getBoundingClientRect();
  if (rect === undefined) {
    return { width: 0, height: 0 };
  }

  return { width: rect.width, height: rect.height };
};

/**
 * Position a hover flyout with fixed coordinates.
 *
 * @param open - Whether the flyout is open.
 * @param triggerRef - Ref to the trigger element.
 * @param align - Horizontal flyout alignment.
 * @param flyoutRef - Optional ref to the flyout element for measuring size.
 * @returns CSS properties for a fixed-position flyout.
 * @example
 * const style = useReportFlyoutPosition(open, triggerRef, 'end', flyoutRef);
 */
export const useReportFlyoutPosition = (
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  align: FlyoutAlign = 'center',
  flyoutRef?: RefObject<HTMLElement | null>,
): CSSProperties => {
  const [style, setStyle] = useState<CSSProperties>({});

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!(open && trigger)) {
      setStyle({});
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const { left, top } = computeFlyoutPlacement({
      trigger: rect,
      flyout: resolveFlyoutSize(flyoutRef),
      viewport: { width: globalThis.innerWidth, height: globalThis.innerHeight },
      align,
    });

    setStyle({ position: 'fixed', left, top, zIndex: 10_001 });
  }, [align, open, triggerRef, flyoutRef]);

  useEffect(() => {
    measure();
    if (!open) {
      return;
    }
    globalThis.addEventListener('resize', measure);
    globalThis.addEventListener('scroll', measure, true);
    return () => {
      globalThis.removeEventListener('resize', measure);
      globalThis.removeEventListener('scroll', measure, true);
    };
  }, [measure, open]);

  return style;
};
