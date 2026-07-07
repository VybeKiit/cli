import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

// "@vybekiit/auth/http" -> true, "./local" -> false
const VYBEKIIT_IMPORT_PATTERN = /^@vybekiit\//;

/** @param {string} specifier @returns {string | undefined} */
const resolveWorkspaceImport = (specifier) => {
  const { compilerOptions } = JSON.parse(readFileSync(join(ROOT, 'tsconfig.base.json'), 'utf8'));
  const { paths } = compilerOptions;

  for (const [pattern, targets] of Object.entries(paths)) {
    const resolved = resolvePatternImport(pattern, targets, specifier);
    if (resolved !== undefined) {
      return resolved;
    }
  }
};

/**
 * @param {string} pattern
 * @param {string[]} targets
 * @param {string} specifier
 * @returns {string | undefined}
 */
const resolvePatternImport = (pattern, targets, specifier) => {
  const starIdx = pattern.indexOf('*');
  if (starIdx === -1) {
    return resolveExactPatternImport(pattern, targets, specifier);
  }
  return resolveStarPatternImport(pattern, targets, specifier, starIdx);
};

/**
 * @param {string} pattern
 * @param {string[]} targets
 * @param {string} specifier
 * @returns {string | undefined}
 */
const resolveExactPatternImport = (pattern, targets, specifier) => {
  const [target] = targets;
  if (target === undefined || specifier !== pattern) {
    return;
  }
  return fileOrIndex(resolve(ROOT, target));
};

/**
 * @param {string} pattern
 * @param {string[]} targets
 * @param {string} specifier
 * @param {number} starIdx
 * @returns {string | undefined}
 */
const resolveStarPatternImport = (pattern, targets, specifier, starIdx) => {
  const [targetPattern] = targets;
  if (targetPattern === undefined) {
    return;
  }

  const prefix = pattern.slice(0, starIdx);
  const suffix = pattern.slice(starIdx + 1);
  const hasMatchingPrefix = specifier.startsWith(prefix);
  const hasMatchingSuffix = suffix.length === 0 || specifier.endsWith(suffix);

  if (!(hasMatchingPrefix && hasMatchingSuffix)) {
    return;
  }

  const captured = specifier.slice(
    prefix.length,
    suffix.length > 0 ? specifier.length - suffix.length : undefined,
  );
  // Swap `*` in tsconfig path: `@vybekiit/auth/*` + `http` -> `packages/auth/src/http`
  const target = targetPattern.replace('*', captured);
  return fileOrIndex(resolve(ROOT, target));
};

/** @param {string} abs @returns {string | undefined} */
const fileOrIndex = (abs) => {
  if (existsSync(abs)) {
    if (statSync(abs).isDirectory()) {
      const indexTs = join(abs, 'index.ts');
      if (existsSync(indexTs)) {
        return indexTs;
      }
    } else {
      return abs;
    }
  }
  if (existsSync(`${abs}.ts`)) {
    return `${abs}.ts`;
  }
  if (abs.endsWith('.js') && existsSync(`${abs.slice(0, -3)}.ts`)) {
    return `${abs.slice(0, -3)}.ts`;
  }
  const indexTs = join(abs, 'index.ts');
  if (existsSync(indexTs)) {
    return indexTs;
  }
};

/** @returns {import('esbuild').Plugin} esbuild plugin so tsup can bundle workspace self-imports. */
export const createWorkspaceAliasPlugin = () => ({
  name: 'vybekiit-workspace-alias',
  setup(build) {
    build.onResolve({ filter: VYBEKIIT_IMPORT_PATTERN }, (args) => {
      const resolved = resolveWorkspaceImport(args.path);
      return resolved === undefined ? undefined : { path: resolved };
    });
  },
});

/** @returns {import('vite').Plugin} Vite/Vitest plugin for workspace self-imports. */
export const createViteWorkspaceAliasPlugin = () => ({
  name: 'vybekiit-workspace-alias',
  enforce: 'pre',
  resolveId(source) {
    if (!source.startsWith('@vybekiit/')) {
      return;
    }
    return resolveWorkspaceImport(source);
  },
});
