import { useCallback, useSyncExternalStore } from 'react';

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
};

/**
 * Persist a string preference in localStorage with SSR-safe hydration.
 *
 * @param key - localStorage key to read and write.
 * @param initial - Value to use before storage has a saved value.
 * @returns The current value and a setter that updates localStorage.
 * @example
 * const [tab, setTab] = useStorage('dashboard-tab', 'overview');
 */
export const useStorage = (key: string, initial: string): [string, (value: string) => void] => {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return initial;
    }
    const stored = window.localStorage.getItem(key);
    return stored === null ? initial : stored;
  }, [initial, key]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initial);

  const setValue = useCallback(
    (next: string) => {
      window.localStorage.setItem(key, next);
      window.dispatchEvent(new StorageEvent('storage', { key }));
    },
    [key],
  );

  return [value, setValue];
};
