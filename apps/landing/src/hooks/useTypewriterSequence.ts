'use client';

import { useTypewriter } from '@/hooks/useTypewriter';
import { useReducedMotion } from '@/lib/motion';
import { sanitizeTypewriterText } from '@/lib/sanitizeTypewriterText';
import { useEffect, useState } from 'react';

export interface UseTypewriterSequenceOptions {
  readonly start?: boolean;
  readonly msPerChar?: number;
  readonly pauseAfterLineMs?: number;
}

/** Types each line sequentially; line N+1 starts after line N completes. */
export function useTypewriterSequence(
  lines: readonly string[],
  options: UseTypewriterSequenceOptions = {},
) {
  const { start = false, msPerChar = 48, pauseAfterLineMs = 0 } = options;
  const reduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [splashingIndex, setSplashingIndex] = useState<number | null>(null);

  const activeLine = lines[activeIndex] ?? '';
  const typingActive = start && !reduced && activeIndex < lines.length;
  const { displayText, isComplete } = useTypewriter(activeLine, {
    start: typingActive,
    msPerChar,
  });

  useEffect(() => {
    if (!start) {
      setActiveIndex(0);
      setSplashingIndex(null);
    }
  }, [start]);

  useEffect(() => {
    if (!(typingActive && isComplete)) {
      return;
    }

    if (pauseAfterLineMs > 0) {
      setSplashingIndex(activeIndex);
      const id = window.setTimeout(() => {
        setSplashingIndex(null);
        if (activeIndex < lines.length - 1) {
          setActiveIndex((index) => index + 1);
        }
      }, pauseAfterLineMs);
      return () => window.clearTimeout(id);
    }

    if (activeIndex < lines.length - 1) {
      setActiveIndex((index) => index + 1);
    }
    return () => {
      /* no-op */
    };
  }, [typingActive, isComplete, activeIndex, lines.length, pauseAfterLineMs]);

  const displayLines = lines.map((line, index) => {
    if (reduced && start) {
      return sanitizeTypewriterText(line);
    }
    if (index < activeIndex) {
      return sanitizeTypewriterText(line);
    }
    if (index === activeIndex) {
      return displayText;
    }
    return '';
  });

  const sequenceComplete = start && (reduced || (activeIndex === lines.length - 1 && isComplete));

  return { displayLines, activeIndex, isComplete: sequenceComplete, splashingIndex };
}
