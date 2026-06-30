'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DESKTOP_MEDIA = '(min-width: 768px)';
const REDUCED_MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

/** Hold each tooltip open during the domino cascade. */
const CASCADE_HOLD_MS = 1500;

/** Pause between cascade steps. */
const CASCADE_STAGGER_MS = 1200;

interface UseVibeHintCascadeResult {
  readonly activeIndex: number | null;
  readonly isRunning: boolean;
  readonly cancelCascade: () => void;
}

/** One-time domino auto-tooltip sequence for hero builder-tool marks (desktop only). */
export function useVibeHintCascade(count: number): UseVibeHintCascadeResult {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const timersRef = useRef<number[]>([]);
  const cancelledRef = useRef(false);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const cancelCascade = useCallback(() => {
    cancelledRef.current = true;
    clearTimers();
    setActiveIndex(null);
    setIsRunning(false);
  }, [clearTimers]);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    clearTimers();

    const desktopMedia = window.matchMedia(DESKTOP_MEDIA);
    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_MEDIA);

    if (!desktopMedia.matches || reducedMotionMedia.matches || count <= 0) {
      return () => {
        clearTimers();
      };
    }

    setIsRunning(true);

    const runStep = (index: number) => {
      if (cancelledRef.current) {
        return;
      }

      setActiveIndex(index);

      schedule(() => {
        if (cancelledRef.current) {
          return;
        }

        setActiveIndex(null);

        const nextIndex = index + 1;
        if (nextIndex >= count) {
          setIsRunning(false);
          return;
        }

        schedule(() => {
          runStep(nextIndex);
        }, CASCADE_STAGGER_MS);
      }, CASCADE_HOLD_MS);
    };

    schedule(() => {
      runStep(0);
    }, 600);

    return () => {
      cancelledRef.current = true;
      clearTimers();
    };
  }, [clearTimers, count, schedule]);

  return {
    activeIndex,
    isRunning,
    cancelCascade,
  };
}
