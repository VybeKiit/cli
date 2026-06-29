'use client';

import { useCallback, useEffect, useState, type CSSProperties, type RefObject } from 'react';

type FlyoutAlign = 'center' | 'end';

/** Positions hover flyouts with fixed coordinates (used with body portal). */
export function useReportFlyoutPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  align: FlyoutAlign = 'center',
) {
  const [style, setStyle] = useState<CSSProperties>({});

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!open || !trigger) {
      setStyle({});
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const gap = 8;

    if (align === 'end') {
      setStyle({
        position: 'fixed',
        left: rect.right,
        top: rect.top - gap,
        transform: 'translate(-100%, -100%)',
        zIndex: 10001,
      });
      return;
    }

    setStyle({
      position: 'fixed',
      left: rect.left + rect.width / 2,
      top: rect.top - gap,
      transform: 'translate(-50%, -100%)',
      zIndex: 10001,
    });
  }, [align, open, triggerRef]);

  useEffect(() => {
    measure();
    if (!open) {
      return;
    }
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure, open]);

  return style;
}
