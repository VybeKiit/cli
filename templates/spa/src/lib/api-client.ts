import { createJsonClient } from '@vybekiit/http-client';

/** Backend origin for API calls (Express template default :4000). */
export const APP_URL = import.meta.env.VITE_PUBLIC_APP_URL ?? 'http://localhost:4000';

function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${APP_URL}${url}`;
}

const client = createJsonClient({ resolveUrl: toAbsoluteUrl });

export const getJson = client.getJson;
export const postJson = client.postJson;
