'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CLOSE_DELAY_MS = 160;

/**
 * Keep flyout menus open while moving from trigger to options.
 *
 * @returns Hover menu open state and actions.
 * @example
 * const hoverMenu = useReportHoverMenu();
 */
export const useReportHoverMenu = () => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return { open, openMenu, scheduleClose, closeMenu };
};
