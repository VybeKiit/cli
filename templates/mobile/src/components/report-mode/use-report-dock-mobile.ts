import 'expo-sqlite/localStorage/install';

import {
  DEFAULT_DOCK_POSITION,
  loadDockCornerOnly,
  saveDockPosition,
  type ReportDockAnchor,
} from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

type CornerAnchor = Exclude<ReportDockAnchor, 'custom'>;

function mobileStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** Persisted FAB corner (corners only — no custom drag on mobile). */
export function useReportDockMobile() {
  const [corner, setCornerState] = useState<CornerAnchor>(
    DEFAULT_DOCK_POSITION.anchor as CornerAnchor,
  );

  useEffect(() => {
    setCornerState(loadDockCornerOnly(mobileStorage()));
  }, []);

  const setCorner = useCallback((anchor: CornerAnchor) => {
    setCornerState(anchor);
    saveDockPosition(mobileStorage(), { anchor });
  }, []);

  return { corner, setCorner };
}
