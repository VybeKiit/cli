import { createJsonClient } from '@vybekiit/http/client';
import { APP_URL } from './config';

/** Resolve relative API paths against the configured app origin. */
function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${APP_URL}${url}`;
}

const client = createJsonClient({ resolveUrl: toAbsoluteUrl });

export const getJson = client.getJson;
export const postJson = client.postJson;
