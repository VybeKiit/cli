import type { KvCloudflareConfigType } from '@vybekiit/infra/kv/config';
import { KvError, type KvProvider } from '@vybekiit/infra/kv/types';
import { Effect } from 'effect';

type CloudflareKvRuntime = {
  readonly namespaceId: string | undefined;
  readonly token: string;
  readonly valueUrl: (key: string) => string;
};

const cloudflareKvErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const missingNamespaceError = (): KvError =>
  new KvError({
    code: 'KV_CONFIG_INVALID',
    message: 'CLOUDFLARE_KV_NAMESPACE_ID is required',
  });

const responseError = (
  code: 'KV_READ_FAILED' | 'KV_WRITE_FAILED' | 'KV_DELETE_FAILED',
  status: number,
): KvError => new KvError({ code, message: `Cloudflare KV returned ${status}` });

const requestError = (
  code: 'KV_READ_FAILED' | 'KV_WRITE_FAILED' | 'KV_DELETE_FAILED',
  caught: unknown,
): KvError => new KvError({ code, message: cloudflareKvErrorMessage(caught) });

const fetchCloudflareKv = (
  runtime: CloudflareKvRuntime,
  input: string | URL,
  init?: RequestInit,
): Effect.Effect<Response, KvError> =>
  Effect.tryPromise({
    try: () =>
      fetch(input, {
        ...init,
        headers: {
          Authorization: `Bearer ${runtime.token}`,
          ...init?.headers,
        },
      }),
    catch: (caught) => requestError('KV_READ_FAILED', caught),
  });

const readValue = (
  runtime: CloudflareKvRuntime,
  key: string,
): Effect.Effect<string | null, KvError> => {
  if (runtime.namespaceId === undefined) {
    return Effect.fail(missingNamespaceError());
  }

  return fetchCloudflareKv(runtime, runtime.valueUrl(key)).pipe(
    Effect.flatMap((res) => {
      if (res.status === 404) {
        return Effect.succeed(null);
      }
      if (res.ok === false) {
        return Effect.fail(responseError('KV_READ_FAILED', res.status));
      }
      return Effect.tryPromise({
        try: () => res.text(),
        catch: (caught) => requestError('KV_READ_FAILED', caught),
      });
    }),
  );
};

const writeValue = (
  runtime: CloudflareKvRuntime,
  key: string,
  value: string,
  ttlSeconds?: number | undefined,
): Effect.Effect<true, KvError> => {
  if (runtime.namespaceId === undefined) {
    return Effect.fail(missingNamespaceError());
  }

  const url = new URL(runtime.valueUrl(key));
  if (ttlSeconds !== undefined) {
    url.searchParams.set('expiration_ttl', String(ttlSeconds));
  }

  return fetchCloudflareKv(runtime, url, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: value,
  }).pipe(
    Effect.mapError((error) => new KvError({ code: 'KV_WRITE_FAILED', message: error.message })),
    Effect.flatMap((res) => {
      if (res.ok === false) {
        return Effect.fail(responseError('KV_WRITE_FAILED', res.status));
      }
      return Effect.succeed(true as const);
    }),
  );
};

const deleteValue = (runtime: CloudflareKvRuntime, key: string): Effect.Effect<true, KvError> => {
  if (runtime.namespaceId === undefined) {
    return Effect.fail(missingNamespaceError());
  }

  return fetchCloudflareKv(runtime, runtime.valueUrl(key), { method: 'DELETE' }).pipe(
    Effect.mapError((error) => new KvError({ code: 'KV_DELETE_FAILED', message: error.message })),
    Effect.flatMap((res) => {
      if (res.ok === false && res.status !== 404) {
        return Effect.fail(responseError('KV_DELETE_FAILED', res.status));
      }
      return Effect.succeed(true as const);
    }),
  );
};

const verifyNamespace = (runtime: CloudflareKvRuntime): Effect.Effect<true, KvError> => {
  if (runtime.namespaceId === undefined) {
    return Effect.fail(missingNamespaceError());
  }

  return Effect.succeed(true as const);
};

/**
 * Cloudflare KV via REST API — used when namespace id is configured.
 * Doctor provisions bindings; this adapter reads/writes via account API.
 *
 * @param config - Cloudflare account and KV namespace config.
 * @returns KV provider backed by Cloudflare KV.
 * @example
 * const provider = createCloudflareKv(cloudflareKvConfig);
 */
export const createCloudflareKv = (config: KvCloudflareConfigType): KvProvider => {
  const runtime: CloudflareKvRuntime = {
    namespaceId: config.CLOUDFLARE_KV_NAMESPACE_ID,
    token: config.CLOUDFLARE_API_TOKEN,
    valueUrl: (key: string): string =>
      `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${config.CLOUDFLARE_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
  };

  return {
    name: 'cloudflare',
    get: (key: string) => readValue(runtime, key),
    set: (key: string, value: string, ttlSeconds?: number | undefined) =>
      writeValue(runtime, key, value, ttlSeconds),
    delete: (key: string) => deleteValue(runtime, key),
    verifyDelivery: () => verifyNamespace(runtime),
  };
};
