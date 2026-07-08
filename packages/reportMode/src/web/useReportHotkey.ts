'use client';

import { useEffect } from 'react';

/**
 * Check whether a keyboard event matches the Report Mode toggle hotkey.
 *
 * @param event - Keyboard event from the window.
 * @returns `true` for Option/Alt+Shift+R.
 * @example
 * const matched = isReportHotkey(event);
 */
const isReportHotkey = (event: KeyboardEvent): boolean =>
  event.altKey && event.shiftKey && event.key.toLowerCase() === 'r';

/**
 * Register the Option/Alt+Shift+R Report Mode toggle hotkey.
 *
 * @param toggleActive - Callback that toggles inspect mode.
 * @returns Nothing.
 * @example
 * useReportHotkey(toggleActive);
 */
export const useReportHotkey = (toggleActive: () => void): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!isReportHotkey(event)) {
        return;
      }
      event.preventDefault();
      toggleActive();
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [toggleActive]);
};
