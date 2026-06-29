import {
  type CloudflareConfig,
  type CloudflareKvConfig,
  fail,
  ok,
  type Result,
} from '@vybekiit/core';
import type { KvProvider } from '../types';

/**
 * Cloudflare KV via REST API — used when namespace id is configured.
 * Doctor provisions bindings; this adapter reads/writes via account API.
 */
export function createCloudflareKv(cf: CloudflareConfig, kv: CloudflareKvConfig): KvProvider {
  const namespaceId = kv.CLOUDFLARE_KV_NAMESPACE_ID;
  const base = `https://api.cloudflare.com/client/v4/accounts/${cf.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId ?? 'default'}/values`;

  return {
    name: 'cloudflare',
    async get(key: string): Promise<string | null> {
      if (!namespaceId) return null;
      const res = await fetch(`${base}/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${cf.CLOUDFLARE_API_TOKEN}` },
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return await res.text();
    },
    async set(key: string, value: string, ttlSeconds?: number | undefined): Promise<Result<true>> {
      if (!namespaceId) {
        return fail('kv_not_configured', 'CLOUDFLARE_KV_NAMESPACE_ID is required');
      }
      const url = new URL(`${base}/${encodeURIComponent(key)}`);
      if (ttlSeconds !== undefined) url.searchParams.set('expiration_ttl', String(ttlSeconds));
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cf.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'text/plain',
        },
        body: value,
      });
      if (!res.ok) return fail('kv_write_failed', `Cloudflare KV returned ${res.status}`);
      return ok(true);
    },
    async delete(key: string): Promise<Result<true>> {
      if (!namespaceId) {
        return fail('kv_not_configured', 'CLOUDFLARE_KV_NAMESPACE_ID is required');
      }
      const res = await fetch(`${base}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cf.CLOUDFLARE_API_TOKEN}` },
      });
      if (!res.ok && res.status !== 404) {
        return fail('kv_delete_failed', `Cloudflare KV returned ${res.status}`);
      }
      return ok(true);
    },
    async verifyDelivery() {
      if (!namespaceId) {
        return fail('kv_not_configured', 'CLOUDFLARE_KV_NAMESPACE_ID is required');
      }
      return ok(true);
    },
  };
}
