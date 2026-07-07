import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Detect whether the viewport is below the mobile breakpoint.
 *
 * @returns True when the browser width is below the mobile breakpoint.
 * @example
 * const isMobile = useIsMobile();
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(globalThis.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(globalThis.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return Boolean(isMobile);
};
