'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '@/lib/motion';
import { sanitizeTypewriterText } from '@/lib/sanitizeTypewriterText';

export interface UseTypewriterOptions {
  readonly start?: boolean;
  readonly msPerChar?: number;
  /** Vary delay slightly between keystrokes for a more human rhythm. */
  readonly humanPace?: boolean;
}

function nextCharDelay(msPerChar: number, humanPace: boolean): number {
  if (!humanPace) {
    return msPerChar;
  }
  return msPerChar + Math.floor(Math.random() * 34) - 10;
}

/** Types text at reading pace when `start` is true; skips `.` and `,`. */
export function useTypewriter(text: string, options: UseTypewriterOptions = {}) {
  const { start = false, msPerChar = 48, humanPace = false } = options;
  const reduced = useReducedMotion();
  const target = useMemo(() => sanitizeTypewriterText(text), [text]);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!start) {
      setCharIndex(0);
      return;
    }
    if (reduced) {
      setCharIndex(target.length);
      return;
    }
    if (charIndex >= target.length) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        setCharIndex((current) => Math.min(current + 1, target.length));
      },
      nextCharDelay(msPerChar, humanPace),
    );

    return () => window.clearTimeout(timer);
  }, [start, reduced, target, charIndex, msPerChar, humanPace]);

  const displayText = target.slice(0, charIndex);
  const isComplete = charIndex >= target.length;

  return { displayText, isComplete };
}
