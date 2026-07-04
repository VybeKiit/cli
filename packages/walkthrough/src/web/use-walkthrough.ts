'use client';

import { useCallback, useEffect, useState } from 'react';

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

export interface UseWalkthroughOptions {
  /** localStorage key that records "this walkthrough is done" so it only auto-opens once. */
  readonly storageKey: string;
  /** Total number of steps — bounds `next` so the last step completes instead of overflowing. */
  readonly totalSteps: number;
}

export interface WalkthroughState {
  readonly active: boolean;
  readonly stepIndex: number;
  readonly next: () => void;
  readonly back: () => void;
  readonly skip: () => void;
  readonly complete: () => void;
  /** Clear the done flag and reopen at step 0 — powers "Take tour" / "?" replay affordances. */
  readonly replay: () => void;
}

/**
 * First-run walkthrough engine. Gates auto-open on `localStorage[storageKey]`, tracks the current
 * step, and exposes navigation. UI-agnostic — a spotlight or a dialog can both render off this.
 * Generalized from @vybekiit/report-mode's useReportTutorial (adds `back` and `replay`).
 */
export function useWalkthrough({
  storageKey,
  totalSteps,
}: UseWalkthroughOptions): WalkthroughState {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    try {
      const done = browserStorage()?.getItem(storageKey) === 'true';
      if (!done) {
        setActive(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const complete = useCallback(() => {
    setActive(false);
    try {
      browserStorage()?.setItem(storageKey, 'true');
    } catch {
      // ignore
    }
  }, [storageKey]);

  const skip = complete;

  const next = useCallback(() => {
    setStepIndex((index) => {
      if (index >= totalSteps - 1) {
        complete();
        return index;
      }
      return index + 1;
    });
  }, [complete, totalSteps]);

  const back = useCallback(() => {
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const replay = useCallback(() => {
    try {
      browserStorage()?.removeItem(storageKey);
    } catch {
      // ignore
    }
    setStepIndex(0);
    setActive(true);
  }, [storageKey]);

  return { active, stepIndex, next, back, skip, complete, replay };
}
