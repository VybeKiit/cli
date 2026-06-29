import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/** Build an MMKV-backed async storage persister for TanStack Query (mobile only). */
export function createMmkvQueryPersister(storage: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}) {
  const asyncStorage = {
    getItem: async (key: string) => storage.getString(key) ?? null,
    setItem: async (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: async (key: string) => {
      storage.delete(key);
    },
  };
  return createAsyncStoragePersister({ storage: asyncStorage });
}
