import type { Result } from '@vybekiit/core';

export type KvProviderName = 'cloudflare' | 'upstash' | 'local';

export interface KvProvider {
  readonly name: KvProviderName;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number | undefined): Promise<Result<true>>;
  delete(key: string): Promise<Result<true>>;
  verifyDelivery(): Promise<Result<true>>;
}
