'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const REDUCED_MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

/** How long each random logo toast stays visible (3s). */
const HOLD_MS = 3000;
/** Quiet gap before the next random logo (slot stays transparent). */
const GAP_MS = 800;
/** First popup after the strip mounts. */
const START_DELAY_MS = 700;

interface UseRandomVibeHintPopupsResult {
  /** Index into the marks list currently auto-shown, or null when idle. */
  readonly activeIndex: number | null;
  readonly isRunning: boolean;
  /** Pause auto-popups (e.g. checkout dialog open). */
  readonly pause: () => void;
  /** Resume auto-popups after a pause. */
  readonly resume: () => void;
}

/**
 * Continuously picks a random mark index and holds the center toast open for
 * HOLD_MS, forever. Does not depend on hover — marquees keep scrolling.
 *
 * @param count - Number of marks in the pool.
 * @returns Active index plus pause/resume controls.
 * @example
 * const { activeIndex, pause, resume } = useRandomVibeHintPopups(marks.length);
 */
export const useRandomVibeHintPopups = (count: number): UseRandomVibeHintPopupsResult => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const timersRef = useRef<number[]>([]);
  const pausedRef = useRef(false);
  const lastIndexRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  const pickNextIndex = useCallback((): number => {
    if (count <= 1) {
      return 0;
    }
    let next = Math.floor(Math.random() * count);
    // Avoid showing the same logo twice in a row when the pool is large enough.
    if (next === lastIndexRef.current) {
      next = (next + 1 + Math.floor(Math.random() * (count - 1))) % count;
    }
    return next;
  }, [count]);

  const runLoop = useCallback(() => {
    if (!mountedRef.current || pausedRef.current || count <= 0) {
      return;
    }

    setIsRunning(true);
    const next = pickNextIndex();
    lastIndexRef.current = next;
    setActiveIndex(next);

    schedule(() => {
      if (!mountedRef.current || pausedRef.current) {
        return;
      }
      setActiveIndex(null);
      schedule(() => {
        runLoop();
      }, GAP_MS);
    }, HOLD_MS);
  }, [count, pickNextIndex, schedule]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    clearTimers();
    setActiveIndex(null);
    setIsRunning(false);
  }, [clearTimers]);

  const resume = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }
    pausedRef.current = false;
    clearTimers();
    schedule(() => {
      runLoop();
    }, GAP_MS);
  }, [clearTimers, runLoop, schedule]);

  useEffect(() => {
    mountedRef.current = true;
    pausedRef.current = false;
    clearTimers();

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_MEDIA);

    if (reducedMotionMedia.matches || count <= 0) {
      return () => {
        mountedRef.current = false;
        clearTimers();
      };
    }

    schedule(() => {
      runLoop();
    }, START_DELAY_MS);

    const onMotionPreferenceChange = () => {
      if (reducedMotionMedia.matches) {
        pause();
        return;
      }
      if (!pausedRef.current) {
        resume();
      }
    };

    reducedMotionMedia.addEventListener('change', onMotionPreferenceChange);

    return () => {
      mountedRef.current = false;
      clearTimers();
      reducedMotionMedia.removeEventListener('change', onMotionPreferenceChange);
    };
  }, [clearTimers, count, pause, resume, runLoop, schedule]);

  return {
    activeIndex,
    isRunning,
    pause,
    resume,
  };
};
