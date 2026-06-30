import { useCallback, useSyncExternalStore } from 'react';

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

/**
 * Persist a string preference in localStorage with SSR-safe hydration.
 */
export function useStorage(key: string, initial: string): [string, (value: string) => void] {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return initial;
    return window.localStorage.getItem(key) ?? initial;
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
}
