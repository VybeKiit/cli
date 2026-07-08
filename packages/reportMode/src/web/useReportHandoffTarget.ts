'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_REPORT_HANDOFF_TARGET,
  loadReportHandoffTarget,
  type ReportHandoffTarget,
  saveReportHandoffTarget,
} from '../handoffTarget';
import { resolveBrowserStorage } from './browserStorage';

/**
 * Manage the persisted Report Mode handoff target.
 *
 * @returns Current target and setter that persists the next target.
 * @example
 * const { target, setTarget } = useReportHandoffTarget();
 */
export const useReportHandoffTarget = () => {
  const [target, setTargetState] = useState<ReportHandoffTarget>(DEFAULT_REPORT_HANDOFF_TARGET);

  useEffect(() => {
    setTargetState(loadReportHandoffTarget(resolveBrowserStorage()));
  }, []);

  const setTarget = useCallback((next: ReportHandoffTarget) => {
    setTargetState(next);
    saveReportHandoffTarget(resolveBrowserStorage(), next);
  }, []);

  return { target, setTarget };
};
