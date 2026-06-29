'use client';

import { useCallback, useEffect, useState } from 'react';

export const REPORT_TUTORIAL_DONE_KEY = 'vybekiit-report-tutorial-done';

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

/** First-visit walkthrough state for the Report Mode dock. */
export function useReportTutorial() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    try {
      const done = browserStorage()?.getItem(REPORT_TUTORIAL_DONE_KEY) === 'true';
      if (!done) {
        setActive(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const complete = useCallback(() => {
    setActive(false);
    try {
      browserStorage()?.setItem(REPORT_TUTORIAL_DONE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const skip = complete;

  const next = useCallback(
    (totalSteps: number) => {
      setStepIndex((index) => {
        if (index >= totalSteps - 1) {
          complete();
          return index;
        }
        return index + 1;
      });
    },
    [complete],
  );

  return { active, stepIndex, next, skip, complete };
}
