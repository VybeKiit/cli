'use client';

import {
  DEFAULT_DOCK_POSITION,
  loadDockPosition,
  saveDockPosition,
  type ReportDockAnchor,
  type ReportDockPosition,
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

/** Persisted dock placement (corner preset or custom drag position). */
export function useReportDockPosition() {
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
}
