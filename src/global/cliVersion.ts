import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Read the CLI package version from the nearest package.json.
 *
 * Works for both source (`cli/src/global`) and the published bundle (`cli/dist`).
 *
 * @returns Semver string, or `0.0.0` when package.json is unreadable.
 * @example
 * const version = await readCliVersion(); // '0.6.1'
 */
export const readCliVersion = async (): Promise<string> => {
  const candidates = [
    // Published layout: dist/*.js → cli/package.json
    join(MODULE_DIR, '..', 'package.json'),
    // Source layout: src/global/*.ts → cli/package.json
    join(MODULE_DIR, '..', '..', 'package.json'),
  ];
  for (const candidate of candidates) {
    try {
      const raw = await readFile(candidate, 'utf8');
      const parsed = JSON.parse(raw) as { readonly version?: string };
      if (parsed.version !== undefined && parsed.version !== '') {
        return parsed.version;
      }
    } catch {
      // try next candidate
    }
  }
  return '0.0.0';
};
