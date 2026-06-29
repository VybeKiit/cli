import { useCallback, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'vybekiit-ui-prefs' });

/** Fast MMKV-backed string preference for mobile UI state. */
export function useStorage(key: string, initial: string): [string, (value: string) => void] {
  const [value, setValue] = useState(() => storage.getString(key) ?? initial);

  useEffect(() => {
    setValue(storage.getString(key) ?? initial);
  }, [initial, key]);

  const setStored = useCallback(
    (next: string) => {
      storage.set(key, next);
      setValue(next);
    },
    [key],
  );

  return [value, setStored];
}
