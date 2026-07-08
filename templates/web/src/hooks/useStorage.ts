import { useCallback, useSyncExternalStore } from 'react';

const subscribe = (onStoreChange: () => void) => {
  globalThis.addEventListener('storage', onStoreChange);
  return () => globalThis.removeEventListener('storage', onStoreChange);
};

/**
 * Persist a string preference in localStorage with SSR-safe hydration.
 *
 * @param key - Stable localStorage key for the preference.
 * @param initial - Value used during SSR and when localStorage has no entry.
 * @returns The current value and a setter that writes localStorage plus notifies subscribers.
 * @example
 * const [view, setView] = useStorage('dashboard:view', 'cards');
 */
export const useStorage = (key: string, initial: string): [string, (value: string) => void] => {
  const getSnapshot = useCallback(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      return initial;
    }
    const stored = globalThis.localStorage.getItem(key);
    if (stored === null) {
      return initial;
    }
    return stored;
  }, [initial, key]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initial);

  const setValue = useCallback(
    (next: string) => {
      globalThis.localStorage.setItem(key, next);
      globalThis.dispatchEvent(new StorageEvent('storage', { key }));
    },
    [key],
  );

  return [value, setValue];
};
