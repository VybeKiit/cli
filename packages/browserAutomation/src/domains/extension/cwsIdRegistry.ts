import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { cwsJsonPath, type CwsStoreConfig } from './store';

/**
 * Record a freshly-minted Chrome Web Store item ID in `.vybekiit/store/extension/cws.json`.
 */
export async function recordChromeWebStoreId(
  repoRoot: string,
  extensionKey: string,
  chromeWebStoreId: string,
): Promise<void> {
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
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function readCwsStoreConfig(path: string): Promise<CwsStoreConfig> {
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
}

function parseCwsStoreConfig(parsed: unknown): CwsStoreConfig {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('cws.json must be a JSON object.');
  }
  const o = parsed as Record<string, unknown>;
  return {
    chromeWebStoreId: typeof o.chromeWebStoreId === 'string' ? o.chromeWebStoreId : '',
    key: typeof o.key === 'string' && o.key.length > 0 ? o.key : 'extension',
    name: typeof o.name === 'string' && o.name.length > 0 ? o.name : 'Extension',
    ...(typeof o.version === 'string' ? { version: o.version } : {}),
  };
}

const CHROME_WEB_STORE_ID_PATTERN = /^[a-z0-9]{32}$/;
