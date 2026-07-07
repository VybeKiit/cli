'use client';

import { useWalkthrough } from '@vybekiit/walkthrough/web';
import { useCallback } from 'react';

const REPORT_TUTORIAL_DONE_KEY = 'vybekiit-report-tutorial-done';

/** Number of Report Mode tutorial steps mirrored from the owned UI. */
const REPORT_TUTORIAL_TOTAL_STEPS = 4;

/**
 * Manage first-visit walkthrough state for the Report Mode dock.
 *
 * @returns Walkthrough state and navigation actions for the Report Mode tutorial.
 * @example
 * const tutorial = useReportTutorial();
 */
export const useReportTutorial = () => {
  const walkthrough = useWalkthrough({
    storageKey: REPORT_TUTORIAL_DONE_KEY,
    totalSteps: REPORT_TUTORIAL_TOTAL_STEPS,
  });

  const next = useCallback((_totalSteps?: number) => walkthrough.next(), [walkthrough]);

  return {
    active: walkthrough.active,
    stepIndex: walkthrough.stepIndex,
    next,
    back: walkthrough.back,
    skip: walkthrough.skip,
    complete: walkthrough.complete,
    replay: walkthrough.replay,
  };
};
