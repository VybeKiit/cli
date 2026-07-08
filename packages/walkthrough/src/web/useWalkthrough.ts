'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Resolve browser localStorage only when the host allows access.
 *
 * @returns The browser storage object, or null when storage is unavailable.
 * @example
 * const storage = browserStorage();
 */
const browserStorage = (): Storage | null => {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

/**
 * Read whether a walkthrough completion flag has already been recorded.
 *
 * @param storageKey - localStorage key that stores the walkthrough completion flag.
 * @returns True when the stored flag is exactly "true"; otherwise false.
 * @example
 * const done = isWalkthroughDone('web.onboarding.done');
 */
const isWalkthroughDone = (storageKey: string): boolean => {
  try {
    const storage = browserStorage();

    if (storage === null) {
      return false;
    }

    return storage.getItem(storageKey) === 'true';
  } catch {
    return false;
  }
};

/**
 * Persist a walkthrough completion flag when browser storage is writable.
 *
 * @param storageKey - localStorage key that stores the walkthrough completion flag.
 * @returns Nothing; storage failures are ignored so the UI can still close.
 * @example
 * markWalkthroughDone('web.onboarding.done');
 */
const markWalkthroughDone = (storageKey: string): void => {
  try {
    const storage = browserStorage();

    if (storage !== null) {
      storage.setItem(storageKey, 'true');
    }
  } catch {
    // Storage write failures should not block walkthrough navigation.
  }
};

/**
 * Clear a walkthrough completion flag when browser storage is writable.
 *
 * @param storageKey - localStorage key that stores the walkthrough completion flag.
 * @returns Nothing; storage failures are ignored so replay still opens in memory.
 * @example
 * clearWalkthroughDone('web.onboarding.done');
 */
const clearWalkthroughDone = (storageKey: string): void => {
  try {
    const storage = browserStorage();

    if (storage !== null) {
      storage.removeItem(storageKey);
    }
  } catch {
    // Storage write failures should not block walkthrough navigation.
  }
};

/** Options that configure the reusable walkthrough hook. */
export type UseWalkthroughOptions = {
  /** localStorage key that records "this walkthrough is done" so it only auto-opens once. */
  readonly storageKey: string;
  /** Total number of steps, used to complete instead of advancing past the last step. */
  readonly totalSteps: number;
};

/** Reactive state and navigation handlers for a walkthrough UI. */
export type WalkthroughState = {
  readonly active: boolean;
  readonly stepIndex: number;
  readonly next: () => void;
  readonly back: () => void;
  readonly skip: () => void;
  readonly complete: () => void;
  /** Clear the done flag and reopen at step 0 for replay affordances. */
  readonly replay: () => void;
};

/**
 * Run a first-visit walkthrough from a localStorage completion flag.
 *
 * @param options - Walkthrough storage key and bounded step count.
 * @returns The current walkthrough state and navigation handlers.
 * @example
 * const walkthrough = useWalkthrough({ storageKey: 'onboarding.done', totalSteps: steps.length });
 */
export const useWalkthrough = (options: UseWalkthroughOptions): WalkthroughState => {
  const { storageKey, totalSteps } = options;
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isWalkthroughDone(storageKey)) {
      setActive(true);
    }
  }, [storageKey]);

  const complete = useCallback(() => {
    setActive(false);
    markWalkthroughDone(storageKey);
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
    clearWalkthroughDone(storageKey);
    setStepIndex(0);
    setActive(true);
  }, [storageKey]);

  return { active, stepIndex, next, back, skip, complete, replay };
};
