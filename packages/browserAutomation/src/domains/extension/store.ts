import { resolve } from 'node:path';

/** Repo-relative store folder for CWS listing SSOT. */
export const EXTENSION_STORE_REL = '.vybekiit/store/extension';

export type CwsStoreConfig = {
  readonly chromeWebStoreId: string;
  readonly key: string;
  readonly name: string;
  readonly version?: string;
};

/**
 * Resolve the Chrome Web Store state folder for a repo.
 *
 * @param repoRoot - Absolute repository root.
 * @returns Absolute path to the extension store folder.
 * @example
 * const dir = extensionStoreDir('/repo');
 */
export const extensionStoreDir = (repoRoot: string): string =>
  resolve(repoRoot, EXTENSION_STORE_REL);

/**
 * Resolve the CWS store config JSON path.
 *
 * @param repoRoot - Absolute repository root.
 * @returns Absolute path to `cws.json`.
 * @example
 * const path = cwsJsonPath('/repo');
 */
export const cwsJsonPath = (repoRoot: string): string =>
  resolve(extensionStoreDir(repoRoot), 'cws.json');

/**
 * Resolve the CWS listing source path.
 *
 * @param repoRoot - Absolute repository root.
 * @returns Absolute path to `cws-listing.ts`.
 * @example
 * const path = cwsListingPath('/repo');
 */
export const cwsListingPath = (repoRoot: string): string =>
  resolve(extensionStoreDir(repoRoot), 'cws-listing.ts');

/**
 * Resolve the last-sync marker path.
 *
 * @param repoRoot - Absolute repository root.
 * @returns Absolute path to `last-synced-at.json`.
 * @example
 * const path = lastSyncedAtPath('/repo');
 */
export const lastSyncedAtPath = (repoRoot: string): string =>
  resolve(extensionStoreDir(repoRoot), 'last-synced-at.json');
