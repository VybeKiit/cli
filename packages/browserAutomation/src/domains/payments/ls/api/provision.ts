import { randomBytes } from 'node:crypto';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

type JsonApiResource<T extends string, A> = {
  readonly data: {
    readonly attributes: A;
    readonly id?: string;
    readonly relationships?: Record<string, unknown>;
    readonly type: T;
  };
};

type LsApiErrorBody = {
  readonly errors?: readonly { readonly detail?: string }[];
};

type LsApiWebhookResponse = {
  readonly data: {
    readonly attributes: { readonly secret: string; readonly url: string };
    readonly id: string;
  };
};

type LsApiVariantListResponse = {
  readonly data: readonly {
    readonly attributes: { readonly product_id: number };
    readonly id: string;
  }[];
};

export type CreateWebhookViaApiParams = {
  readonly apiKey: string;
  readonly events?: readonly string[];
  readonly storeId: string;
  readonly testMode?: boolean;
  readonly url: string;
};

/**
 * Read a JSON response body without hiding malformed successful responses.
 *
 * @param response - Fetch response to decode.
 * @returns Parsed JSON, or an empty object for a non-JSON error response.
 * @example
 * const body = await readJsonBody(response);
 */
const readJsonBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {};
    }
    throw error;
  }
};

/**
 * Read the first Lemon Squeezy API error message.
 *
 * @param body - Parsed API error response body.
 * @param statusText - HTTP status text to use when the API sent no detail.
 * @returns Human-readable API error detail.
 * @example
 * const detail = readLsApiErrorDetail({ errors: [{ detail: 'Bad token' }] }, 'Unauthorized');
 */
const readLsApiErrorDetail = (body: LsApiErrorBody, statusText: string): string => {
  const { errors } = body;
  if (errors === undefined) {
    return statusText;
  }

  const [firstError] = errors;
  if (firstError === undefined || firstError.detail === undefined) {
    return statusText;
  }

  return firstError.detail;
};

/**
 * Call the Lemon Squeezy JSON API with the required headers.
 *
 * @param apiKey - Lemon Squeezy API key.
 * @param path - API path beginning with a slash.
 * @param init - Fetch options to merge into the request.
 * @returns Parsed API response body.
 * @example
 * const body = await lsApiFetch<{ data: unknown }>(apiKey, '/variants');
 */
const lsApiFetch = async <T>(apiKey: string, path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/vnd.api+json');
  headers.set('Content-Type', 'application/vnd.api+json');
  headers.set('Authorization', `Bearer ${apiKey}`);

  const response = await fetch(`${LS_API_BASE}${path}`, {
    ...init,
    headers,
  });

  const body = await readJsonBody(response);
  if (!response.ok) {
    const detail = readLsApiErrorDetail(body as LsApiErrorBody, response.statusText);
    throw new Error(`Lemon Squeezy API ${path}: ${detail}`);
  }

  return body as T;
};

export type LsApiWebhookResult = {
  readonly id: string;
  readonly secret: string;
  readonly url: string;
};

/**
 * Generate the signing secret required when creating a Lemon Squeezy webhook.
 *
 * @returns A 32-character hex webhook secret.
 * @example
 * const secret = generateWebhookSecret();
 */
const generateWebhookSecret = (): string => randomBytes(16).toString('hex');

/**
 * Create a webhook through the Lemon Squeezy REST API.
 *
 * @param params - API key, store id, URL, event list, and mode.
 * @returns Created webhook id, signing secret, and URL.
 * @example
 * const webhook = await createWebhookViaApi({ apiKey, storeId: '123', url: 'https://app.test/webhooks/ls' });
 */
export const createWebhookViaApi = async (
  params: CreateWebhookViaApiParams,
): Promise<LsApiWebhookResult> => {
  const { apiKey, storeId, url } = params;
  const events = params.events === undefined ? ['order_created'] : params.events;
  const testMode = params.testMode === undefined ? true : params.testMode;
  const secret = generateWebhookSecret();
  const payload: JsonApiResource<
    'webhooks',
    {
      readonly events: readonly string[];
      readonly secret: string;
      readonly test_mode: boolean;
      readonly url: string;
    }
  > = {
    data: {
      type: 'webhooks',
      attributes: { url, events, test_mode: testMode, secret },
      relationships: {
        store: { data: { type: 'stores', id: storeId } },
      },
    },
  };

  const response = await lsApiFetch<LsApiWebhookResponse>(apiKey, '/webhooks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: response.data.id,
    secret,
    url: response.data.attributes.url,
  };
};

export type LsApiVariantLookup = {
  readonly productId: string;
  readonly variantId: string;
};

/**
 * List the first variant for a Lemon Squeezy product.
 *
 * @param apiKey - Lemon Squeezy API key with store access.
 * @param productId - Lemon Squeezy product id created by browser automation.
 * @returns Product and variant ids when the API returns a variant.
 * @example
 * const variant = await listVariantsForProduct(apiKey, '456');
 */
export const listVariantsForProduct = async (
  apiKey: string,
  productId: string,
): Promise<LsApiVariantLookup | null> => {
  const response = await lsApiFetch<LsApiVariantListResponse>(
    apiKey,
    `/variants?filter[product_id]=${productId}`,
  );

  const [first] = response.data;
  if (first === undefined) {
    return null;
  }

  return { productId, variantId: first.id };
};
