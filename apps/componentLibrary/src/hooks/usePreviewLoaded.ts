'use client';

import { isPreviewLoaded, subscribePreviewCache } from '@library/lib/previewCache';
import { useEffect, useState } from 'react';

/**
 * Read preview loaded state for the component library.
 *
 * @param previewKey - Stable catalog preview key to read or update.
 * @returns The state or callback exposed by usePreviewLoaded.
 * @example
 * const value = usePreviewLoaded(entry.previewKey);
 */
export const usePreviewLoaded = (previewKey: string): boolean => {
  const [loaded, setLoaded] = useState(() => isPreviewLoaded(previewKey));

  useEffect(() => {
    setLoaded(isPreviewLoaded(previewKey));
    return subscribePreviewCache(previewKey, () => {
      setLoaded(isPreviewLoaded(previewKey));
    });
  }, [previewKey]);

  return loaded;
};
