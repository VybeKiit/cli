'use client';

import { type CSSProperties, type RefObject, useCallback, useEffect, useState } from 'react';
import { computeFlyoutPlacement, type FlyoutAlign } from '../position';

/**
 * Positions hover flyouts with fixed coordinates (used with a body portal). Places the flyout above
 * its trigger, flips below near the top edge, and clamps into the viewport so it never clips off-screen
 * when the dock is pinned to any corner — see `computeFlyoutPlacement` in `../position`.
 */
export function useReportFlyoutPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  align: FlyoutAlign = 'center',
  flyoutRef?: RefObject<HTMLElement | null>,
) {
  const [style, setStyle] = useState<CSSProperties>({});

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!(open && trigger)) {
      setStyle({});
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const flyout = flyoutRef?.current?.getBoundingClientRect();
    const { left, top } = computeFlyoutPlacement({
      trigger: rect,
      flyout: { width: flyout?.width ?? 0, height: flyout?.height ?? 0 },
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
}
