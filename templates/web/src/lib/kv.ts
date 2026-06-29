import { resolveKvProvider } from '@vybekiit/kv';

/** Fast storage wire point */
export function getKv() {
  return resolveKvProvider();
}
