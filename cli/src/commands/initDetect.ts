import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { TemplateName } from '../lib/scaffold';
import { type PackageManager, readInitPackageJson } from './initTypes';

/**
 * Resolve a package-manager name from the `packageManager` manifest field.
 *
 * @param value - Raw `packageManager` field value.
 * @returns Supported package manager, or null when the field is absent or unsupported.
 * @example
 * const pm = packageManagerFromManifest('pnpm@10.33.2');
 */
const packageManagerFromManifest = (value: string | undefined): PackageManager | null => {
  if (value === undefined || value === '') {
    return null;
  }
  if (value === 'pnpm' || value.startsWith('pnpm@')) {
    return 'pnpm';
  }
  if (value === 'npm' || value.startsWith('npm@')) {
    return 'npm';
  }
  if (value === 'yarn' || value.startsWith('yarn@')) {
    return 'yarn';
  }
  if (value === 'bun' || value.startsWith('bun@')) {
    return 'bun';
  }
  return null;
};

/**
 * Detect which package manager the project uses.
 *
 * @param cwd - Project directory to inspect.
 * @returns Detected package manager, or null when no lockfile/manifest marker exists.
 * @example
 * const pm = await detectPackageManager(process.cwd());
 */
export const detectPackageManager = async (cwd: string): Promise<PackageManager | null> => {
  const checks: Array<readonly [string, PackageManager]> = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
  ];
  const lockfileMatches = checks.map(([file, pm]) => ({
    found: existsSync(join(cwd, file)),
    pm,
  }));
  const match = lockfileMatches.find((entry) => entry.found);
  if (match !== undefined) {
    return match.pm;
  }

  const pkg = await readInitPackageJson(cwd);
  if (pkg === null) {
    return null;
  }
  return packageManagerFromManifest(pkg.packageManager);
};

/**
 * Detect which template type best matches the existing project.
 *
 * @param cwd - Project directory to inspect.
 * @returns Matching template name, or null when dependencies do not identify one.
 * @example
 * const template = await detectProjectType(process.cwd());
 */
export const detectProjectType = async (cwd: string): Promise<TemplateName | null> => {
  const pkg = await readInitPackageJson(cwd);
  if (pkg === null) {
    return null;
  }

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
  if (allDeps.expo !== undefined || allDeps['react-native'] !== undefined) {
    return 'mobile';
  }
  if (allDeps.wxt !== undefined || allDeps['webextension-polyfill'] !== undefined) {
    return 'extension';
  }
  if (allDeps.next !== undefined || allDeps.nuxt !== undefined) {
    return 'web';
  }
  if (
    allDeps.express !== undefined ||
    allDeps.fastify !== undefined ||
    allDeps.hono !== undefined
  ) {
    return 'backend';
  }
  if (allDeps.vite !== undefined || allDeps.react !== undefined) {
    return 'spa';
  }
  return null;
};
