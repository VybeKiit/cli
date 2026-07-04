'use client';

import { useEffect, useState } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useReducedMotion } from '@/lib/motion';

/** Slugs that already played the one-time hover typewriter this session. */
const completedSlugs = new Set<string>();

export interface UseFirstHoverTypewriterOptions {
  readonly open: boolean;
  /** When false (e.g. cascade auto-open), show full copy instantly. */
  readonly enabled: boolean;
  readonly msPerChar?: number;
}

/** Types tooltip copy once on first manual hover; instant on later hovers. */
export function useFirstHoverTypewriter(
  slug: string,
  text: string,
  { open, enabled, msPerChar = 68 }: UseFirstHoverTypewriterOptions,
) {
  const reduced = useReducedMotion();
  const [typedOnce, setTypedOnce] = useState(() => completedSlugs.has(slug));

  const shouldType = enabled && open && !typedOnce && !reduced;
  const { displayText, isComplete } = useTypewriter(text, {
    start: shouldType,
    msPerChar,
    humanPace: true,
  });

  useEffect(() => {
    if (isComplete && shouldType) {
      completedSlugs.add(slug);
      setTypedOnce(true);
    }
  }, [isComplete, shouldType, slug]);

  return {
    text: typedOnce || reduced || !enabled ? text : displayText,
    showCursor: shouldType && !isComplete,
  };
}
