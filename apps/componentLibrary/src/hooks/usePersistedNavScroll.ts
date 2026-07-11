'use client';

import { type RefObject, useLayoutEffect, useRef } from 'react';

/**
 * Persist nested-route nav scroll across soft navigations (page remount resets DOM scroll).
 *
 * @param surfaceId - Template surface id used as the storage key namespace.
 * @returns Ref to attach to the scrollable nav element.
 * @example
 * const navRef = usePersistedNavScroll('website-saas');
 */
export const usePersistedNavScroll = (surfaceId: string): RefObject<HTMLElement | null> => {
  const navRef = useRef<HTMLElement>(null);
  const storageKey = `template-surface-nav-scroll:${surfaceId}`;

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }

    const saved = sessionStorage.getItem(storageKey);
    if (saved !== null) {
      const top = Number(saved);
      if (Number.isFinite(top)) {
        nav.scrollTop = top;
      }
    }

    const handleScroll = () => {
      sessionStorage.setItem(storageKey, String(nav.scrollTop));
    };

    nav.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      nav.removeEventListener('scroll', handleScroll);
    };
  }, [storageKey]);

  return navRef;
};
