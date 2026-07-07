import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/** Minimal MMKV storage surface used by the mobile query persister. */
export type MmkvQueryStorage = {
  readonly delete: (key: string) => void;
  readonly getString: (key: string) => string | undefined;
  readonly set: (key: string, value: string) => void;
};

/**
 * Build an MMKV-backed async storage persister for TanStack Query.
 *
 * @param storage - MMKV-compatible storage implementation.
 * @returns TanStack Query async-storage persister for mobile.
 * @example
 * const persister = createMmkvQueryPersister(storage);
 */
export const createMmkvQueryPersister = (
  storage: MmkvQueryStorage,
): ReturnType<typeof createAsyncStoragePersister> => {
  const asyncStorage = {
    getItem: (key: string) => {
      const value = storage.getString(key);
      if (value === undefined) {
        return Promise.resolve(null);
      }
      return Promise.resolve(value);
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      storage.delete(key);
      return Promise.resolve();
    },
  };
  return createAsyncStoragePersister({ storage: asyncStorage });
};
