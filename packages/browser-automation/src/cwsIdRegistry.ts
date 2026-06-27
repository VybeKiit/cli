import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/**
 * In-memory shape of `cws.json`, the deploy-target registry joined by CLI
 * discovery. Keys are extension directory names and values are public Chrome
 * Web Store item IDs.
 */
type CwsIdRegistry = Record<string, string>;

/**
 * Record a freshly-minted Chrome Web Store item ID in the repo-level
 * `cws.json` registry. `createNewItem` calls this after the dev console
 * assigns an ID so the next CLI discovery pass sees the extension as
 * deployable without touching `scripts/cli/catalog.ts`.
 *
 * The write path fails closed on malformed existing registry data and on
 * attempts to replace an existing non-empty ID. A missing `cws.json` is
 * treated as an empty registry so a fresh checkout can recover cleanly.
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

  const cwsJsonPath = resolve(repoRoot, 'config', 'cws.json');
  const registry = await readCwsIdRegistry(cwsJsonPath);
  const currentId = registry[extensionKey];
  if (currentId !== undefined && currentId.length > 0) {
    throw new Error(
      `cws.json already has chromeWebStoreId="${currentId}" for "${extensionKey}". Refusing to overwrite.`,
    );
  }

  registry[extensionKey] = chromeWebStoreId;
  await mkdir(dirname(cwsJsonPath), { recursive: true });
  await writeFile(cwsJsonPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

/** Narrow Node's file-not-found error without exposing fs-specific types. */
function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

/** Coerce parsed JSON into the strict flat string map used by discovery. */
function normalizeRegistryObject(cwsJsonPath: string, parsed: unknown): CwsIdRegistry {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${cwsJsonPath} must be a JSON object mapping extension keys to CWS IDs.`);
  }

  const registry: CwsIdRegistry = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(`${cwsJsonPath} value for "${key}" must be a string.`);
    }
    registry[key] = value;
  }
  return registry;
}

/** Parse the raw registry text and keep JSON syntax failures contextual. */
function parseRegistrySource(cwsJsonPath: string, source: string): unknown {
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Could not parse ${cwsJsonPath} as JSON. Fix it before recording a CWS ID.`, {
      cause: error,
    });
  }
}

/**
 * Read and validate the registry before a write so `recordChromeWebStoreId`
 * never normalizes away malformed deploy-target state.
 */
async function readCwsIdRegistry(cwsJsonPath: string): Promise<CwsIdRegistry> {
  const source = await readRegistrySource(cwsJsonPath);
  const parsed = parseRegistrySource(cwsJsonPath, source);
  return normalizeRegistryObject(cwsJsonPath, parsed);
}

/** Read the registry file, treating a missing file as an empty registry. */
async function readRegistrySource(cwsJsonPath: string): Promise<string> {
  try {
    return await readFile(cwsJsonPath, 'utf8');
  } catch (error) {
    if (isNotFoundError(error)) {
      return '{}';
    }
    throw error;
  }
}

const CHROME_WEB_STORE_ID_PATTERN = /^[a-z0-9]{32}$/;
