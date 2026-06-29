import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { ExtensionConfig, VerbContext } from '../domains/extension/types';
import { cwsJsonPath, type CwsStoreConfig } from '../domains/extension/store';

export type DiscoverResult = {
  repoRoot: string;
  store: CwsStoreConfig;
};

/** Walk up from startDir until `.vybekiit/store/extension/cws.json` exists. */
export async function discoverStore(startDir = process.cwd()): Promise<DiscoverResult> {
  let dir = resolve(startDir);
  const root = resolve('/');

  while (dir !== root) {
    const configPath = cwsJsonPath(dir);
    try {
      const raw = await readFile(configPath, 'utf8');
      const store = parseCwsStoreConfig(JSON.parse(raw));
      return { repoRoot: dir, store };
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${configPath}`);
      }
      /* ENOENT — walk up */
    }
    dir = dirname(dir);
  }

  throw new Error(
    'Could not find .vybekiit/store/extension/cws.json. Run from a VybeKiit project root or create the store scaffold.',
  );
}

export function parseCwsStoreConfig(parsed: unknown): CwsStoreConfig {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('cws.json must be a JSON object.');
  }
  const o = parsed as Record<string, unknown>;
  const chromeWebStoreId = typeof o.chromeWebStoreId === 'string' ? o.chromeWebStoreId : '';
  const key = typeof o.key === 'string' && o.key.length > 0 ? o.key : 'extension';
  const name = typeof o.name === 'string' && o.name.length > 0 ? o.name : 'Extension';
  const version = typeof o.version === 'string' ? o.version : undefined;
  const config: CwsStoreConfig = { chromeWebStoreId, key, name };
  if (version !== undefined) config.version = version;
  return config;
}

/** Build verb context for buyer repos (WXT workspace at repo root). */
export function buildVerbContext(discovered: DiscoverResult, log?: VerbContext['log']): VerbContext {
  const extension: ExtensionConfig = {
    chromeWebStoreId: discovered.store.chromeWebStoreId,
    dir: '.',
    key: discovered.store.key,
    name: discovered.store.name,
  };
  if (log) return { extension, repoRoot: discovered.repoRoot, log };
  return { extension, repoRoot: discovered.repoRoot };
}
