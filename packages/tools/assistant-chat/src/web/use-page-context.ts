'use client';

import { useEffect, useState } from 'react';
import type { PageContext } from '../context';

function readContext(): PageContext {
  return {
    route: globalThis.location?.pathname ?? '/',
    viewportWidth: globalThis.innerWidth ?? 0,
    viewportHeight: globalThis.innerHeight ?? 0,
    scrollY: globalThis.scrollY ?? 0,
  };
}

/** Live page snapshot (route/viewport/scroll) the assistant is told about each turn. */
export function usePageContext(): PageContext {
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
}
