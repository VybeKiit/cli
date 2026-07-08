'use client';

import {
  DEFAULT_DOCK_POSITION,
  loadDockPosition,
  saveDockPosition,
  type ReportDockAnchor,
  type ReportDockPosition,
} from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

/**
 * Resolve browser localStorage for dock persistence.
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
 * Persist the report-mode dock position.
 *
 * @returns Dock position plus setters for custom and corner placement.
 * @example
 * const { position, savePosition } = useReportDockPosition();
 */
export const useReportDockPosition = () => {
  const [position, setPosition] = useState<ReportDockPosition>(DEFAULT_DOCK_POSITION);

  useEffect(() => {
    setPosition(loadDockPosition(browserStorage()));
  }, []);

  const savePosition = useCallback((next: ReportDockPosition) => {
    setPosition(next);
    saveDockPosition(browserStorage(), next);
  }, []);

  const setCorner = useCallback(
    (anchor: Exclude<ReportDockAnchor, 'custom'>) => {
      savePosition({ anchor });
    },
    [savePosition],
  );

  return { position, savePosition, setCorner };
};
