'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_DOCK_POSITION,
  loadDockPosition,
  type ReportDockAnchor,
  type ReportDockPosition,
  saveDockPosition,
} from '../position';
import { resolveBrowserStorage } from './browserStorage';

/**
 * Manage persisted Report dock placement.
 *
 * @returns Current position plus setters for custom and corner positions.
 * @example
 * const { position, savePosition, setCorner } = useReportDockPosition();
 */
export const useReportDockPosition = () => {
  const [position, setPosition] = useState<ReportDockPosition>(DEFAULT_DOCK_POSITION);

  useEffect(() => {
    setPosition(loadDockPosition(resolveBrowserStorage()));
  }, []);

  const savePosition = useCallback((next: ReportDockPosition) => {
    setPosition(next);
    saveDockPosition(resolveBrowserStorage(), next);
  }, []);

  const setCorner = useCallback(
    (anchor: Exclude<ReportDockAnchor, 'custom'>) => {
      savePosition({ anchor });
    },
    [savePosition],
  );

  return { position, savePosition, setCorner };
};
