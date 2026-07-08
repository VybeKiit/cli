import { createJsonClient } from '@vybekiit/core/http/client';
import { runtimeConfig } from '@/lib/runtimeConfig';

/** Backend origin for API calls (Express template default :4000). */
export const APP_URL = runtimeConfig.APP_URL;

const toAbsoluteUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${APP_URL}${url}`;
};

const client = createJsonClient({ resolveUrl: toAbsoluteUrl });

/**
 * Fetch typed JSON from the SPA backend with GET.
 *
 * @param url - Relative backend path or absolute URL.
 * @returns A Result containing decoded JSON or a normalized HTTP failure.
 * @example
 * const result = await getJson<{ id: string }>('/api/auth/me');
 */
export const getJson = <T>(url: string) => client.getJson<T>(url);

/**
 * Send typed JSON to the SPA backend with POST.
 *
 * @param url - Relative backend path or absolute URL.
 * @param body - JSON-serializable request payload.
 * @returns A Result containing decoded JSON or a normalized HTTP failure.
 * @example
 * const result = await postJson<{ id: string }>('/api/auth/sign-in', payload);
 */
export const postJson = <T>(url: string, body: unknown) => client.postJson<T>(url, body);
