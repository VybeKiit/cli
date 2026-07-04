const loadedKeys = new Set<string>();
const listeners = new Map<string, Set<() => void>>();

function notifyKey(previewKey: string): void {
  const keyListeners = listeners.get(previewKey);
  if (!keyListeners) {
    return;
  }
  for (const listener of keyListeners) {
    listener();
  }
}

/** Mark a preview iframe as compiled and ready — skips spinner on revisit. */
export function markPreviewLoaded(previewKey: string): void {
  if (loadedKeys.has(previewKey)) {
    return;
  }
  loadedKeys.add(previewKey);
  notifyKey(previewKey);
}

export function isPreviewLoaded(previewKey: string): boolean {
  return loadedKeys.has(previewKey);
}

export function subscribePreviewCache(previewKey: string, listener: () => void): () => void {
  const bucket = listeners.get(previewKey) ?? new Set();
  bucket.add(listener);
  listeners.set(previewKey, bucket);
  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) {
      listeners.delete(previewKey);
    }
  };
}
