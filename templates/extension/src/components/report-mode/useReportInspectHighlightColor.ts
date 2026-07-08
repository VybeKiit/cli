'use client';

import {
  DEFAULT_INSPECT_HIGHLIGHT_COLOR,
  loadInspectHighlightColor,
  saveInspectHighlightColor,
} from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

/**
 * Resolve browser localStorage for highlight color persistence.
 *
 * @returns Storage when available in the current runtime.
 * @example
 * const storage = browserStorage();
 */
const browserStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Persist the inspect highlight ring color.
 *
 * @returns Highlight color plus set/reset actions.
 * @example
 * const { color, setColor } = useReportInspectHighlightColor();
 */
export const useReportInspectHighlightColor = () => {
  const [color, setColorState] = useState(DEFAULT_INSPECT_HIGHLIGHT_COLOR);

  useEffect(() => {
    setColorState(loadInspectHighlightColor(browserStorage()));
  }, []);

  const setColor = useCallback((next: string) => {
    setColorState(next);
    saveInspectHighlightColor(browserStorage(), next);
  }, []);

  const resetColor = useCallback(() => {
    setColor(DEFAULT_INSPECT_HIGHLIGHT_COLOR);
  }, [setColor]);

  return { color, setColor, resetColor };
};
