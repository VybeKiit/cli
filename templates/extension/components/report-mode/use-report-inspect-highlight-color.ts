'use client';

import {
  DEFAULT_INSPECT_HIGHLIGHT_COLOR,
  loadInspectHighlightColor,
  saveInspectHighlightColor,
} from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Persisted inspect highlight ring color for pick mode. */
export function useReportInspectHighlightColor() {
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
}
