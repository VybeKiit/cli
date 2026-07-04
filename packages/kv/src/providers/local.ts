import { ok, type Result } from '@vybekiit/core';
import type { KvProvider } from '@vybekiit/kv/types';

const store = new Map<string, { value: string; expiresAt?: number }>();

export function createLocalKv(): KvProvider {
  return {
    name: 'local',
    async get(key: string): Promise<string | null> {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key: string, value: string, ttlSeconds?: number | undefined): Promise<Result<true>> {
      const expiresAt = ttlSeconds === undefined ? undefined : Date.now() + ttlSeconds * 1000;
      store.set(key, { value, ...(expiresAt === undefined ? {} : { expiresAt }) });
      return ok(true);
    },
    async delete(key: string): Promise<Result<true>> {
      store.delete(key);
      return ok(true);
    },
    async verifyDelivery() {
      return ok(true);
    },
  };
}
