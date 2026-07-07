'use client';

import type { PageContext } from '@vybekiit/assistant-chat/context';
import { useEffect, useState } from 'react';

const readPathname = (): string => {
  if (typeof globalThis.location === 'undefined') {
    return '/';
  }

  return globalThis.location.pathname;
};

const readNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }

  return 0;
};

const readContext = (): PageContext => ({
  route: readPathname(),
  viewportWidth: readNumber(globalThis.innerWidth),
  viewportHeight: readNumber(globalThis.innerHeight),
  scrollY: readNumber(globalThis.scrollY),
});

/**
 * Track the live page snapshot sent with each assistant turn.
 *
 * @returns The current route, viewport, and scroll position.
 * @example
 * const context = usePageContext();
 */
export const usePageContext = (): PageContext => {
  const [context, setContext] = useState<PageContext>(readContext);

  useEffect(() => {
    const update = () => setContext(readContext());
    update();
    globalThis.addEventListener('resize', update);
    globalThis.addEventListener('scroll', update, { passive: true });
    return () => {
      globalThis.removeEventListener('resize', update);
      globalThis.removeEventListener('scroll', update);
    };
  }, []);

  return context;
};
