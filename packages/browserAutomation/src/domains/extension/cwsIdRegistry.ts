import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { parseCwsStoreConfig } from './cwsStoreSchema';
import { type CwsStoreConfig, cwsJsonPath } from './store';

// Chrome Web Store item id: "abcdefghijklmnopqrstuvwxzy123456" -> match
const CHROME_WEB_STORE_ID_PATTERN = /^[a-z0-9]{32}$/;

/**
 * Record a freshly-minted Chrome Web Store item ID in `.vybekiit/store/extension/cws.json`.
 *
 * @param repoRoot - Absolute repository root.
 * @param extensionKey - Stable extension key recorded in the store file.
 * @param chromeWebStoreId - CWS item id to persist.
 * @returns A promise that resolves after `cws.json` is written.
 * @example
 * await recordChromeWebStoreId('/repo', 'extension', 'abcdefghijklmnopqrstuvwxzy123456');
 */
export const recordChromeWebStoreId = async (
  repoRoot: string,
  extensionKey: string,
  chromeWebStoreId: string,
): Promise<void> => {
  if (extensionKey.length === 0) {
    throw new Error('Cannot record a Chrome Web Store ID for an empty extension key.');
  }
  if (!CHROME_WEB_STORE_ID_PATTERN.test(chromeWebStoreId)) {
    throw new Error(
      `Chrome Web Store ID for "${extensionKey}" must be a 32-character lowercase item ID.`,
    );
  }

  const path = cwsJsonPath(repoRoot);
  const config = await readCwsStoreConfig(path);
  if (config.chromeWebStoreId.length > 0) {
    throw new Error(
      `cws.json already has chromeWebStoreId="${config.chromeWebStoreId}". Refusing to overwrite.`,
    );
  }

  const next: CwsStoreConfig = {
    ...config,
    chromeWebStoreId,
    key: extensionKey,
    name: config.name === 'Extension' ? extensionKey : config.name,
  };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
};

/**
 * Check whether an unknown error is Node's not-found file error.
 *
 * @param error - Unknown value caught from filesystem IO.
 * @returns True when the error has `code: "ENOENT"`.
 * @example
 * const missing = isNotFoundError(error);
 */
const isNotFoundError = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT';

/**
 * Read the CWS store config, creating the in-memory scaffold default when absent.
 *
 * @param path - Absolute path to `cws.json`.
 * @returns The parsed or scaffold-default store config.
 * @example
 * const config = await readCwsStoreConfig('/repo/.vybekiit/store/extension/cws.json');
 */
const readCwsStoreConfig = async (path: string): Promise<CwsStoreConfig> => {
  try {
    const raw = await readFile(path, 'utf8');
    return parseCwsStoreConfig(JSON.parse(raw));
  } catch (error) {
    if (isNotFoundError(error)) {
      return { chromeWebStoreId: '', key: 'extension', name: 'Extension' };
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Could not parse ${path} as JSON. Fix it before recording a CWS ID.`, {
        cause: error,
      });
    }
    throw error;
  }
};
