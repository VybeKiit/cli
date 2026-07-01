import { randomBytes } from 'node:crypto';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

type JsonApiResource<T extends string, A> = {
  data: { type: T; id?: string; attributes: A; relationships?: Record<string, unknown> };
};

async function lsApiFetch<T>(apiKey: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${LS_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { errors?: { detail?: string }[] };
  if (!res.ok) {
    const detail = body.errors?.[0]?.detail ?? res.statusText;
    throw new Error(`Lemon Squeezy API ${path}: ${detail}`);
  }
  return body as T;
}

export type LsApiWebhookResult = {
  id: string;
  secret: string;
  url: string;
};

/** LS requires the caller to supply a signing secret (6–40 chars); it is not returned by the API. */
function generateWebhookSecret(): string {
  return randomBytes(16).toString('hex');
}

/** Create a webhook via LS REST API (requires an existing API key). */
export async function createWebhookViaApi(
  apiKey: string,
  storeId: string,
  url: string,
  events: string[] = ['order_created'],
  testMode = true,
): Promise<LsApiWebhookResult> {
  const secret = generateWebhookSecret();
  const payload: JsonApiResource<
    'webhooks',
    { url: string; events: string[]; test_mode: boolean; secret: string }
  > = {
    data: {
      type: 'webhooks',
      attributes: { url, events, test_mode: testMode, secret },
      relationships: {
        store: { data: { type: 'stores', id: storeId } },
      },
    },
  };

  const res = await lsApiFetch<{
    data: { id: string; attributes: { url: string; secret: string } };
  }>(apiKey, '/webhooks', { method: 'POST', body: JSON.stringify(payload) });

  return {
    id: res.data.id,
    secret,
    url: res.data.attributes.url,
  };
}

export type LsApiVariantLookup = {
  productId: string;
  variantId: string;
};

/** List variants for a store product (after browser create). */
export async function listVariantsForProduct(
  apiKey: string,
  productId: string,
): Promise<LsApiVariantLookup | null> {
  const res = await lsApiFetch<{
    data: { id: string; attributes: { product_id: number } }[];
  }>(apiKey, `/variants?filter[product_id]=${productId}`);

  const first = res.data[0];
  if (!first) return null;
  return { productId, variantId: first.id };
}
