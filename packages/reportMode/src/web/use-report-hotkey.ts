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
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [toggleActive]);
}
