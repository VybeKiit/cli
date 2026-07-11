import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseCwsStoreConfig } from '@vybekiit/browser-automation/domains/extension/cwsStoreSchema';
import {
  type CwsStoreConfig,
  cwsJsonPath,
} from '@vybekiit/browser-automation/domains/extension/store';
import type {
  ExtensionConfig,
  VerbContext,
} from '@vybekiit/browser-automation/domains/extension/types';

export type DiscoverResult = {
  readonly repoRoot: string;
  readonly store: CwsStoreConfig;
};

/**
 * Walk up from a directory until the Chrome Web Store config exists.
 *
 * @param startDir - Directory to start searching from.
 * @returns The repo root and parsed store config.
 * @example
 * const discovered = await discoverStore(process.cwd());
 */
export const discoverStore = async (startDir = process.cwd()): Promise<DiscoverResult> => {
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
        throw new Error(`Invalid JSON in ${configPath}`, { cause: err });
      }
      /* ENOENT: walk up */
    }
    dir = dirname(dir);
  }

  throw new Error(
    'Could not find .vybekiit/store/extension/cws.json. Run from a VybeKiit project root or create the store scaffold.',
  );
};

/**
 * Build verb context for buyer repos.
 *
 * @param discovered - Store discovery result from `discoverStore`.
 * @param log - Optional logger passed through to automation verbs.
 * @returns A VerbContext rooted at the discovered buyer repo.
 * @example
 * const ctx = buildVerbContext(discovered, console);
 */
export const buildVerbContext = (
  discovered: DiscoverResult,
  log?: VerbContext['log'],
): VerbContext => {
  const extension: ExtensionConfig = {
    chromeWebStoreId: discovered.store.chromeWebStoreId,
    dir: '.',
    key: discovered.store.key,
    name: discovered.store.name,
    ...(discovered.store.version ? { version: discovered.store.version } : {}),
  };
  return {
    repoRoot: discovered.repoRoot,
    extension,
    ...(log ? { log } : {}),
  };
};
