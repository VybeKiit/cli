'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fires once when element enters viewport; stays true for the rest of the page load.
 *
 * @param threshold - Input value.
 * @returns The hook result.
 * @example
 * const value = useInViewOnce(threshold);
 */

export const useInViewOnce = (threshold = 0.2) => {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
};
