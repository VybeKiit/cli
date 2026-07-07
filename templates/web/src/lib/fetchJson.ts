import { getJson as coreGetJson, postJson as corePostJson } from '@vybekiit/core/http/client';

/**
 * The single place the web template talks to its own API routes.
 * Implementation lives in @vybekiit/core/http/client; this file is the web origin seam.
 *
 * @param path - App-local API path to request.
 * @returns A Result promise containing parsed JSON or a normalized request error.
 * @example
 * const user = await getJson<User>('/api/me');
 */
export const getJson = coreGetJson;

/**
 * POST JSON to one app-local API route.
 *
 * @param path - App-local API path to request.
 * @param body - JSON-serializable request payload.
 * @returns A Result promise containing parsed JSON or a normalized request error.
 * @example
 * const checkout = await postJson<{ url: string }>('/api/checkout', { productId: 'plan_pro' });
 */
export const postJson = corePostJson;
