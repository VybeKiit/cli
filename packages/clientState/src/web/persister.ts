import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * Build a localStorage-backed persister for TanStack Query.
 *
 * @param storage - Browser storage implementation for web, extension, or SPA surfaces.
 * @returns TanStack Query async-storage persister.
 * @example
 * const persister = createWebQueryPersister(globalThis.localStorage);
 */
export const createWebQueryPersister = (
  storage: Storage = globalThis.localStorage,
): ReturnType<typeof createAsyncStoragePersister> => {
  const asyncStorage = {
    getItem: (key: string) => Promise.resolve(storage.getItem(key)),
    setItem: (key: string, value: string) => {
      storage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      storage.removeItem(key);
      return Promise.resolve();
    },
  };
  return createAsyncStoragePersister({ storage: asyncStorage });
};
