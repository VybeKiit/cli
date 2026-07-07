'use client';

/**
 * Resolve browser localStorage when it is available and readable.
 *
 * @returns Browser localStorage, or `null` during SSR/private-mode failures.
 * @example
 * const storage = resolveBrowserStorage();
 */
export const resolveBrowserStorage = (): Storage | null => {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};
