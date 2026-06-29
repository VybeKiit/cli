import { resolve } from 'node:path';

/** Repo-relative store folder for CWS listing SSOT. */
export const EXTENSION_STORE_REL = '.vybekiit/store/extension';

export type CwsStoreConfig = {
  chromeWebStoreId: string;
  key: string;
  name: string;
  version?: string;
};

export function extensionStoreDir(repoRoot: string): string {
  return resolve(repoRoot, EXTENSION_STORE_REL);
}

export function cwsJsonPath(repoRoot: string): string {
  return resolve(extensionStoreDir(repoRoot), 'cws.json');
}

export function cwsListingPath(repoRoot: string): string {
  return resolve(extensionStoreDir(repoRoot), 'cws-listing.ts');
}

export function lastSyncedAtPath(repoRoot: string): string {
  return resolve(extensionStoreDir(repoRoot), 'last-synced-at.json');
}
