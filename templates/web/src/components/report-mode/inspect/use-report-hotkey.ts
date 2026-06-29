'use client';

import { useEffect } from 'react';

function isReportHotkey(event: KeyboardEvent): boolean {
  return event.altKey && event.shiftKey && event.key.toLowerCase() === 'r';
}

/** Option+Shift+R toggles pick mode. */
export function useReportHotkey(toggleActive: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isReportHotkey(event)) {
        return;
      }
      event.preventDefault();
      toggleActive();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleActive]);
}
