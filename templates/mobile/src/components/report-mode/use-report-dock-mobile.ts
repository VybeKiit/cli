import 'expo-sqlite/localStorage/install';

import {
  DEFAULT_DOCK_POSITION,
  loadDockCornerOnly,
  saveDockPosition,
  type ReportDockAnchor,
} from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

type CornerAnchor = Exclude<ReportDockAnchor, 'custom'>;

/**
 * Resolve localStorage for the Expo SQLite polyfill.
 *
 * @returns Storage when available in the current runtime.
 * @example
 * const storage = mobileStorage();
 */
const mobileStorage = (): Storage | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return localStorage;
  } catch {
    return null;
  }
};

/**
 * Persist the report-mode FAB corner on mobile.
 *
 * @returns Current dock corner and a setter that writes it to storage.
 * @example
 * const { corner, setCorner } = useReportDockMobile();
 */
export const useReportDockMobile = () => {
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
};
