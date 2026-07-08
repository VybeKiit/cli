import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to the monorepo root from any file under `scripts/`. */
export function repoRootFrom(importMetaUrl) {
  const dir = dirname(fileURLToPath(importMetaUrl));
  const marker = `${sep}scripts${sep}`;
  const scriptsIdx = dir.lastIndexOf(marker);
  if (scriptsIdx === -1) {
    throw new Error(`Expected path under scripts/: ${dir}`);
  }
  return dir.slice(0, scriptsIdx);
}

/** @param {string} importMetaUrl */
export function joinFromRepo(importMetaUrl, ...segments) {
  return join(repoRootFrom(importMetaUrl), ...segments);
}
