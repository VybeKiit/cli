'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_INSPECT_HIGHLIGHT_COLOR,
  loadInspectHighlightColor,
  saveInspectHighlightColor,
} from '../inspectHighlightColor';
import { resolveBrowserStorage } from './browserStorage';

/**
 * Manage persisted inspect highlight ring color.
 *
 * @returns Current color plus setters for saving or resetting the color.
 * @example
 * const { color, setColor, resetColor } = useReportInspectHighlightColor();
 */
export const useReportInspectHighlightColor = () => {
  const [color, setColorState] = useState(DEFAULT_INSPECT_HIGHLIGHT_COLOR);

  useEffect(() => {
    setColorState(loadInspectHighlightColor(resolveBrowserStorage()));
  }, []);

  const setColor = useCallback((next: string) => {
    setColorState(next);
    saveInspectHighlightColor(resolveBrowserStorage(), next);
  }, []);

  const resetColor = useCallback(() => {
    setColor(DEFAULT_INSPECT_HIGHLIGHT_COLOR);
  }, [setColor]);

  return { color, setColor, resetColor };
};
