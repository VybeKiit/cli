import { DEFAULT_APP_URL } from '@vybekiit/core';
import { createJsonClient } from '@vybekiit/core/http/client';

const configuredAppUrl = import.meta.env.WXT_PUBLIC_APP_URL;
const APP_URL =
  configuredAppUrl === undefined || configuredAppUrl.length === 0
    ? DEFAULT_APP_URL
    : configuredAppUrl;

/**
 * Resolve relative API paths against the configured app origin.
 *
 * @param url - Absolute URL or app-relative API path.
 * @returns A URL string safe to pass to `fetch`.
 * @example
 * const url = toAbsoluteUrl('/api/auth/me');
 */
const toAbsoluteUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${APP_URL}${url}`;
};

const client = createJsonClient({ resolveUrl: toAbsoluteUrl });
const { getJson: clientGetJson, postJson: clientPostJson } = client;

/**
 * Fetch JSON from one extension API endpoint.
 *
 * @param path - Absolute URL or app-relative API path to request.
 * @returns A Result promise containing parsed JSON or a normalized request error.
 * @example
 * const user = await getJson<User>('/api/auth/me');
 */
export const getJson = <T>(path: string) => clientGetJson<T>(path);

/**
 * POST JSON to one extension API endpoint.
 *
 * @param path - Absolute URL or app-relative API path to request.
 * @param body - JSON-serializable request payload.
 * @returns A Result promise containing parsed JSON or a normalized request error.
 * @example
 * const checkout = await postJson<{ url: string }>('/api/checkout', { productId: 'plan_pro' });
 */
export const postJson = <T>(path: string, body: unknown) => clientPostJson<T>(path, body);
