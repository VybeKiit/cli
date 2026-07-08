'use client';

import { useEffect, useState } from 'react';

/**
 * Report whether a client component has hydrated in the browser.
 *
 * @returns True after the component's first client-side effect has run.
 * @example
 * const ready = useClientReady();
 */
export const useClientReady = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
};
