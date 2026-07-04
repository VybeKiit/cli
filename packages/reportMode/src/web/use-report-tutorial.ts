'use client';

import { useWalkthrough } from '@vybekiit/walkthrough/web';
import { useCallback } from 'react';

const REPORT_TUTORIAL_DONE_KEY = 'vybekiit-report-tutorial-done';

/** Number of Report Mode tutorial steps — mirrors REPORT_TUTORIAL_STEPS in the owned UI. */
const REPORT_TUTORIAL_TOTAL_STEPS = 4;

/**
 * First-visit walkthrough state for the Report Mode dock. Thin binding over the shared
 * @vybekiit/walkthrough engine at the report-mode storage key; keeps its historical
 * `next(totalSteps)` signature so the owned dock UI needs no change.
 */
export function useReportTutorial() {
  const walkthrough = useWalkthrough({
    storageKey: REPORT_TUTORIAL_DONE_KEY,
    totalSteps: REPORT_TUTORIAL_TOTAL_STEPS,
  });

  // Historical signature accepted a step count per call; the engine already knows it, so ignore it.
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
}
