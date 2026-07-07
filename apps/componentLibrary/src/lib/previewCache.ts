const loadedKeys = new Set<string>();
const listeners = new Map<string, Set<() => void>>();

const notifyKey = (previewKey: string): void => {
  const keyListeners = listeners.get(previewKey);
  if (!keyListeners) {
    return;
  }
  for (const listener of keyListeners) {
    listener();
  }
};

/**
 * Mark preview loaded.
 *
 * @param previewKey - Stable catalog preview key to read or update.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * markPreviewLoaded(entry.previewKey);
 */
export const markPreviewLoaded = (previewKey: string): void => {
  if (loadedKeys.has(previewKey)) {
    return;
  }
  loadedKeys.add(previewKey);
  notifyKey(previewKey);
};

/**
 * Is preview loaded.
 *
 * @param previewKey - Stable catalog preview key to read or update.
 * @returns The value produced by isPreviewLoaded.
 * @example
 * const result = isPreviewLoaded(entry.previewKey);
 */
export const isPreviewLoaded = (previewKey: string): boolean => loadedKeys.has(previewKey);

/**
 * Subscribe preview cache.
 *
 * @param previewKey - Stable catalog preview key to read or update.
 * @param listener - Callback invoked when the subscribed state changes.
 * @returns The value produced by subscribePreviewCache.
 * @example
 * const result = subscribePreviewCache(entry.previewKey, listener);
 */
export const subscribePreviewCache = (previewKey: string, listener: () => void): (() => void) => {
  let bucket = listeners.get(previewKey);
  if (bucket === undefined) {
    bucket = new Set();
    listeners.set(previewKey, bucket);
  }
  bucket.add(listener);
  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) {
      listeners.delete(previewKey);
    }
  };
};
