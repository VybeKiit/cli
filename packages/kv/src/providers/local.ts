import type { KvProvider } from '@vybekiit/kv/types';
import { Effect } from 'effect';

const store = new Map<string, { value: string; expiresAt?: number }>();

/**
 * Build the in-memory KV provider for local development.
 *
 * @returns KV provider backed by process memory.
 * @example
 * const kv = createLocalKv();
 */
export const createLocalKv = (): KvProvider => ({
  name: 'local',
  get: (key: string) =>
    Effect.sync(() => {
      const entry = store.get(key);
      if (entry === undefined) {
        return null;
      }
      if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
  set: (key: string, value: string, ttlSeconds?: number | undefined) =>
    Effect.sync(() => {
      const expiresAt = ttlSeconds === undefined ? undefined : Date.now() + ttlSeconds * 1000;
      if (expiresAt === undefined) {
        store.set(key, { value });
      } else {
        store.set(key, { value, expiresAt });
      }
      return true as const;
    }),
  delete: (key: string) =>
    Effect.sync(() => {
      store.delete(key);
      return true as const;
    }),
  verifyDelivery: () => Effect.succeed(true as const),
});
