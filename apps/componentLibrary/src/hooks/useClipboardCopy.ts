'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Read clipboard copy state for the component library.
 *
 * @param resetMs - Input passed to this resetMs parameter.
 * @returns The state or callback exposed by useClipboardCopy.
 * @example
 * const value = useClipboardCopy(resetMs);
 */
export const useClipboardCopy = (resetMs = 2000) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs],
  );

  return { copy, copied };
};
