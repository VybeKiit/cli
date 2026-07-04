'use client';

import { isPreviewLoaded, subscribePreviewCache } from '@library/lib/previewCache';
import { useEffect, useState } from 'react';

/** Reactive hook — true once an embed iframe for this previewKey has loaded once. */
export function usePreviewLoaded(previewKey: string): boolean {
  const [loaded, setLoaded] = useState(() => isPreviewLoaded(previewKey));

  useEffect(() => {
    setLoaded(isPreviewLoaded(previewKey));
    return subscribePreviewCache(previewKey, () => {
      setLoaded(isPreviewLoaded(previewKey));
    });
  }, [previewKey]);

  return loaded;
}
