import { useCallback, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'vybekiit-ui-prefs' });

/**
 * Read a stored value or use the explicit initial value.
 *
 * @param key - MMKV key to read.
 * @param initial - Value used when the key has not been written.
 * @returns Stored value or the provided initial value.
 * @example
 * const value = readStoredValue('dashboard:view', 'cards');
 */
const readStoredValue = (key: string, initial: string): string => {
  const stored = storage.getString(key);
  return stored === undefined ? initial : stored;
};

/**
 * Persist a string preference in MMKV for mobile UI state.
 *
 * @param key - Stable MMKV key for the preference.
 * @param initial - Value used when MMKV has no entry.
 * @returns The current value and a setter that writes MMKV.
 * @example
 * const [view, setView] = useStorage('dashboard:view', 'cards');
 */
export const useStorage = (key: string, initial: string): [string, (value: string) => void] => {
  const [value, setValue] = useState(() => readStoredValue(key, initial));

  useEffect(() => {
    setValue(readStoredValue(key, initial));
  }, [initial, key]);

  const setStored = useCallback(
    (next: string) => {
      storage.set(key, next);
      setValue(next);
    },
    [key],
  );

  return [value, setStored];
};
