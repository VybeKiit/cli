'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_REPORT_HANDOFF_TARGET,
  loadReportHandoffTarget,
  type ReportHandoffTarget,
  saveReportHandoffTarget,
} from '../handoffTarget';

function browserStorage(): Storage | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  try {
    return globalThis.localStorage;
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
