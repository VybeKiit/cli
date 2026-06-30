import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/** Build a localStorage-backed persister for TanStack Query (web/extension/spa). */
export function createWebQueryPersister(
  storage: Storage = globalThis.localStorage,
): ReturnType<typeof createAsyncStoragePersister> {
  const asyncStorage = {
    getItem: async (key: string) => storage.getItem(key),
    setItem: async (key: string, value: string) => {
      storage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      storage.removeItem(key);
    },
  };
  return createAsyncStoragePersister({ storage: asyncStorage });
}
