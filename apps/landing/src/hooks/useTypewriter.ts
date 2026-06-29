'use client';

import { sanitizeTypewriterText } from '@/lib/sanitize-typewriter-text';
import { useReducedMotion } from '@/lib/motion';
import { useEffect, useMemo, useState } from 'react';

export interface UseTypewriterOptions {
  readonly start?: boolean;
  readonly msPerChar?: number;
}

/** Types text at reading pace when `start` is true; skips `.` and `,`. */
export function useTypewriter(text: string, options: UseTypewriterOptions = {}) {
  const { start = false, msPerChar = 48 } = options;
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

    const timer = window.setTimeout(() => {
      setCharIndex((current) => Math.min(current + 1, target.length));
    }, msPerChar);

    return () => window.clearTimeout(timer);
  }, [start, reduced, target, charIndex, msPerChar]);

  const displayText = target.slice(0, charIndex);
  const isComplete = charIndex >= target.length;

  return { displayText, isComplete };
}
