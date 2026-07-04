import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseCwsStoreConfig } from '@vybekiit/browserAutomation/domains/extension/cwsStoreSchema';
import {
  type CwsStoreConfig,
  cwsJsonPath,
} from '@vybekiit/browserAutomation/domains/extension/store';
import type {
  ExtensionConfig,
  VerbContext,
} from '@vybekiit/browserAutomation/domains/extension/types';

export type DiscoverResult = {
  repoRoot: string;
  store: CwsStoreConfig;
};

export { parseCwsStoreConfig } from '@vybekiit/browserAutomation/domains/extension/cwsStoreSchema';

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

/** Build verb context for buyer repos (WXT workspace at repo root). */
export function buildVerbContext(
  discovered: DiscoverResult,
  log?: VerbContext['log'],
): VerbContext {
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
}
