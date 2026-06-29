'use client';

import {
  DEFAULT_REPORT_HANDOFF_TARGET,
  loadReportHandoffTarget,
  saveReportHandoffTarget,
  type ReportHandoffTarget,
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

/** Persisted choice: paste into the open chat vs open a new assistant chat. */
export function useReportHandoffTarget() {
  const [target, setTargetState] = useState<ReportHandoffTarget>(DEFAULT_REPORT_HANDOFF_TARGET);

  useEffect(() => {
    setTargetState(loadReportHandoffTarget(browserStorage()));
  }, []);

  const setTarget = useCallback((next: ReportHandoffTarget) => {
    setTargetState(next);
    saveReportHandoffTarget(browserStorage(), next);
  }, []);

  return { target, setTarget };
}
